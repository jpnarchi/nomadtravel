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
              amount: { type: "number", description: "Monto del pago" },
              method: { 
                type: "string",
                enum: ["efectivo", "transferencia", "tarjeta", "otro"],
                description: "Método de pago"
              },
              notes: { type: "string", description: "Notas o referencia del pago" },
              confirmed: { type: "boolean", default: false }
            },
            required: ["date", "amount", "method"]
          }
        }
      }
    };

    // Extract payments from files
    const extractResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analiza estos archivos (comprobantes de pago, transferencias, capturas de pantalla) y extrae TODOS los pagos recibidos del cliente.
      
      Para cada pago, identifica:
      - Fecha del pago (en formato YYYY-MM-DD)
      - Monto pagado
      - Método de pago (efectivo, transferencia, tarjeta, u otro)
      - Cualquier referencia, número de confirmación o notas relevantes
      
      Si hay múltiples pagos en los archivos, extrae TODOS ellos como items separados en el array.`,
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

    // Get the sold trip to inherit the agent
    const soldTrip = await base44.asServiceRole.entities.SoldTrip.filter({ id: sold_trip_id });
    const agentEmail = soldTrip[0]?.created_by || user.email;

    // Create all payments
    const createdPayments = [];
    for (const payment of data.payments) {
      const paymentData = {
        sold_trip_id,
        ...payment,
        created_by: agentEmail
      };

      const createdPayment = await base44.asServiceRole.entities.ClientPayment.create(paymentData);
      createdPayments.push(createdPayment);
    }

    // Update trip totals
    const allServices = await base44.asServiceRole.entities.TripService.filter({ sold_trip_id });
    const allClientPayments = await base44.asServiceRole.entities.ClientPayment.filter({ sold_trip_id });
    const supplierPayments = await base44.asServiceRole.entities.SupplierPayment.filter({ sold_trip_id });

    const totalPrice = allServices.reduce((sum, s) => sum + (s.total_price || 0), 0);
    const totalCommission = allServices.reduce((sum, s) => sum + (s.commission || 0), 0);
    const totalPaidByClient = allClientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaidToSuppliers = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    let status = 'pendiente';
    if (totalPaidByClient >= totalPrice && totalPrice > 0) {
      status = 'pagado';
    } else if (totalPaidByClient > 0) {
      status = 'parcial';
    }

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