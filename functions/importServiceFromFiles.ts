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
                enum: ["hotel", "vuelo", "traslado", "tour", "crucero", "tren", "dmc", "otro"]
              },
              total_price: { type: "number" },
              commission: { type: "number" },
              booked_by: { 
                type: "string",
                enum: ["montecito", "iata_nomad"]
              },
              notes: { type: "string" },
              
              // Hotel fields
              hotel_name: { type: "string" },
              hotel_city: { type: "string" },
              hotel_chain: { type: "string" },
              check_in: { type: "string" },
              check_out: { type: "string" },
              room_type: { type: "string" },
              num_rooms: { type: "number" },
              nights: { type: "number" },
              reservation_number: { type: "string" },
              
              // Flight fields
              airline: { type: "string" },
              route: { type: "string" },
              flight_number: { type: "string" },
              flight_date: { type: "string" },
              departure_time: { type: "string" },
              arrival_time: { type: "string" },
              passengers: { type: "number" },
              flight_reservation_number: { type: "string" },
              
              // Transfer fields
              transfer_type: { type: "string", enum: ["privado", "compartido"] },
              transfer_origin: { type: "string" },
              transfer_destination: { type: "string" },
              transfer_datetime: { type: "string" },
              transfer_passengers: { type: "number" },
              
              // Tour fields
              tour_name: { type: "string" },
              tour_city: { type: "string" },
              tour_date: { type: "string" },
              tour_people: { type: "number" },
              tour_reservation_number: { type: "string" },
              
              // Cruise fields
              cruise_line: { type: "string" },
              cruise_ship: { type: "string" },
              cruise_departure_date: { type: "string" },
              cruise_nights: { type: "number" },
              cruise_passengers: { type: "number" },
              cruise_reservation_number: { type: "string" },
              
              // Train fields
              train_route: { type: "string" },
              train_operator: { type: "string" },
              train_date: { type: "string" },
              train_passengers: { type: "number" },
              train_reservation_number: { type: "string" },
              
              // DMC fields
              dmc_name: { type: "string" },
              dmc_services: { type: "string" },
              dmc_destination: { type: "string" },
              dmc_date: { type: "string" },
              dmc_passengers: { type: "number" },
              
              // Other fields
              other_name: { type: "string" },
              other_description: { type: "string" },
              other_date: { type: "string" }
            },
            required: ["service_type", "total_price"]
          }
        }
      }
    };

    // Extract services from files
    const extractResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analiza estos archivos (facturas, confirmaciones, vouchers o imágenes) y extrae TODOS los servicios de viaje incluidos.
      
      Para cada servicio, identifica:
      - Tipo de servicio (hotel, vuelo, traslado, tour, crucero, tren, dmc, otro)
      - Precio total del servicio
      - Comisión (si está especificada)
      - Todos los detalles específicos según el tipo de servicio (nombre de hotel, aerolínea, fechas, número de confirmación, etc.)
      - Notas o información adicional relevante
      
      Si hay múltiples servicios en los archivos, extrae TODOS ellos como items separados en el array.`,
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