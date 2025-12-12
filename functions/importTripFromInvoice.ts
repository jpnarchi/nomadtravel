import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_urls, agent_email } = await req.json();

    if (!file_urls || !Array.isArray(file_urls) || file_urls.length === 0) {
      return Response.json({ error: 'file_urls array is required' }, { status: 400 });
    }

    // Validate and assign agent
    let assignedAgent = user.email; // Default to current user
    
    if (agent_email) {
      const agentUser = await base44.asServiceRole.entities.User.filter({ email: agent_email });
      if (agentUser.length > 0) {
        assignedAgent = agentUser[0].email;
      }
    }

    // Define schema for data extraction
    const schema = {
      type: "object",
      properties: {
        client_name: { type: "string", description: "Nombre del cliente" },
        destination: { type: "string", description: "Destino del viaje" },
        start_date: { type: "string", description: "Fecha de inicio (YYYY-MM-DD)" },
        end_date: { type: "string", description: "Fecha de fin (YYYY-MM-DD)" },
        travelers: { type: "number", description: "Número de viajeros" },
        total_price: { type: "number", description: "Precio total del viaje" },
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
              total_price: { type: "number", description: "Precio del servicio" },
              commission: { type: "number", description: "Comisión del servicio" },
              hotel_name: { type: "string" },
              hotel_city: { type: "string" },
              check_in: { type: "string" },
              check_out: { type: "string" },
              nights: { type: "number" },
              airline: { type: "string" },
              route: { type: "string" },
              flight_date: { type: "string" },
              notes: { type: "string" }
            }
          }
        },
        payments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              amount: { type: "number" },
              method: { type: "string" }
            }
          }
        }
      }
    };

    // Extract data from all files (combine them for better context)
    const extractResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analiza estos archivos (invoices, facturas, o imágenes de servicios) y extrae toda la información del viaje vendido. 
      
      Extrae: nombre del cliente, destino, fechas, número de viajeros, precio total, todos los servicios incluidos (hoteles, vuelos, traslados, tours, etc.) con sus detalles y precios, y los pagos realizados.
      
      Si hay múltiples archivos, combina toda la información en un solo viaje.`,
      file_urls: file_urls,
      response_json_schema: schema
    });

    const data = extractResult;

    // Create client if doesn't exist
    let client = null;
    if (data.client_name) {
      const existingClients = await base44.asServiceRole.entities.Client.filter({ 
        first_name: data.client_name.split(' ')[0],
        created_by: assignedAgent
      });
      
      if (existingClients.length > 0) {
        client = existingClients[0];
      } else {
        const nameParts = data.client_name.split(' ');
        client = await base44.asServiceRole.entities.Client.create({
          first_name: nameParts[0] || data.client_name,
          last_name: nameParts.slice(1).join(' ') || '',
          email: `${data.client_name.toLowerCase().replace(/\s+/g, '.')}@imported.com`,
          created_by: assignedAgent
        });
      }
    }

    // Create sold trip
    const soldTrip = await base44.asServiceRole.entities.SoldTrip.create({
      trip_id: '',
      client_id: client?.id || '',
      client_name: data.client_name || '',
      destination: data.destination || '',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      travelers: data.travelers || 1,
      total_price: data.total_price || 0,
      total_commission: 0,
      total_paid_by_client: 0,
      total_paid_to_suppliers: 0,
      status: 'pendiente',
      created_by: assignedAgent
    });

    // Create services
    let totalCommission = 0;
    if (data.services && Array.isArray(data.services)) {
      for (const service of data.services) {
        await base44.asServiceRole.entities.TripService.create({
          sold_trip_id: soldTrip.id,
          service_type: service.service_type || 'otro',
          total_price: service.total_price || 0,
          commission: service.commission || 0,
          booked_by: 'montecito',
          hotel_name: service.hotel_name,
          hotel_city: service.hotel_city,
          check_in: service.check_in,
          check_out: service.check_out,
          nights: service.nights,
          airline: service.airline,
          route: service.route,
          flight_date: service.flight_date,
          notes: service.notes,
          created_by: assignedAgent
        });
        totalCommission += service.commission || 0;
      }
    }

    // Create client payments
    let totalPaid = 0;
    if (data.payments && Array.isArray(data.payments)) {
      for (const payment of data.payments) {
        await base44.asServiceRole.entities.ClientPayment.create({
          sold_trip_id: soldTrip.id,
          date: payment.date || new Date().toISOString().split('T')[0],
          amount: payment.amount || 0,
          method: payment.method || 'transferencia',
          created_by: assignedAgent
        });
        totalPaid += payment.amount || 0;
      }
    }

    // Update totals
    await base44.asServiceRole.entities.SoldTrip.update(soldTrip.id, {
      total_commission: totalCommission,
      total_paid_by_client: totalPaid,
      status: totalPaid >= (data.total_price || 0) ? 'pagado' : totalPaid > 0 ? 'parcial' : 'pendiente'
    });

    return Response.json({
      success: true,
      sold_trip_id: soldTrip.id,
      message: 'Viaje importado exitosamente'
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ 
      error: error.message || 'Error importing trip' 
    }, { status: 500 });
  }
});