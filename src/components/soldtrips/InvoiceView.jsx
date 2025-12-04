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

export default function InvoiceView({ open, onClose, soldTrip, services, clientPayments = [] }) {
  if (!soldTrip) return null;

  const totalPaid = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

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

  const getServiceDetails = (service) => {
    switch (service.service_type) {
      case 'hotel':
        const hotelParts = [];
        if (service.hotel_city) hotelParts.push(service.hotel_city);
        if (service.check_in && service.check_out) {
          hotelParts.push(`${format(new Date(service.check_in), 'd MMM', { locale: es })} - ${format(new Date(service.check_out), 'd MMM', { locale: es })}`);
        }
        if (service.nights) hotelParts.push(`${service.nights} noches`);
        if (service.room_type) hotelParts.push(service.room_type);
        if (service.num_rooms && service.num_rooms > 1) hotelParts.push(`${service.num_rooms} habs`);
        return hotelParts.join(' · ');
      case 'vuelo':
        const flightParts = [];
        if (service.flight_date) flightParts.push(format(new Date(service.flight_date), 'd MMM', { locale: es }));
        if (service.flight_number) flightParts.push(`#${service.flight_number}`);
        if (service.flight_class) flightParts.push(service.flight_class);
        if (service.passengers) flightParts.push(`${service.passengers} pax`);
        return flightParts.join(' · ');
      case 'traslado':
        const transferParts = [];
        if (service.transfer_type) transferParts.push(service.transfer_type === 'privado' ? 'Privado' : 'Compartido');
        if (service.transfer_passengers) transferParts.push(`${service.transfer_passengers} pax`);
        if (service.vehicle) transferParts.push(service.vehicle);
        return transferParts.join(' · ');
      case 'tour':
        const tourParts = [];
        if (service.tour_city) tourParts.push(service.tour_city);
        if (service.tour_date) tourParts.push(format(new Date(service.tour_date), 'd MMM', { locale: es }));
        if (service.tour_duration) tourParts.push(service.tour_duration);
        if (service.tour_people) tourParts.push(`${service.tour_people} pax`);
        return tourParts.join(' · ');
      case 'otro':
        return service.other_description || '';
      default:
        return '';
    }
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-stone-200">
                  <th className="text-left py-2 font-semibold text-stone-600">Servicio</th>
                  <th className="text-right py-2 font-semibold text-stone-600">Precio</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={index} className="border-b border-stone-100">
                    <td className="py-2">
                      <div className="flex items-start gap-2">
                        <span 
                          className="px-1.5 py-0.5 rounded text-xs font-medium shrink-0 mt-0.5"
                          style={{ backgroundColor: '#2E442A15', color: '#2E442A' }}
                        >
                          {SERVICE_LABELS[service.service_type]}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-stone-800 text-sm">{getServiceName(service)}</p>
                          <p className="text-xs text-stone-500">{getServiceDetails(service)}</p>
                          {service.reservation_number && (
                            <p className="text-xs text-stone-400">Conf: {service.reservation_number}</p>
                          )}
                          {service.flight_reservation_number && (
                            <p className="text-xs text-stone-400">Conf: {service.flight_reservation_number}</p>
                          )}
                          {service.tour_reservation_number && (
                            <p className="text-xs text-stone-400">Conf: {service.tour_reservation_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right font-semibold align-top">
                      ${(service.total_price || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total and Payments */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total</span>
                <span className="font-medium">${total.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Pagado</span>
                <span className="font-medium text-green-600">- ${totalPaid.toLocaleString()} USD</span>
              </div>
              <div 
                className="flex justify-between pt-3 border-t-2"
                style={{ borderColor: '#2E442A' }}
              >
                <span className="font-semibold" style={{ color: '#2E442A' }}>Saldo Pendiente</span>
                <span className="text-xl font-bold" style={{ color: (total - totalPaid) > 0 ? '#dc2626' : '#2E442A' }}>
                  ${(total - totalPaid).toLocaleString()} USD
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