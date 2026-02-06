import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_urls } = await req.json();

    if (!file_urls || !Array.isArray(file_urls) || file_urls.length === 0) {
      return Response.json({ error: 'file_urls array is required' }, { status: 400 });
    }

    // Schema for trip extraction from invoice
    const schema = {
      type: "object",
      properties: {
        trip: {
          type: "object",
          properties: {
            client_name: { type: "string", description: "Nombre completo del cliente" },
            client_email: { type: "string", description: "Email del cliente (si está disponible)" },
            client_phone: { type: "string", description: "Teléfono del cliente (si está disponible)" },
            destination: { type: "string", description: "Destino principal del viaje" },
            trip_name: { type: "string", description: "Nombre descriptivo del viaje" },
            start_date: { type: "string", description: "Fecha de inicio del viaje en formato YYYY-MM-DD" },
            end_date: { type: "string", description: "Fecha de fin del viaje en formato YYYY-MM-DD" },
            pax: { type: "number", description: "Número de pasajeros", default: 1 },
            total_price: { type: "number", description: "Precio total del viaje en USD" },
            notes: { type: "string", description: "Notas o detalles adicionales del viaje" }
          },
          required: ["client_name", "destination", "trip_name", "total_price"]
        },
        services: {
          type: "array",
          items: {
            type: "object",
            properties: {
              service_type: {
                type: "string",
                enum: ["hotel", "vuelo", "traslado", "tour", "crucero", "tren", "dmc", "otro"],
                description: "Tipo de servicio"
              },
              // Hotel fields
              hotel_name: { type: "string" },
              hotel_chain: { type: "string" },
              check_in_date: { type: "string" },
              check_out_date: { type: "string" },
              room_type: { type: "string" },
              nights: { type: "number" },

              // Flight fields
              airline: { type: "string" },
              route: { type: "string" },
              flight_date: { type: "string" },
              flight_number: { type: "string" },
              flight_class: { type: "string" },

              // Transfer fields
              transfer_origin: { type: "string" },
              transfer_destination: { type: "string" },
              transfer_date: { type: "string" },
              transfer_type: { type: "string" },

              // Tour fields
              tour_name: { type: "string" },
              tour_date: { type: "string" },
              tour_duration: { type: "string" },

              // Cruise fields
              cruise_line: { type: "string" },
              cruise_ship: { type: "string" },
              embarkation_date: { type: "string" },
              disembarkation_date: { type: "string" },
              cabin_type: { type: "string" },

              // Train fields
              train_operator: { type: "string" },
              train_route: { type: "string" },
              train_date: { type: "string" },
              train_class: { type: "string" },

              // DMC fields
              dmc_name: { type: "string" },
              dmc_service_date: { type: "string" },

              // Other fields
              other_name: { type: "string" },
              other_date: { type: "string" },

              // Common fields
              total_price: { type: "number", description: "Precio del servicio en USD" },
              commission: { type: "number", description: "Comisión en USD" },
              confirmation_number: { type: "string" },
              notes: { type: "string" }
            },
            required: ["service_type", "total_price"]
          }
        }
      }
    };

    // Extract trip and services from invoice
    const extractResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analiza esta factura o cotización de viaje y extrae TODA la información del viaje y sus servicios.

      Extrae:
      1. Información del viaje:
         - Nombre del cliente
         - Email y teléfono del cliente (si están disponibles)
         - Destino principal
         - Nombre descriptivo del viaje
         - Fecha de inicio y fin del viaje
         - Número de pasajeros
         - Precio total del viaje
         - Notas o detalles relevantes

      2. Todos los servicios incluidos en el viaje:
         - Hoteles (nombre, fechas de check-in/out, noches, tipo de habitación, precio)
         - Vuelos (aerolínea, ruta, fecha, número de vuelo, clase, precio)
         - Traslados (origen, destino, fecha, tipo, precio)
         - Tours y actividades (nombre, fecha, duración, precio)
         - Cruceros (línea, barco, fechas de embarque/desembarque, tipo de cabina, precio)
         - Trenes (operador, ruta, fecha, clase, precio)
         - Servicios DMC (nombre, fecha, precio)
         - Otros servicios (nombre, fecha, precio)

      Extrae TODOS los servicios listados en la factura como items separados.
      Si no hay servicios desglosados, deja el array de services vacío.
      Las fechas deben estar en formato YYYY-MM-DD.`,
      file_urls: file_urls,
      response_json_schema: schema
    });

    const data = extractResult;

    if (!data.trip) {
      return Response.json({
        error: 'No trip information found in the files',
        details: 'La IA no pudo extraer información del viaje'
      }, { status: 400 });
    }

    // Check if client exists or create new one
    let client = null;
    if (data.trip.client_email) {
      const existingClients = await base44.asServiceRole.entities.Client.filter({
        email: data.trip.client_email
      });
      if (existingClients && existingClients.length > 0) {
        client = existingClients[0];
      }
    }

    // If no client found by email, search by name
    if (!client && data.trip.client_name) {
      const existingClients = await base44.asServiceRole.entities.Client.filter({
        full_name: data.trip.client_name
      });
      if (existingClients && existingClients.length > 0) {
        client = existingClients[0];
      }
    }

    // Create new client if not found
    if (!client) {
      client = await base44.asServiceRole.entities.Client.create({
        full_name: data.trip.client_name,
        email: data.trip.client_email || '',
        phone: data.trip.client_phone || '',
        created_by: user.email
      });
    }

    // Create the sold trip
    const tripData = {
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
    };

    const createdTrip = await base44.asServiceRole.entities.SoldTrip.create(tripData);

    // Create services if available
    const createdServices = [];
    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      for (const service of data.services) {
        const serviceData = {
          sold_trip_id: createdTrip.id,
          service_type: service.service_type,
          total_price: service.total_price,
          commission: service.commission || 0,
          confirmation_number: service.confirmation_number || '',
          notes: service.notes || '',
          created_by: user.email,
          ...service
        };

        const createdService = await base44.asServiceRole.entities.TripService.create(serviceData);
        createdServices.push(createdService);
      }

      // Recalculate trip totals
      const totalPrice = createdServices.reduce((sum, s) => sum + (s.total_price || 0), 0);
      const totalCommission = createdServices.reduce((sum, s) => sum + (s.commission || 0), 0);

      await base44.asServiceRole.entities.SoldTrip.update(createdTrip.id, {
        total_price: totalPrice,
        total_commission: totalCommission
      });
    }

    return Response.json({
      success: true,
      message: `Viaje importado con ${createdServices.length} servicio(s)`,
      trip: createdTrip,
      services: createdServices,
      client: client
    });

  } catch (error) {
    console.error('Error importing trip from invoice:', error);
    return Response.json({
      error: 'Failed to import trip from invoice',
      details: error.message
    }, { status: 500 });
  }
});
