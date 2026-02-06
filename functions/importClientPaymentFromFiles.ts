import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_urls, sold_trip_id } = await req.json();

    if (!file_urls || !Array.isArray(file_urls) || file_urls.length === 0) {
      return Response.json({ error: 'file_urls array is required' }, { status: 400 });
    }

    if (!sold_trip_id) {
      return Response.json({ error: 'sold_trip_id is required' }, { status: 400 });
    }

    // Schema for client payment extraction
    const schema = {
      type: "object",
      properties: {
        payments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "Fecha del pago en formato YYYY-MM-DD" },
              amount_original: { type: "number", description: "Monto del pago" },
              currency: {
                type: "string",
                enum: ["USD", "MXN"],
                default: "USD",
                description: "Moneda del pago (USD o MXN)"
              },
              fx_rate: {
                type: "number",
                description: "Tipo de cambio si es MXN (ejemplo: 17.87). Null si es USD"
              },
              method: {
                type: "string",
                enum: ["efectivo", "transferencia", "tarjeta", "otro"],
                description: "Método de pago"
              },
              notes: {
                type: "string",
                description: "Notas, referencia de transferencia, número de confirmación, o detalles del pago"
              }
            },
            required: ["date", "amount_original", "currency", "method"]
          }
        }
      }
    };

    // Extract payments from files
    const extractResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analiza estos archivos (comprobantes de pago, transferencias, capturas de pantalla, recibos) y extrae TODOS los pagos realizados por el cliente.

      Para cada pago, identifica:
      - Fecha del pago (en formato YYYY-MM-DD)
      - Monto pagado
      - Moneda del pago (USD o MXN). Si no está claro, asume USD
      - Tipo de cambio si la moneda es MXN (el tipo de cambio MXN/USD, por ejemplo 17.87)
      - Método de pago (efectivo, transferencia, tarjeta, u otro)
      - Cualquier referencia, número de confirmación, o notas relevantes

      Si hay múltiples pagos en los archivos, extrae TODOS ellos como items separados en el array.
      Si la imagen muestra un comprobante de transferencia bancaria, extrae el número de referencia o folio.`,
      file_urls: file_urls,
      response_json_schema: schema
    });

    const data = extractResult;

    if (!data.payments || !Array.isArray(data.payments)) {
      return Response.json({
        error: 'No payments found in the files',
        details: 'La IA no pudo extraer pagos de los archivos'
      }, { status: 400 });
    }

    // Create all payments with the current user as creator
    const createdPayments = [];
    for (const payment of data.payments) {
      // Calculate amount_usd_fixed
      let amount_usd_fixed;
      let fx_rate = payment.fx_rate || null;

      if (payment.currency === 'USD') {
        amount_usd_fixed = payment.amount_original;
        fx_rate = null;
      } else {
        // MXN
        if (!fx_rate || fx_rate <= 0) {
          // If no FX rate provided, skip this payment or use default
          console.warn(`Skipping payment without FX rate: ${JSON.stringify(payment)}`);
          continue;
        }
        amount_usd_fixed = payment.amount_original / fx_rate;
      }

      const paymentData = {
        sold_trip_id,
        date: payment.date,
        currency: payment.currency,
        amount_original: payment.amount_original,
        fx_rate: fx_rate,
        amount_usd_fixed: amount_usd_fixed,
        amount: amount_usd_fixed,
        method: payment.method,
        status: 'reportado', // Default status for imported payments
        notes: payment.notes || '',
        created_by: user.email
      };

      const createdPayment = await base44.asServiceRole.entities.ClientPayment.create(paymentData);
      createdPayments.push(createdPayment);
    }

    // Update trip totals
    const allServices = await base44.asServiceRole.entities.TripService.filter({ sold_trip_id });
    const clientPayments = await base44.asServiceRole.entities.ClientPayment.filter({ sold_trip_id });

    const totalPrice = allServices.reduce((sum, s) => sum + (s.total_price || 0), 0);
    const totalCommission = allServices.reduce((sum, s) => sum + (s.commission || 0), 0);
    const totalPaidByClient = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    let status = 'pendiente';
    if (totalPaidByClient >= totalPrice && totalPrice > 0) {
      status = 'pagado';
    } else if (totalPaidByClient > 0) {
      status = 'parcial';
    }

    // Get total paid to suppliers
    const supplierPayments = await base44.asServiceRole.entities.SupplierPayment.filter({ sold_trip_id });
    const totalPaidToSuppliers = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    await base44.asServiceRole.entities.SoldTrip.update(sold_trip_id, {
      total_price: totalPrice,
      total_commission: totalCommission,
      total_paid_by_client: totalPaidByClient,
      total_paid_to_suppliers: totalPaidToSuppliers,
      status
    });

    return Response.json({
      success: true,
      message: `${createdPayments.length} pago(s) importado(s)`,
      payments: createdPayments
    });

  } catch (error) {
    console.error('Error importing client payments:', error);
    return Response.json({
      error: 'Failed to import client payments',
      details: error.message
    }, { status: 500 });
  }
});
