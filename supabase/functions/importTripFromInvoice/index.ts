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

    const { file_urls } = await req.json();

    if (!file_urls || !Array.isArray(file_urls) || file_urls.length === 0) {
      return Response.json({ error: 'file_urls array is required' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const content: any[] = [
      {
        type: "text",
        text: `Analiza esta factura o cotización de viaje y extrae TODA la información del viaje y sus servicios.

Extrae:
1. Información del viaje:
   - Nombre del cliente
   - Email y teléfono del cliente (si están disponibles)
   - Destino principal
   - Nombre descriptivo del viaje
   - Fecha de inicio y fin del viaje (formato YYYY-MM-DD)
   - Número de pasajeros
   - Precio total del viaje
   - Notas relevantes

2. Todos los servicios incluidos (opcional):
   - Tipo (hotel, vuelo, traslado, tour, crucero, tren, dmc, otro)
   - Nombre del servicio
   - Fechas relevantes
   - Precio
   - Detalles

Responde SOLO con un JSON válido con este formato:
{
  "trip": {
    "client_name": "Juan Pérez",
    "client_email": "juan@example.com",
    "client_phone": "+521234567890",
    "destination": "París",
    "trip_name": "Luna de Miel en París",
    "start_date": "2026-03-15",
    "end_date": "2026-03-22",
    "pax": 2,
    "total_price": 5000,
    "notes": "Incluye desayuno"
  },
  "services": [
    {
      "service_type": "hotel",
      "hotel_name": "Hotel Paris",
      "check_in_date": "2026-03-15",
      "check_out_date": "2026-03-18",
      "total_price": 800,
      "commission": 80
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
      messages: [{ role: "user", content: content }],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    const data = JSON.parse(responseText!);

    if (!data.trip) {
      return Response.json({
        error: 'No trip information found',
        details: 'La IA no pudo extraer información del viaje'
      }, { status: 400 });
    }

    // Check if client exists
    let client = null;
    if (data.trip.client_email) {
      const { data: existingClients } = await supabase
        .from('clients')
        .select('*')
        .eq('email', data.trip.client_email)
        .limit(1);

      if (existingClients && existingClients.length > 0) {
        client = existingClients[0];
      }
    }

    // If not found by email, search by name
    if (!client && data.trip.client_name) {
      const { data: existingClients } = await supabase
        .from('clients')
        .select('*')
        .eq('full_name', data.trip.client_name)
        .limit(1);

      if (existingClients && existingClients.length > 0) {
        client = existingClients[0];
      }
    }

    // Create new client if not found
    if (!client) {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          full_name: data.trip.client_name,
          email: data.trip.client_email || '',
          phone: data.trip.client_phone || '',
          created_by: user.email
        })
        .select()
        .single();

      if (error) throw error;
      client = newClient;
    }

    // Create the sold trip
    const { data: createdTrip, error: tripError } = await supabase
      .from('sold_trips')
      .insert({
        client_id: client.id,
        client_name: data.trip.client_name,
        destination: data.trip.destination,
        trip_name: data.trip.trip_name,
        start_date: data.trip.start_date || null,
        end_date: data.trip.end_date || null,
        pax: data.trip.pax || 1,
        total_price: data.trip.total_price || 0,
        total_commission: 0,
        total_paid_by_client: 0,
        total_paid_to_suppliers: 0,
        status: 'pendiente',
        notes: data.trip.notes || '',
        created_by: user.email
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Create services if available
    const createdServices = [];
    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      for (const service of data.services) {
        const { data: createdService, error } = await supabase
          .from('trip_services')
          .insert({
            sold_trip_id: createdTrip.id,
            service_type: service.service_type,
            total_price: service.total_price,
            commission: service.commission || 0,
            confirmation_number: service.confirmation_number || '',
            notes: service.notes || '',
            created_by: user.email,
            ...service
          })
          .select()
          .single();

        if (error) throw error;
        createdServices.push(createdService);
      }

      // Recalculate trip totals
      const totalPrice = createdServices.reduce((sum, s) => sum + (s.total_price || 0), 0);
      const totalCommission = createdServices.reduce((sum, s) => sum + (s.commission || 0), 0);

      await supabase
        .from('sold_trips')
        .update({
          total_price: totalPrice,
          total_commission: totalCommission
        })
        .eq('id', createdTrip.id);
    }

    return Response.json({
      success: true,
      message: `Viaje importado con ${createdServices.length} servicio(s)`,
      trip: createdTrip,
      services: createdServices,
      client: client
    });

  } catch (error) {
    console.error('Error importing trip:', error);
    return Response.json({
      error: 'Failed to import trip from invoice',
      details: error.message
    }, { status: 500 });
  }
});
