import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, MapPin, Hotel, Plane, Car, Compass, Package, Ship, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helpers to parse dates correctly, avoiding UTC timezone shifts
function parseDateOnlyLocal(dateStr) {
  if (!dateStr) return null;

  // Si viene con hora (ISO), usar Date normal
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    return new Date(dateStr);
  }

  // Si viene YYYY-MM-DD, parsear como fecha LOCAL
  const parts = String(dateStr).split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }

  return new Date(dateStr);
}

function parseDateTimeSafe(value) {
  if (!value) return null;

  // YYYY-MM-DD sin hora → tratar como date-only local
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseDateOnlyLocal(value);
  }

  // Con hora → Date normal
  return new Date(value);
}

const SERVICE_ICONS = {
  hotel: Hotel,
  vuelo: Plane,
  traslado: Car,
  tour: Compass,
  crucero: Ship,
  otro: Package
};

const SERVICE_LABELS = {
  hotel: 'Hotel',
  vuelo: 'Vuelo',
  traslado: 'Traslado',
  tour: 'Tour',
  crucero: 'Crucero',
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

  const handleDownloadPDF = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Escalar imagen al ancho de la hoja
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Primera página
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Páginas adicionales
    while (heightLeft > 0) {
      pdf.addPage();
      position = heightLeft - imgHeight;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Invoice_${soldTrip.client_name.replace(/\s+/g, '_')}.pdf`);
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
              <p>Fechas: {format(parseDateOnlyLocal(service.check_in), 'd MMM', { locale: es })} - {format(parseDateOnlyLocal(service.check_out), 'd MMM yyyy', { locale: es })}</p>
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
            {service.flight_date && <p>Fecha: {format(parseDateOnlyLocal(service.flight_date), 'd MMM yyyy', { locale: es })}</p>}
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
            {service.transfer_datetime && <p>Fecha/Hora: {format(parseDateTimeSafe(service.transfer_datetime), 'd MMM yyyy HH:mm', { locale: es })}</p>}
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
            {service.tour_date && <p>Fecha: {format(parseDateOnlyLocal(service.tour_date), 'd MMM yyyy', { locale: es })}</p>}
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

  const renderCruiseService = (service, index) => (
    <div key={index} className="py-3 border-b border-stone-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-stone-800">{service.cruise_ship || 'Crucero'}</p>
          {service.cruise_line && <p className="text-xs text-stone-500">{service.cruise_line}</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600 mt-1">
            {service.cruise_itinerary && <p className="col-span-2">Itinerario: {service.cruise_itinerary}</p>}
            {service.cruise_departure_port && <p>Salida: {service.cruise_departure_port}</p>}
            {service.cruise_arrival_port && <p>Llegada: {service.cruise_arrival_port}</p>}
            {service.cruise_departure_date && service.cruise_arrival_date && (
              <p>Fechas: {format(parseDateOnlyLocal(service.cruise_departure_date), 'd MMM', { locale: es })} - {format(parseDateOnlyLocal(service.cruise_arrival_date), 'd MMM yyyy', { locale: es })}</p>
            )}
            {service.cruise_nights && <p>Noches: {service.cruise_nights}</p>}
            {service.cruise_cabin_type && <p>Cabina: {service.cruise_cabin_type}</p>}
            {service.cruise_cabin_number && <p>Núm. Cabina: {service.cruise_cabin_number}</p>}
            {service.cruise_passengers && <p>Pasajeros: {service.cruise_passengers}</p>}
            {service.cruise_reservation_number && <p>Reservación: {service.cruise_reservation_number}</p>}
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
            {service.other_date && <p>Fecha: {format(parseDateOnlyLocal(service.other_date), 'd MMM yyyy', { locale: es })}</p>}
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
      crucero: renderCruiseService,
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="rounded-xl">
              <Download className="w-4 h-4 mr-2" /> Descargar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
          </div>
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
              Viaje: {soldTrip.destination}{soldTrip.trip_name ? ` — ${soldTrip.trip_name}` : ''} | {format(parseDateOnlyLocal(soldTrip.start_date), 'd MMM yyyy', { locale: es })}
              {soldTrip.end_date && ` - ${format(parseDateOnlyLocal(soldTrip.end_date), 'd MMM yyyy', { locale: es })}`}
            </p>
            <p className="text-sm text-stone-600">{soldTrip.travelers} viajero(s)</p>
          </div>

          {/* Services by Type */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-stone-500 mb-4">Servicios Incluidos</h3>
            {Object.entries(servicesByType).map(([type, typeServices]) => 
              renderServiceSection(type, typeServices)
            )}
          </div>

          {/* Services Total */}
          <div className="flex justify-end mb-6 pb-4 border-b border-stone-200">
            <div className="w-64">
              <div className="flex justify-between text-sm font-semibold">
                <span style={{ color: '#2E442A' }}>Total Servicios</span>
                <span style={{ color: '#2E442A' }}>${total.toLocaleString()} USD</span>
              </div>
            </div>
          </div>

          {/* Client Payments Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-stone-500 mb-3">Pagos Realizados por el Cliente</h3>
            {clientPayments.length > 0 ? (
              <div className="bg-stone-50 rounded-lg p-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-2 font-semibold text-stone-600">Fecha</th>
                      <th className="text-left py-2 font-semibold text-stone-600">Método</th>
                      <th className="text-right py-2 font-semibold text-stone-600">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPayments.sort((a, b) => parseDateOnlyLocal(a.date) - parseDateOnlyLocal(b.date)).map((payment, index) => (
                      <tr key={index} className="border-b border-stone-100 last:border-0">
                        <td className="py-2 text-stone-700">
                          {format(parseDateOnlyLocal(payment.date), 'd MMM yyyy', { locale: es })}
                        </td>
                        <td className="py-2 text-stone-700">
                          {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                        </td>
                        <td className="py-2 text-right font-semibold text-green-600">
                          ${(payment.amount || 0).toLocaleString()} USD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No se han registrado pagos</p>
            )}
          </div>

          {/* Final Summary */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 bg-stone-50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Total del Viaje</span>
                <span className="font-medium">${total.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Total Pagado</span>
                <span className="font-medium text-green-600">${totalPaid.toLocaleString()} USD</span>
              </div>
              <div 
                className="flex justify-between pt-3 border-t-2"
                style={{ borderColor: '#2E442A' }}
              >
                <span className="font-bold" style={{ color: '#2E442A' }}>Saldo Pendiente</span>
                <span className="text-lg font-bold" style={{ color: balance > 0 ? '#dc2626' : '#16a34a' }}>
                  ${balance.toLocaleString()} USD
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