import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, MapPin } from 'lucide-react';

const SERVICE_LABELS = {
  hotel: 'Hotel',
  vuelo: 'Vuelo',
  traslado: 'Traslado',
  tour: 'Tour',
  otro: 'Servicio'
};

export default function InvoiceView({ open, onClose, soldTrip, services }) {
  if (!soldTrip) return null;

  const getServiceName = (service) => {
    switch (service.service_type) {
      case 'hotel':
        return service.hotel_name || 'Hotel';
      case 'vuelo':
        return `${service.airline || 'Vuelo'} - ${service.route || ''}`;
      case 'traslado':
        return `Traslado ${service.transfer_origin || ''} → ${service.transfer_destination || ''}`;
      case 'tour':
        return service.tour_name || 'Tour';
      case 'otro':
        return service.other_name || 'Servicio';
      default:
        return SERVICE_LABELS[service.service_type] || 'Servicio';
    }
  };

  const MEAL_PLAN_LABELS = {
    solo_habitacion: 'Solo habitación',
    desayuno: 'Desayuno incluido',
    all_inclusive: 'All Inclusive'
  };

  const getServiceDetails = (service) => {
    const details = [];
    
    switch (service.service_type) {
      case 'hotel':
        if (service.hotel_city) details.push(service.hotel_city);
        if (service.check_in && service.check_out) {
          details.push(`${format(new Date(service.check_in), 'd MMM', { locale: es })} - ${format(new Date(service.check_out), 'd MMM yyyy', { locale: es })}`);
        }
        if (service.nights) details.push(`${service.nights} noches`);
        if (service.num_rooms) details.push(`${service.num_rooms} habitación(es)`);
        if (service.room_type) details.push(service.room_type);
        if (service.meal_plan) details.push(MEAL_PLAN_LABELS[service.meal_plan] || service.meal_plan);
        if (service.reservation_number) details.push(`Reserva: ${service.reservation_number}`);
        break;
      case 'vuelo':
        if (service.flight_date) details.push(format(new Date(service.flight_date), 'd MMM yyyy', { locale: es }));
        if (service.flight_number) details.push(`Vuelo ${service.flight_number}`);
        if (service.departure_time && service.arrival_time) details.push(`${service.departure_time} - ${service.arrival_time}`);
        if (service.passengers) details.push(`${service.passengers} pasajero(s)`);
        if (service.flight_class) details.push(service.flight_class);
        if (service.baggage_included) details.push(`Equipaje: ${service.baggage_included}`);
        if (service.flight_reservation_number) details.push(`Reserva: ${service.flight_reservation_number}`);
        break;
      case 'traslado':
        if (service.transfer_datetime) details.push(format(new Date(service.transfer_datetime), 'd MMM yyyy HH:mm', { locale: es }));
        if (service.transfer_type) details.push(service.transfer_type === 'privado' ? 'Privado' : 'Compartido');
        if (service.vehicle) details.push(service.vehicle);
        if (service.transfer_passengers) details.push(`${service.transfer_passengers} pasajero(s)`);
        break;
      case 'tour':
        if (service.tour_city) details.push(service.tour_city);
        if (service.tour_date) details.push(format(new Date(service.tour_date), 'd MMM yyyy', { locale: es }));
        if (service.tour_duration) details.push(service.tour_duration);
        if (service.tour_people) details.push(`${service.tour_people} persona(s)`);
        if (service.tour_includes) details.push(`Incluye: ${service.tour_includes}`);
        if (service.tour_reservation_number) details.push(`Reserva: ${service.tour_reservation_number}`);
        break;
      case 'otro':
        if (service.other_date) details.push(format(new Date(service.other_date), 'd MMM yyyy', { locale: es }));
        if (service.other_description) details.push(service.other_description);
        break;
    }
    
    return details;
  };

  const total = services.reduce((sum, s) => sum + (s.total_price || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            Invoice
          </DialogTitle>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
        </DialogHeader>

        <div className="mt-6 print:mt-0" id="invoice-content">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#2E442A' }}
              >
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#2E442A' }}>Nomad Travel Society</h2>
                <p className="text-xs text-stone-500">San Pedro Garza García, N.L.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500">Fecha</p>
              <p className="font-medium">{format(new Date(), 'd MMMM yyyy', { locale: es })}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-stone-500 mb-2">Cliente</h3>
            <p className="text-lg font-semibold text-stone-800">{soldTrip.client_name}</p>
            <p className="text-sm text-stone-600">
              Viaje: {soldTrip.destination} | {format(new Date(soldTrip.start_date), 'd MMM yyyy', { locale: es })}
              {soldTrip.end_date && ` - ${format(new Date(soldTrip.end_date), 'd MMM yyyy', { locale: es })}`}
            </p>
            <p className="text-sm text-stone-600">{soldTrip.travelers} viajero(s)</p>
          </div>

          {/* Services Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-stone-200">
                  <th className="text-left py-3 text-sm font-semibold text-stone-600">Servicio</th>
                  <th className="text-left py-3 text-sm font-semibold text-stone-600">Detalle</th>
                  <th className="text-right py-3 text-sm font-semibold text-stone-600">Precio</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => {
                  const details = getServiceDetails(service);
                  return (
                    <tr key={index} className="border-b border-stone-100">
                      <td className="py-3">
                        <span 
                          className="px-2 py-1 rounded-md text-xs font-medium"
                          style={{ backgroundColor: '#2E442A15', color: '#2E442A' }}
                        >
                          {SERVICE_LABELS[service.service_type]}
                        </span>
                        <p className="font-medium text-stone-800 mt-1">{getServiceName(service)}</p>
                      </td>
                      <td className="py-3 text-sm text-stone-600">
                        <ul className="space-y-0.5">
                          {details.map((detail, i) => (
                            <li key={i}>• {detail}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 text-right font-semibold align-top">
                        ${(service.total_price || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-medium">${total.toLocaleString()}</span>
              </div>
              <div 
                className="flex justify-between pt-3 border-t-2"
                style={{ borderColor: '#2E442A' }}
              >
                <span className="font-semibold" style={{ color: '#2E442A' }}>Total</span>
                <span className="text-xl font-bold" style={{ color: '#2E442A' }}>
                  ${total.toLocaleString()} MXN
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-stone-200 text-center">
            <p className="text-sm text-stone-500">
              Gracias por confiar en Nomad Travel Society
            </p>
            <p className="text-xs text-stone-400 mt-1">
              contacto@nomadtravelsociety.com | San Pedro Garza García, N.L.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}