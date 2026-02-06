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

    const content: any[] = [
      {
        type: "text",
        text: `Analiza estos archivos (confirmaciones, facturas, vouchers, cotizaciones) y extrae TODOS los servicios de viaje.

Para cada servicio identifica:
- Tipo de servicio (hotel, vuelo, traslado, tour, crucero, tren, dmc, u otro)
- Nombre del servicio (hotel, aerolínea, etc.)
- Fechas relevantes en formato YYYY-MM-DD
- Precio total del servicio en USD
- Comisión si está mencionada
- Número de confirmación
- Cualquier detalle relevante

Responde SOLO con un JSON válido con este formato:
{
  "services": [
    {
      "service_type": "hotel",
      "hotel_name": "Marriott",
      "check_in_date": "2026-03-15",
      "check_out_date": "2026-03-18",
      "total_price": 500,
      "commission": 50,
      "confirmation_number": "ABC123",
      "notes": "3 noches, habitación doble"
    }
  ]
}

Tipos de servicio: hotel, vuelo, traslado, tour, crucero, tren, dmc, otro`
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
      messages: [{ role: "user", content: content }],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    const data = JSON.parse(responseText!);

    if (!data.services || !Array.isArray(data.services)) {
      return Response.json({
        error: 'No services found in the files',
        details: 'La IA no pudo extraer servicios de los archivos'
      }, { status: 400 });
    }

    const createdServices = [];
    for (const service of data.services) {
      const serviceData = {
        sold_trip_id,
        service_type: service.service_type,
        total_price: service.total_price,
        commission: service.commission || 0,
        confirmation_number: service.confirmation_number || '',
        notes: service.notes || '',
        created_by: user.email,
        ...service
      };

      const { data: createdService, error } = await supabase
        .from('trip_services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;
      createdServices.push(createdService);
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
      message: `${createdServices.length} servicio(s) importado(s)`,
      services: createdServices
    });

  } catch (error) {
    console.error('Error importing services:', error);
    return Response.json({
      error: 'Failed to import services',
      details: error.message
    }, { status: 500 });
  }
});
