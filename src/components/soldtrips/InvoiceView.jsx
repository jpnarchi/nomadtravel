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

export default function InvoiceView({ open, onClose, soldTrip, services }) {
  if (!soldTrip) return null;

  const MEAL_PLAN_LABELS = {
    solo_habitacion: 'Solo habitación',
    desayuno: 'Desayuno incluido',
    all_inclusive: 'All Inclusive'
  };

  const getServiceName = (service) => {
    switch (service.service_type) {
      case 'hotel':
        return service.hotel_name || 'Hotel';
      case 'vuelo':
        return `${service.airline || 'Vuelo'} ${service.route ? `• ${service.route}` : ''}`;
      case 'traslado':
        return `${service.transfer_origin || ''} → ${service.transfer_destination || ''}`;
      case 'tour':
        return service.tour_name || 'Tour';
      case 'otro':
        return service.other_name || 'Servicio';
      default:
        return 'Servicio';
    }
  };

  const getServiceDetails = (service) => {
    const details = [];
    
    switch (service.service_type) {
      case 'hotel':
        if (service.hotel_city) details.push({ label: 'Ubicación', value: service.hotel_city });
        if (service.check_in && service.check_out) {
          details.push({ label: 'Fechas', value: `${format(new Date(service.check_in), 'd MMM', { locale: es })} - ${format(new Date(service.check_out), 'd MMM yyyy', { locale: es })}` });
        }
        if (service.nights) details.push({ label: 'Noches', value: service.nights });
        if (service.num_rooms) details.push({ label: 'Habitaciones', value: service.num_rooms });
        if (service.room_type) details.push({ label: 'Tipo', value: service.room_type });
        if (service.meal_plan) details.push({ label: 'Plan', value: MEAL_PLAN_LABELS[service.meal_plan] || service.meal_plan, highlight: true });
        if (service.reservation_number) details.push({ label: 'Confirmación', value: service.reservation_number });
        break;
      case 'vuelo':
        if (service.flight_date) details.push({ label: 'Fecha', value: format(new Date(service.flight_date), 'd MMM yyyy', { locale: es }) });
        if (service.flight_number) details.push({ label: 'Vuelo', value: service.flight_number });
        if (service.departure_time && service.arrival_time) details.push({ label: 'Horario', value: `${service.departure_time} - ${service.arrival_time}` });
        if (service.passengers) details.push({ label: 'Pasajeros', value: service.passengers });
        if (service.flight_class) details.push({ label: 'Clase', value: service.flight_class, highlight: true });
        if (service.baggage_included) details.push({ label: 'Equipaje', value: service.baggage_included, highlight: true });
        if (service.flight_reservation_number) details.push({ label: 'Confirmación', value: service.flight_reservation_number });
        break;
      case 'traslado':
        if (service.transfer_datetime) details.push({ label: 'Fecha y hora', value: format(new Date(service.transfer_datetime), "d MMM yyyy 'a las' HH:mm", { locale: es }) });
        if (service.transfer_type) details.push({ label: 'Tipo', value: service.transfer_type === 'privado' ? 'Privado' : 'Compartido' });
        if (service.vehicle) details.push({ label: 'Vehículo', value: service.vehicle });
        if (service.transfer_passengers) details.push({ label: 'Pasajeros', value: service.transfer_passengers });
        break;
      case 'tour':
        if (service.tour_city) details.push({ label: 'Ubicación', value: service.tour_city });
        if (service.tour_date) details.push({ label: 'Fecha', value: format(new Date(service.tour_date), 'd MMM yyyy', { locale: es }) });
        if (service.tour_duration) details.push({ label: 'Duración', value: service.tour_duration });
        if (service.tour_people) details.push({ label: 'Personas', value: service.tour_people });
        if (service.tour_includes) details.push({ label: 'Incluye', value: service.tour_includes, highlight: true });
        if (service.tour_reservation_number) details.push({ label: 'Confirmación', value: service.tour_reservation_number });
        break;
      case 'otro':
        if (service.other_date) details.push({ label: 'Fecha', value: format(new Date(service.other_date), 'd MMM yyyy', { locale: es }) });
        if (service.other_description) details.push({ label: 'Descripción', value: service.other_description });
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

          {/* Services */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-stone-800 mb-4">Servicios Incluidos</h2>
            <div className="space-y-4">
              {services.map((service, index) => {
                const config = SERVICE_CONFIG[service.service_type] || SERVICE_CONFIG.otro;
                const Icon = config.icon;
                const details = getServiceDetails(service);
                
                return (
                  <div 
                    key={index} 
                    className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-sm"
                  >
                    {/* Service Header */}
                    <div 
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ backgroundColor: `${config.color}10` }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: config.color }}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: config.color }}>
                            {config.label}
                          </p>
                          <p className="font-bold text-stone-800">{getServiceName(service)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: '#2E442A' }}>
                          ${(service.total_price || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-500">MXN</p>
                      </div>
                    </div>
                    
                    {/* Service Details */}
                    {details.length > 0 && (
                      <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {details.map((detail, i) => (
                          <div key={i} className={detail.highlight ? 'col-span-2 md:col-span-3' : ''}>
                            <p className="text-xs text-stone-400 uppercase tracking-wide">{detail.label}</p>
                            <p className={`text-sm font-medium text-stone-700 ${detail.highlight ? 'text-[#2E442A] font-semibold' : ''}`}>
                              {detail.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: '#2E442A' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total de tu viaje</p>
                <p className="text-white/50 text-xs mt-1">{services.length} servicio(s) incluido(s)</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">
                  ${total.toLocaleString()}
                </p>
                <p className="text-white/70 text-sm">MXN</p>
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