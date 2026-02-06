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

    // Schema for service extraction
    const schema = {
      type: "object",
      properties: {
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
              hotel_name: { type: "string", description: "Nombre del hotel (si aplica)" },
              hotel_chain: { type: "string", description: "Cadena hotelera (si aplica)" },
              check_in_date: { type: "string", description: "Fecha de check-in en formato YYYY-MM-DD (si aplica)" },
              check_out_date: { type: "string", description: "Fecha de check-out en formato YYYY-MM-DD (si aplica)" },
              room_type: { type: "string", description: "Tipo de habitación (si aplica)" },
              nights: { type: "number", description: "Número de noches (si aplica)" },

              // Flight fields
              airline: { type: "string", description: "Aerolínea (si aplica)" },
              route: { type: "string", description: "Ruta del vuelo, ej: MEX-CDG (si aplica)" },
              flight_date: { type: "string", description: "Fecha del vuelo en formato YYYY-MM-DD (si aplica)" },
              flight_number: { type: "string", description: "Número de vuelo (si aplica)" },
              flight_class: { type: "string", description: "Clase del vuelo (Economy, Business, etc.) (si aplica)" },

              // Transfer fields
              transfer_origin: { type: "string", description: "Origen del traslado (si aplica)" },
              transfer_destination: { type: "string", description: "Destino del traslado (si aplica)" },
              transfer_date: { type: "string", description: "Fecha del traslado en formato YYYY-MM-DD (si aplica)" },
              transfer_type: { type: "string", description: "Tipo de traslado (privado, compartido, etc.) (si aplica)" },

              // Tour fields
              tour_name: { type: "string", description: "Nombre del tour (si aplica)" },
              tour_date: { type: "string", description: "Fecha del tour en formato YYYY-MM-DD (si aplica)" },
              tour_duration: { type: "string", description: "Duración del tour (si aplica)" },

              // Cruise fields
              cruise_line: { type: "string", description: "Línea de crucero (si aplica)" },
              cruise_ship: { type: "string", description: "Nombre del barco (si aplica)" },
              embarkation_date: { type: "string", description: "Fecha de embarque en formato YYYY-MM-DD (si aplica)" },
              disembarkation_date: { type: "string", description: "Fecha de desembarque en formato YYYY-MM-DD (si aplica)" },
              cabin_type: { type: "string", description: "Tipo de cabina (si aplica)" },

              // Train fields
              train_operator: { type: "string", description: "Operador de tren (si aplica)" },
              train_route: { type: "string", description: "Ruta del tren (si aplica)" },
              train_date: { type: "string", description: "Fecha del viaje en tren en formato YYYY-MM-DD (si aplica)" },
              train_class: { type: "string", description: "Clase del tren (si aplica)" },

              // DMC fields
              dmc_name: { type: "string", description: "Nombre del DMC (si aplica)" },
              dmc_service_date: { type: "string", description: "Fecha del servicio DMC en formato YYYY-MM-DD (si aplica)" },

              // Other service fields
              other_name: { type: "string", description: "Nombre del servicio (si es otro tipo)" },
              other_date: { type: "string", description: "Fecha del servicio en formato YYYY-MM-DD (si es otro tipo)" },

              // Common fields
              total_price: { type: "number", description: "Precio total del servicio en USD" },
              commission: { type: "number", description: "Comisión en USD (si está especificada)" },
              confirmation_number: { type: "string", description: "Número de confirmación del servicio" },
              notes: { type: "string", description: "Notas o detalles adicionales del servicio" }
            },
            required: ["service_type", "total_price"]
          }
        }
      }
    };

    // Extract services from files
    const extractResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analiza estos archivos (confirmaciones, facturas, vouchers, cotizaciones) y extrae TODOS los servicios de viaje.

      Para cada servicio identifica:
      - Tipo de servicio (hotel, vuelo, traslado, tour, crucero, tren, dmc, u otro)
      - Campos específicos del tipo de servicio (nombre de hotel, aerolínea, fechas, etc.)
      - Precio total del servicio en USD
      - Comisión si está mencionada
      - Número de confirmación
      - Cualquier nota o detalle relevante

      Tipos de servicio:
      - hotel: Hoteles y alojamiento
      - vuelo: Vuelos y billetes de avión
      - traslado: Transfers, traslados aeropuerto-hotel, etc.
      - tour: Tours, excursiones, actividades
      - crucero: Cruceros
      - tren: Viajes en tren
      - dmc: Servicios de DMC (Destination Management Company)
      - otro: Cualquier otro servicio

      Si hay múltiples servicios en los archivos, extrae TODOS ellos como items separados en el array.
      Intenta ser lo más detallado posible con la información disponible.`,
      file_urls: file_urls,
      response_json_schema: schema
    });

    const data = extractResult;

    if (!data.services || !Array.isArray(data.services)) {
      return Response.json({
        error: 'No services found in the files',
        details: 'La IA no pudo extraer servicios de los archivos'
      }, { status: 400 });
    }

    // Create all services
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

        // Include type-specific fields
        ...service
      };

      const createdService = await base44.asServiceRole.entities.TripService.create(serviceData);
      createdServices.push(createdService);
    }

    // Update trip totals
    const allServices = await base44.asServiceRole.entities.TripService.filter({ sold_trip_id });
    const clientPayments = await base44.asServiceRole.entities.ClientPayment.filter({ sold_trip_id });
    const supplierPayments = await base44.asServiceRole.entities.SupplierPayment.filter({ sold_trip_id });

    const totalPrice = allServices.reduce((sum, s) => sum + (s.total_price || 0), 0);
    const totalCommission = allServices.reduce((sum, s) => sum + (s.commission || 0), 0);
    const totalPaidByClient = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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
