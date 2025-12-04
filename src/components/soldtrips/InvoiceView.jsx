import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, Plane, Hotel, Car, Compass, Package, Calendar, Users, MapPin } from 'lucide-react';

const SERVICE_CONFIG = {
  hotel: { label: 'Hospedaje', icon: Hotel, color: '#6366f1' },
  vuelo: { label: 'Vuelo', icon: Plane, color: '#0ea5e9' },
  traslado: { label: 'Traslado', icon: Car, color: '#22c55e' },
  tour: { label: 'Tour', icon: Compass, color: '#f59e0b' },
  otro: { label: 'Servicio', icon: Package, color: '#8b5cf6' }
};

export default function InvoiceView({ open, onClose, soldTrip, services, clientPayments = [] }) {
  if (!soldTrip) return null;

  const MEAL_PLAN_LABELS = {
    solo_habitacion: 'Solo habitación',
    desayuno: 'Desayuno incluido',
    all_inclusive: 'All Inclusive'
  };

  const getServiceSummary = (service) => {
    switch (service.service_type) {
      case 'hotel':
        const hotelDetails = [];
        if (service.hotel_city) hotelDetails.push(service.hotel_city);
        if (service.check_in && service.check_out) {
          hotelDetails.push(`${format(new Date(service.check_in), 'd MMM', { locale: es })} - ${format(new Date(service.check_out), 'd MMM', { locale: es })}`);
        }
        if (service.nights) hotelDetails.push(`${service.nights} noches`);
        if (service.room_type) hotelDetails.push(service.room_type);
        if (service.meal_plan) hotelDetails.push(MEAL_PLAN_LABELS[service.meal_plan] || service.meal_plan);
        return {
          name: service.hotel_name || 'Hotel',
          details: hotelDetails.join(' • ')
        };
      case 'vuelo':
        const flightDetails = [];
        if (service.flight_date) flightDetails.push(format(new Date(service.flight_date), 'd MMM', { locale: es }));
        if (service.route) flightDetails.push(service.route);
        if (service.passengers) flightDetails.push(`${service.passengers} pax`);
        if (service.flight_class) flightDetails.push(service.flight_class);
        if (service.baggage_included) flightDetails.push(`Equipaje: ${service.baggage_included}`);
        return {
          name: `${service.airline || 'Vuelo'} ${service.flight_number || ''}`.trim(),
          details: flightDetails.join(' • ')
        };
      case 'traslado':
        const transferDetails = [];
        if (service.transfer_datetime) transferDetails.push(format(new Date(service.transfer_datetime), 'd MMM HH:mm', { locale: es }));
        if (service.transfer_type) transferDetails.push(service.transfer_type === 'privado' ? 'Privado' : 'Compartido');
        if (service.transfer_passengers) transferDetails.push(`${service.transfer_passengers} pax`);
        return {
          name: `${service.transfer_origin || ''} → ${service.transfer_destination || ''}`,
          details: transferDetails.join(' • ')
        };
      case 'tour':
        const tourDetails = [];
        if (service.tour_date) tourDetails.push(format(new Date(service.tour_date), 'd MMM', { locale: es }));
        if (service.tour_city) tourDetails.push(service.tour_city);
        if (service.tour_duration) tourDetails.push(service.tour_duration);
        if (service.tour_people) tourDetails.push(`${service.tour_people} personas`);
        if (service.tour_includes) tourDetails.push(`Incluye: ${service.tour_includes}`);
        return {
          name: service.tour_name || 'Tour',
          details: tourDetails.join(' • ')
        };
      case 'otro':
        const otherDetails = [];
        if (service.other_date) otherDetails.push(format(new Date(service.other_date), 'd MMM', { locale: es }));
        if (service.other_description) otherDetails.push(service.other_description);
        return {
          name: service.other_name || 'Servicio',
          details: otherDetails.join(' • ')
        };
      default:
        return { name: 'Servicio', details: '' };
    }
  };

  const total = services.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const totalPaid = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = total - totalPaid;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Print Button - Fixed */}
        <div className="sticky top-0 z-10 bg-white border-b border-stone-100 p-4 flex justify-end print:hidden">
          <Button onClick={handlePrint} className="rounded-xl text-white" style={{ backgroundColor: '#2E442A' }}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir / Guardar PDF
          </Button>
        </div>

        <div className="p-8 print:p-6" id="invoice-content">
          {/* Header with gradient */}
          <div className="relative mb-8 pb-8 border-b border-stone-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#2E442A' }}
                >
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#2E442A' }}>
                    Nomad Travel Society
                  </h1>
                  <p className="text-sm text-stone-500 mt-1">Tu viaje, nuestra pasión</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block px-4 py-2 rounded-xl bg-stone-100">
                  <p className="text-xs text-stone-500 uppercase tracking-wide">Cotización</p>
                  <p className="text-lg font-bold text-stone-800">{format(new Date(), 'd MMM yyyy', { locale: es })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trip & Client Info Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Cliente</p>
              <p className="text-xl font-bold text-stone-800">{soldTrip.client_name}</p>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2E442A]/5 to-[#2E442A]/10 border border-[#2E442A]/20">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2E442A' }}>Destino</p>
              <p className="text-xl font-bold" style={{ color: '#2E442A' }}>{soldTrip.destination}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-stone-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(soldTrip.start_date), 'd MMM', { locale: es })}
                  {soldTrip.end_date && ` - ${format(new Date(soldTrip.end_date), 'd MMM yyyy', { locale: es })}`}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {soldTrip.travelers} viajero(s)
                </span>
              </div>
            </div>
          </div>

          {/* Services - Compact Table */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3">Servicios Incluidos</h2>
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left py-2 px-3 font-semibold text-stone-600">Servicio</th>
                    <th className="text-left py-2 px-3 font-semibold text-stone-600">Detalle</th>
                    <th className="text-right py-2 px-3 font-semibold text-stone-600">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service, index) => {
                    const config = SERVICE_CONFIG[service.service_type] || SERVICE_CONFIG.otro;
                    const Icon = config.icon;
                    const summary = getServiceSummary(service);
                    
                    return (
                      <tr key={index} className="border-b border-stone-100 last:border-b-0">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${config.color}20` }}
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                            </div>
                            <span className="font-medium text-stone-800">{summary.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-stone-500 text-xs">{summary.details}</td>
                        <td className="py-2.5 px-3 text-right font-semibold" style={{ color: '#2E442A' }}>
                          ${(service.total_price || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-50 border-t border-stone-200">
                    <td colSpan="2" className="py-3 px-3 text-right font-bold text-stone-700">Total</td>
                    <td className="py-3 px-3 text-right text-lg font-bold" style={{ color: '#2E442A' }}>
                      ${total.toLocaleString()} MXN
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payments Section */}
          {clientPayments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3">Pagos Recibidos</h2>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-50 border-b border-green-200">
                      <th className="text-left py-2 px-3 font-semibold text-green-700">Fecha</th>
                      <th className="text-left py-2 px-3 font-semibold text-green-700">Método</th>
                      <th className="text-right py-2 px-3 font-semibold text-green-700">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPayments.sort((a, b) => new Date(a.date) - new Date(b.date)).map((payment, index) => (
                      <tr key={index} className="border-b border-stone-100 last:border-b-0">
                        <td className="py-2.5 px-3 text-stone-700">
                          {format(new Date(payment.date), 'd MMM yyyy', { locale: es })}
                        </td>
                        <td className="py-2.5 px-3 text-stone-500 capitalize">{payment.method}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-green-600">
                          ${(payment.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-50 border-t border-green-200">
                      <td colSpan="2" className="py-2.5 px-3 text-right font-bold text-green-700">Total Pagado</td>
                      <td className="py-2.5 px-3 text-right font-bold text-green-600">
                        ${totalPaid.toLocaleString()} MXN
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Balance Summary */}
          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#2E442A' }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Total Viaje</p>
                <p className="text-xl font-bold text-white">${total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Pagado</p>
                <p className="text-xl font-bold text-green-400">${totalPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Saldo</p>
                <p className={`text-xl font-bold ${balance > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  ${balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-stone-200">
            <p className="text-lg font-semibold" style={{ color: '#2E442A' }}>
              ¡Gracias por viajar con nosotros!
            </p>
            <p className="text-sm text-stone-500 mt-2">
              contacto@nomadtravelsociety.com • San Pedro Garza García, N.L.
            </p>
            <p className="text-xs text-stone-400 mt-4">
              Esta cotización es válida por 7 días a partir de la fecha de emisión.
              Precios sujetos a disponibilidad.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}