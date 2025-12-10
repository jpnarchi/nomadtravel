import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, MapPin, Hotel, Plane, Car, Compass, Package, Ship, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

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

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkAddPage = (requiredSpace = 10) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header with logo and company info
    doc.setFillColor(46, 68, 42);
    doc.rect(margin, yPosition, 30, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('NT', margin + 9, yPosition + 19);
    
    doc.setTextColor(46, 68, 42);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Nomad Travel Society', margin + 35, yPosition + 12);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('San Pedro Garza García, N.L.', margin + 35, yPosition + 18);

    // Date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Fecha: ${format(new Date(), 'd MMMM yyyy', { locale: es })}`, pageWidth - margin - 40, yPosition + 15, { align: 'right' });

    yPosition += 45;

    // Client Info
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('CLIENTE', margin, yPosition);
    yPosition += 7;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(soldTrip.client_name, margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Viaje: ${soldTrip.destination}`, margin, yPosition);
    yPosition += 5;
    doc.text(`${format(new Date(soldTrip.start_date), 'd MMM yyyy', { locale: es })}${soldTrip.end_date ? ` - ${format(new Date(soldTrip.end_date), 'd MMM yyyy', { locale: es })}` : ''}`, margin, yPosition);
    yPosition += 5;
    doc.text(`${soldTrip.travelers} viajero(s)`, margin, yPosition);
    yPosition += 12;

    // Services Section
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(46, 68, 42);
    doc.text('SERVICIOS INCLUIDOS', margin, yPosition);
    yPosition += 8;

    // Render services by type
    Object.entries(servicesByType).forEach(([type, typeServices]) => {
      checkAddPage(20);
      
      // Service type header
      doc.setFillColor(46, 68, 42);
      doc.rect(margin, yPosition, contentWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(SERVICE_LABELS[type] + 's', margin + 2, yPosition + 4);
      yPosition += 8;

      typeServices.forEach((service) => {
        checkAddPage(25);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        
        // Service name
        let serviceName = '';
        if (type === 'hotel') serviceName = service.hotel_name || 'Hotel';
        else if (type === 'vuelo') serviceName = `${service.airline || 'Vuelo'} ${service.airline_other ? `(${service.airline_other})` : ''}`;
        else if (type === 'traslado') serviceName = `${service.transfer_origin || 'Origen'} → ${service.transfer_destination || 'Destino'}`;
        else if (type === 'tour') serviceName = service.tour_name || 'Tour';
        else if (type === 'crucero') serviceName = service.cruise_ship || 'Crucero';
        else serviceName = service.other_name || 'Servicio';
        
        doc.text(serviceName, margin + 2, yPosition);
        doc.text(`$${(service.total_price || 0).toLocaleString()} USD`, pageWidth - margin - 2, yPosition, { align: 'right' });
        yPosition += 5;

        // Service details
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        
        if (type === 'hotel') {
          if (service.hotel_chain || service.hotel_brand) {
            doc.text([service.hotel_chain, service.hotel_brand].filter(Boolean).join(' - '), margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.check_in && service.check_out) {
            doc.text(`Fechas: ${format(new Date(service.check_in), 'd MMM', { locale: es })} - ${format(new Date(service.check_out), 'd MMM yyyy', { locale: es })}`, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.room_type) {
            doc.text(`Habitación: ${service.room_type}`, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.nights) {
            doc.text(`Noches: ${service.nights} | Habitaciones: ${service.num_rooms || 1}`, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.reservation_number) {
            doc.text(`Reservación: ${service.reservation_number}`, margin + 4, yPosition);
            yPosition += 4;
          }
        } else if (type === 'vuelo') {
          if (service.route) {
            doc.text(service.route, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.flight_date) {
            doc.text(`Fecha: ${format(new Date(service.flight_date), 'd MMM yyyy', { locale: es })}`, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.flight_number) {
            doc.text(`Vuelo: #${service.flight_number}`, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.flight_reservation_number) {
            doc.text(`Reservación: ${service.flight_reservation_number}`, margin + 4, yPosition);
            yPosition += 4;
          }
        } else if (type === 'tour') {
          if (service.tour_date) {
            doc.text(`Fecha: ${format(new Date(service.tour_date), 'd MMM yyyy', { locale: es })}`, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.tour_city) {
            doc.text(`Lugar: ${service.tour_city}`, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.tour_reservation_number) {
            doc.text(`Reservación: ${service.tour_reservation_number}`, margin + 4, yPosition);
            yPosition += 4;
          }
        } else if (type === 'crucero') {
          if (service.cruise_line) {
            doc.text(service.cruise_line, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.cruise_departure_date && service.cruise_arrival_date) {
            doc.text(`${format(new Date(service.cruise_departure_date), 'd MMM', { locale: es })} - ${format(new Date(service.cruise_arrival_date), 'd MMM yyyy', { locale: es })}`, margin + 4, yPosition);
            yPosition += 4;
          }
          if (service.cruise_reservation_number) {
            doc.text(`Reservación: ${service.cruise_reservation_number}`, margin + 4, yPosition);
            yPosition += 4;
          }
        }
        
        yPosition += 3;
        doc.setDrawColor(230, 230, 230);
        doc.line(margin + 2, yPosition, pageWidth - margin - 2, yPosition);
        yPosition += 5;
      });
      
      yPosition += 3;
    });

    // Services Total
    checkAddPage(20);
    yPosition += 5;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(46, 68, 42);
    doc.text('Total Servicios', pageWidth - margin - 60, yPosition);
    doc.text(`$${total.toLocaleString()} USD`, pageWidth - margin - 2, yPosition, { align: 'right' });
    yPosition += 10;

    // Client Payments
    checkAddPage(30);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('PAGOS REALIZADOS POR EL CLIENTE', margin, yPosition);
    yPosition += 8;

    if (clientPayments.length > 0) {
      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition - 5, contentWidth, 6, 'F');
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Fecha', margin + 2, yPosition);
      doc.text('Método', margin + 35, yPosition);
      doc.text('Monto', pageWidth - margin - 2, yPosition, { align: 'right' });
      yPosition += 5;

      // Payment rows
      doc.setFont(undefined, 'normal');
      clientPayments.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((payment) => {
        checkAddPage(8);
        
        doc.setTextColor(0, 0, 0);
        doc.text(format(new Date(payment.date), 'd MMM yyyy', { locale: es }), margin + 2, yPosition);
        doc.text(PAYMENT_METHOD_LABELS[payment.method] || payment.method, margin + 35, yPosition);
        doc.setTextColor(34, 197, 94);
        doc.setFont(undefined, 'bold');
        doc.text(`$${(payment.amount || 0).toLocaleString()} USD`, pageWidth - margin - 2, yPosition, { align: 'right' });
        doc.setFont(undefined, 'normal');
        yPosition += 6;
      });
    } else {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('No se han registrado pagos', margin + 2, yPosition);
      yPosition += 6;
    }

    yPosition += 10;

    // Final Summary Box
    checkAddPage(35);
    doc.setFillColor(245, 245, 245);
    doc.rect(pageWidth - margin - 80, yPosition, 80, 30, 'F');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Total del Viaje', pageWidth - margin - 78, yPosition + 7);
    doc.text(`$${total.toLocaleString()} USD`, pageWidth - margin - 2, yPosition + 7, { align: 'right' });
    
    doc.text('Total Pagado', pageWidth - margin - 78, yPosition + 14);
    doc.setTextColor(34, 197, 94);
    doc.text(`$${totalPaid.toLocaleString()} USD`, pageWidth - margin - 2, yPosition + 14, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(46, 68, 42);
    doc.text('Saldo Pendiente', pageWidth - margin - 78, yPosition + 24);
    doc.setFontSize(11);
    doc.setTextColor(balance > 0 ? 220 : 22, balance > 0 ? 38 : 163, balance > 0 ? 38 : 74);
    doc.text(`$${balance.toLocaleString()} USD`, pageWidth - margin - 2, yPosition + 24, { align: 'right' });
    
    yPosition += 40;

    // Footer
    checkAddPage(15);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Gracias por confiar en Nomad Travel Society', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('contacto@nomadtravelsociety.com | San Pedro Garza García, N.L.', pageWidth / 2, yPosition, { align: 'center' });

    // Save PDF
    doc.save(`Invoice_${soldTrip.client_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
              <p>Fechas: {format(new Date(service.cruise_departure_date), 'd MMM', { locale: es })} - {format(new Date(service.cruise_arrival_date), 'd MMM yyyy', { locale: es })}</p>
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
              Viaje: {soldTrip.destination} | {format(new Date(soldTrip.start_date), 'd MMM yyyy', { locale: es })}
              {soldTrip.end_date && ` - ${format(new Date(soldTrip.end_date), 'd MMM yyyy', { locale: es })}`}
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
                    {clientPayments.sort((a, b) => new Date(a.date) - new Date(b.date)).map((payment, index) => (
                      <tr key={index} className="border-b border-stone-100 last:border-0">
                        <td className="py-2 text-stone-700">
                          {format(new Date(payment.date), 'd MMM yyyy', { locale: es })}
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