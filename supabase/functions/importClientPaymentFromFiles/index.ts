import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4.28.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { file_urls, sold_trip_id } = await req.json();

    if (!file_urls || !Array.isArray(file_urls) || file_urls.length === 0) {
      return Response.json({ error: 'file_urls array is required' }, { status: 400 });
    }

    if (!sold_trip_id) {
      return Response.json({ error: 'sold_trip_id is required' }, { status: 400 });
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });

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
      },
      required: ["payments"]
    };

    // Prepare content for OpenAI (images from URLs)
    const content: any[] = [
      {
        type: "text",
        text: `Analiza estos archivos (comprobantes de pago, transferencias, capturas de pantalla, recibos) y extrae TODOS los pagos realizados por el cliente.

Para cada pago, identifica:
- Fecha del pago (en formato YYYY-MM-DD)
- Monto pagado
- Moneda del pago (USD o MXN). Si no está claro, asume USD
- Tipo de cambio si la moneda es MXN (el tipo de cambio MXN/USD, por ejemplo 17.87)
- Método de pago (efectivo, transferencia, tarjeta, u otro)
- Cualquier referencia, número de confirmación, o notas relevantes

Si hay múltiples pagos en los archivos, extrae TODOS ellos como items separados en el array.
Si la imagen muestra un comprobante de transferencia bancaria, extrae el número de referencia o folio.

Responde SOLO con un JSON válido siguiendo el schema proporcionado.`
      }
    ];

    // Add all file URLs as images
    for (const url of file_urls) {
      content.push({
        type: "image_url",
        image_url: { url }
      });
    }

    // Call OpenAI Vision API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    const data = JSON.parse(responseText!);

    if (!data.payments || !Array.isArray(data.payments)) {
      return Response.json({
        error: 'No payments found in the files',
        details: 'La IA no pudo extraer pagos de los archivos'
      }, { status: 400 });
    }

    // Create all payments
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
        status: 'reportado',
        notes: payment.notes || '',
        created_by: user.email
      };

      const { data: createdPayment, error } = await supabase
        .from('client_payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      createdPayments.push(createdPayment);
    }

    // Update trip totals
    const { data: allServices } = await supabase
      .from('trip_services')
      .select('*')
      .eq('sold_trip_id', sold_trip_id);

    const { data: clientPayments } = await supabase
      .from('client_payments')
      .select('*')
      .eq('sold_trip_id', sold_trip_id);

    const { data: supplierPayments } = await supabase
      .from('supplier_payments')
      .select('*')
      .eq('sold_trip_id', sold_trip_id);

    const totalPrice = (allServices || []).reduce((sum, s) => sum + (s.total_price || 0), 0);
    const totalCommission = (allServices || []).reduce((sum, s) => sum + (s.commission || 0), 0);
    const totalPaidByClient = (clientPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaidToSuppliers = (supplierPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    let status = 'pendiente';
    if (totalPaidByClient >= totalPrice && totalPrice > 0) {
      status = 'pagado';
    } else if (totalPaidByClient > 0) {
      status = 'parcial';
    }

    await supabase
      .from('sold_trips')
      .update({
        total_price: totalPrice,
        total_commission: totalCommission,
        total_paid_by_client: totalPaidByClient,
        total_paid_to_suppliers: totalPaidToSuppliers,
        status
      })
      .eq('id', sold_trip_id);

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
