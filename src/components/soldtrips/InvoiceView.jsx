import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, MapPin, Hotel, Plane, Car, Compass, Package } from 'lucide-react';

const SERVICE_ICONS = {
  hotel: Hotel,
  vuelo: Plane,
  traslado: Car,
  tour: Compass,
  otro: Package
};

const SERVICE_LABELS = {
  hotel: 'Hotel',
  vuelo: 'Vuelo',
  traslado: 'Traslado',
  tour: 'Tour',
  otro: 'Servicio'
};

const MEAL_PLAN_LABELS = {
  solo_habitacion: 'Solo Habitación (EP)',
  desayuno: 'Desayuno Incluido',
  all_inclusive: 'All Inclusive'
};

const PAYMENT_METHOD_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro'
};

export default function InvoiceView({ open, onClose, soldTrip, services, clientPayments = [] }) {
  if (!soldTrip) return null;

  const totalPaid = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const total = services.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const balance = total - totalPaid;

  // Group services by type
  const servicesByType = services.reduce((acc, s) => {
    if (!acc[s.service_type]) acc[s.service_type] = [];
    acc[s.service_type].push(s);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  const renderHotelService = (service, index) => (
    <div key={index} className="py-3 border-b border-stone-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-stone-800">{service.hotel_name || 'Hotel'}</p>
          {(service.hotel_chain || service.hotel_brand) && (
            <p className="text-xs text-stone-500">{[service.hotel_chain, service.hotel_brand].filter(Boolean).join(' - ')}</p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600 mt-1">
            {service.room_type && <p>Habitación: {service.room_type}</p>}
            {service.check_in && service.check_out && (
              <p>Fechas: {format(new Date(service.check_in), 'd MMM', { locale: es })} - {format(new Date(service.check_out), 'd MMM yyyy', { locale: es })}</p>
            )}
            {service.meal_plan && <p>Plan: {MEAL_PLAN_LABELS[service.meal_plan] || service.meal_plan}</p>}
            {service.num_rooms && <p>Habitaciones: {service.num_rooms}</p>}
            {service.nights && <p>Noches: {service.nights}</p>}
            {service.reservation_number && <p>Reservación: {service.reservation_number}</p>}
          </div>
        </div>
        <p className="font-bold text-sm" style={{ color: '#2E442A' }}>${(service.total_price || 0).toLocaleString()} USD</p>
      </div>
    </div>
  );

  const renderFlightService = (service, index) => (
    <div key={index} className="py-3 border-b border-stone-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-stone-800">{service.airline || 'Vuelo'} {service.airline_other && `(${service.airline_other})`}</p>
          {service.route && <p className="text-xs text-stone-500">{service.route}</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600 mt-1">
            {service.flight_number && <p>Vuelo: #{service.flight_number}</p>}
            {service.flight_date && <p>Fecha: {format(new Date(service.flight_date), 'd MMM yyyy', { locale: es })}</p>}
            {(service.departure_time || service.arrival_time) && (
              <p>Horarios: {service.departure_time || '--'} → {service.arrival_time || '--'}</p>
            )}
            {service.flight_class && <p>Clase: {service.flight_class}</p>}
            {service.baggage_included && <p>Equipaje: {service.baggage_included}</p>}
            {service.passengers && <p>Pasajeros: {service.passengers}</p>}
            {service.flight_reservation_number && <p>Reservación: {service.flight_reservation_number}</p>}
          </div>
        </div>
        <p className="font-bold text-sm" style={{ color: '#2E442A' }}>${(service.total_price || 0).toLocaleString()} USD</p>
      </div>
    </div>
  );

  const renderTransferService = (service, index) => (
    <div key={index} className="py-3 border-b border-stone-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-stone-800">
            {service.transfer_origin || 'Origen'} → {service.transfer_destination || 'Destino'}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600 mt-1">
            {service.transfer_type && <p>Tipo: {service.transfer_type === 'privado' ? 'Privado' : 'Compartido'}</p>}
            {service.transfer_datetime && <p>Fecha/Hora: {format(new Date(service.transfer_datetime), 'd MMM yyyy HH:mm', { locale: es })}</p>}
            {service.vehicle && <p>Vehículo: {service.vehicle}</p>}
            {service.transfer_passengers && <p>Pasajeros: {service.transfer_passengers}</p>}
          </div>
        </div>
        <p className="font-bold text-sm" style={{ color: '#2E442A' }}>${(service.total_price || 0).toLocaleString()} USD</p>
      </div>
    </div>
  );

  const renderTourService = (service, index) => (
    <div key={index} className="py-3 border-b border-stone-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-stone-800">{service.tour_name || 'Tour'}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600 mt-1">
            {service.tour_city && <p>Lugar: {service.tour_city}</p>}
            {service.tour_date && <p>Fecha: {format(new Date(service.tour_date), 'd MMM yyyy', { locale: es })}</p>}
            {service.tour_duration && <p>Duración: {service.tour_duration}</p>}
            {service.tour_people && <p>Personas: {service.tour_people}</p>}
            {service.tour_includes && <p className="col-span-2">Incluye: {service.tour_includes}</p>}
            {service.tour_reservation_number && <p>Reservación: {service.tour_reservation_number}</p>}
          </div>
        </div>
        <p className="font-bold text-sm" style={{ color: '#2E442A' }}>${(service.total_price || 0).toLocaleString()} USD</p>
      </div>
    </div>
  );

  const renderOtherService = (service, index) => (
    <div key={index} className="py-3 border-b border-stone-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-stone-800">{service.other_name || 'Servicio'}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600 mt-1">
            {service.other_description && <p className="col-span-2">{service.other_description}</p>}
            {service.other_date && <p>Fecha: {format(new Date(service.other_date), 'd MMM yyyy', { locale: es })}</p>}
          </div>
        </div>
        <p className="font-bold text-sm" style={{ color: '#2E442A' }}>${(service.total_price || 0).toLocaleString()} USD</p>
      </div>
    </div>
  );

  const renderServiceSection = (type, typeServices) => {
    const Icon = SERVICE_ICONS[type] || Package;
    const renderFn = {
      hotel: renderHotelService,
      vuelo: renderFlightService,
      traslado: renderTransferService,
      tour: renderTourService,
      otro: renderOtherService
    }[type] || renderOtherService;

    return (
      <div key={type} className="mb-4">
        <div className="flex items-center gap-2 mb-2 pb-1 border-b-2" style={{ borderColor: '#2E442A' }}>
          <Icon className="w-4 h-4" style={{ color: '#2E442A' }} />
          <h4 className="font-semibold text-sm" style={{ color: '#2E442A' }}>{SERVICE_LABELS[type]}s</h4>
        </div>
        {typeServices.map((service, idx) => renderFn(service, idx))}
      </div>
    );
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