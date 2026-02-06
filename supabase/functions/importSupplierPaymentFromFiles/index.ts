import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4.28.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_urls, sold_trip_id } = await req.json();

    if (!file_urls || !Array.isArray(file_urls) || file_urls.length === 0) {
      return Response.json({ error: 'file_urls array is required' }, { status: 400 });
    }

    if (!sold_trip_id) {
      return Response.json({ error: 'sold_trip_id is required' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Prepare content for OpenAI
    const content: any[] = [
      {
        type: "text",
        text: `Analiza estos archivos (comprobantes de pago, transferencias, facturas de proveedores) y extrae TODOS los pagos realizados a proveedores.

Para cada pago, identifica:
- Nombre del proveedor (hotel, aerolínea, DMC, etc.)
- Fecha del pago (en formato YYYY-MM-DD)
- Monto pagado
- Tipo de pago (neto o bruto)
- Método de pago (transferencia, ms_beyond, capital_one_blue, capital_one_green, amex, tarjeta_cliente)
- Cualquier referencia, número de confirmación o notas relevantes

Si hay múltiples pagos en los archivos, extrae TODOS ellos como items separados en el array.

Responde SOLO con un JSON válido con este formato:
{
  "payments": [
    {
      "supplier": "nombre del proveedor",
      "date": "YYYY-MM-DD",
      "amount": 1000,
      "payment_type": "neto",
      "method": "transferencia",
      "notes": "referencia o notas",
      "confirmed": false
    }
  ]
}`
      }
    ];

    for (const url of file_urls) {
      content.push({
        type: "image_url",
        image_url: { url }
      });
    }

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
      const paymentData = {
        sold_trip_id,
        ...payment,
        created_by: user.email
      };

      const { data: createdPayment, error } = await supabase
        .from('supplier_payments')
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

    const { data: allSupplierPayments } = await supabase
      .from('supplier_payments')
      .select('*')
      .eq('sold_trip_id', sold_trip_id);

    const totalPrice = (allServices || []).reduce((sum, s) => sum + (s.total_price || 0), 0);
    const totalCommission = (allServices || []).reduce((sum, s) => sum + (s.commission || 0), 0);
    const totalPaidByClient = (clientPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaidToSuppliers = (allSupplierPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

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
    console.error('Error importing supplier payments:', error);
    return Response.json({
      error: 'Failed to import supplier payments',
      details: error.message
    }, { status: 500 });
  }
});
