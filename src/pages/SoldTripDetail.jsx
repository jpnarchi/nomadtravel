import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeft, MapPin, Calendar, Users, Plus, 
  Edit2, Trash2, Loader2, Hotel, Plane, Car, 
  Compass, Package, DollarSign, Receipt, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ServiceForm from '@/components/soldtrips/ServiceForm';
import PaymentForm from '@/components/soldtrips/PaymentForm';
import InvoiceView from '@/components/soldtrips/InvoiceView';
import EmptyState from '@/components/ui/EmptyState';

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
  otro: 'Otro'
};

export default function SoldTripDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('id');

  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [clientPaymentOpen, setClientPaymentOpen] = useState(false);
  const [supplierPaymentOpen, setSupplierPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: soldTrip, isLoading: tripLoading } = useQuery({
    queryKey: ['soldTrip', tripId],
    queryFn: async () => {
      const trips = await base44.entities.SoldTrip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId
  });

  const { data: services = [] } = useQuery({
    queryKey: ['tripServices', tripId],
    queryFn: () => base44.entities.TripService.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: clientPayments = [] } = useQuery({
    queryKey: ['clientPayments', tripId],
    queryFn: () => base44.entities.ClientPayment.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: supplierPayments = [] } = useQuery({
    queryKey: ['supplierPayments', tripId],
    queryFn: () => base44.entities.SupplierPayment.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: (data) => base44.entities.TripService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripServices', tripId] });
      updateTripTotals();
      setServiceFormOpen(false);
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TripService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripServices', tripId] });
      updateTripTotals();
      setServiceFormOpen(false);
      setEditingService(null);
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.TripService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripServices', tripId] });
      updateTripTotals();
      setDeleteConfirm(null);
    }
  });

  const createClientPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientPayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPayments', tripId] });
      updateTripTotals();
      setClientPaymentOpen(false);
    }
  });

  const createSupplierPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.SupplierPayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierPayments', tripId] });
      updateTripTotals();
      setSupplierPaymentOpen(false);
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: ({ type, id }) => {
      if (type === 'client') {
        return base44.entities.ClientPayment.delete(id);
      }
      return base44.entities.SupplierPayment.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPayments', tripId] });
      queryClient.invalidateQueries({ queryKey: ['supplierPayments', tripId] });
      updateTripTotals();
      setDeleteConfirm(null);
    }
  });

  const updateTripMutation = useMutation({
    mutationFn: (data) => base44.entities.SoldTrip.update(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
    }
  });

  const updateTripTotals = async () => {
    // Refetch data
    const [newServices, newClientPayments, newSupplierPayments] = await Promise.all([
      base44.entities.TripService.filter({ sold_trip_id: tripId }),
      base44.entities.ClientPayment.filter({ sold_trip_id: tripId }),
      base44.entities.SupplierPayment.filter({ sold_trip_id: tripId })
    ]);

    const totalPrice = newServices.reduce((sum, s) => sum + (s.total_price || 0), 0);
    const totalCommission = newServices.reduce((sum, s) => sum + (s.commission || 0), 0);
    const totalPaidByClient = newClientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaidToSuppliers = newSupplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    updateTripMutation.mutate({
      total_price: totalPrice,
      total_commission: totalCommission,
      total_paid_by_client: totalPaidByClient,
      total_paid_to_suppliers: totalPaidToSuppliers
    });
  };

  const handleSaveService = (data) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const getServiceDetails = (service) => {
    switch (service.service_type) {
      case 'hotel':
        return `${service.hotel_name || 'Hotel'} - ${service.hotel_city || ''} (${service.nights || 0} noches)`;
      case 'vuelo':
        return `${service.airline || 'Vuelo'} ${service.flight_number || ''} - ${service.route || ''}`;
      case 'traslado':
        return `${service.transfer_origin || ''} → ${service.transfer_destination || ''} (${service.transfer_type || 'Privado'})`;
      case 'tour':
        return `${service.tour_name || 'Tour'} - ${service.tour_city || ''}`;
      case 'otro':
        return service.other_name || 'Servicio';
      default:
        return '';
    }
  };

  if (tripLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  if (!soldTrip) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Viaje no encontrado</p>
        <Link to={createPageUrl('SoldTrips')}>
          <Button variant="link" style={{ color: '#2E442A' }}>Volver a viajes vendidos</Button>
        </Link>
      </div>
    );
  }

  const totalServices = services.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const totalCommissions = services.reduce((sum, s) => sum + (s.commission || 0), 0);
  const totalClientPaid = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalSupplierPaid = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const clientBalance = totalServices - totalClientPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('SoldTrips')}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-stone-800">{soldTrip.client_name}</h1>
          <div className="flex items-center gap-2 text-stone-500 mt-1">
            <MapPin className="w-4 h-4" style={{ color: '#2E442A' }} />
            <span>{soldTrip.destination}</span>
            <span className="mx-2">•</span>
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(soldTrip.start_date), 'd MMM yyyy', { locale: es })}
              {soldTrip.end_date && ` - ${format(new Date(soldTrip.end_date), 'd MMM', { locale: es })}`}
            </span>
            {soldTrip.travelers && (
              <>
                <span className="mx-2">•</span>
                <Users className="w-4 h-4" />
                <span>{soldTrip.travelers} viajero(s)</span>
              </>
            )}
          </div>
        </div>
        <Button
          onClick={() => setInvoiceOpen(true)}
          className="rounded-xl text-white"
          style={{ backgroundColor: '#2E442A' }}
        >
          <FileText className="w-4 h-4 mr-2" />
          Ver Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Total Servicios</p>
          <p className="text-2xl font-bold" style={{ color: '#2E442A' }}>
            ${totalServices.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Comisiones</p>
          <p className="text-2xl font-bold text-stone-800">
            ${totalCommissions.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Pagado por Cliente</p>
          <p className="text-2xl font-bold text-green-600">
            ${totalClientPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Saldo Pendiente</p>
          <p className={`text-2xl font-bold ${clientBalance > 0 ? 'text-orange-500' : 'text-green-600'}`}>
            ${clientBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="bg-stone-100 p-1 rounded-xl">
          <TabsTrigger value="services" className="rounded-lg">Servicios</TabsTrigger>
          <TabsTrigger value="client-payments" className="rounded-lg">Pagos Cliente</TabsTrigger>
          <TabsTrigger value="supplier-payments" className="rounded-lg">Pagos Proveedores</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">Servicios del Viaje</h3>
              <Button 
                size="sm"
                onClick={() => { setEditingService(null); setServiceFormOpen(true); }}
                className="rounded-xl text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </div>

            {services.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Sin servicios"
                description="Agrega los servicios incluidos en este viaje"
                actionLabel="Agregar Servicio"
                onAction={() => setServiceFormOpen(true)}
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {services.map((service) => {
                  const Icon = SERVICE_ICONS[service.service_type] || Package;
                  return (
                    <div key={service.id} className="p-4 hover:bg-stone-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#2E442A15' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: '#2E442A' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {SERVICE_LABELS[service.service_type]}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-stone-500">
                              {service.booked_by === 'montecito' ? 'Montecito' : 'IATA Nomad'}
                            </Badge>
                          </div>
                          <p className="font-medium text-stone-800">{getServiceDetails(service)}</p>
                          {service.notes && (
                            <p className="text-sm text-stone-500 mt-1">{service.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold" style={{ color: '#2E442A' }}>
                            ${(service.total_price || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-stone-400">
                            Com: ${(service.commission || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-400 hover:text-stone-600"
                            onClick={() => { setEditingService(service); setServiceFormOpen(true); }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-400 hover:text-red-500"
                            onClick={() => setDeleteConfirm({ type: 'service', item: service })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Client Payments Tab */}
        <TabsContent value="client-payments">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">Pagos del Cliente</h3>
              <Button 
                size="sm"
                onClick={() => setClientPaymentOpen(true)}
                className="rounded-xl text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                <Plus className="w-4 h-4 mr-1" /> Registrar Pago
              </Button>
            </div>

            {clientPayments.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="Sin pagos registrados"
                description="Registra los pagos recibidos del cliente"
                actionLabel="Registrar Pago"
                onAction={() => setClientPaymentOpen(true)}
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {clientPayments.map((payment) => (
                  <div key={payment.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#dcfce7' }}
                    >
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">
                        ${(payment.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-stone-500">
                        {format(new Date(payment.date), 'd MMM yyyy', { locale: es })} • {payment.method}
                      </p>
                      {payment.notes && <p className="text-xs text-stone-400 mt-1">{payment.notes}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-stone-400 hover:text-red-500"
                      onClick={() => setDeleteConfirm({ type: 'client', item: payment })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Supplier Payments Tab */}
        <TabsContent value="supplier-payments">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">Pagos a Proveedores</h3>
              <Button 
                size="sm"
                onClick={() => setSupplierPaymentOpen(true)}
                className="rounded-xl text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                <Plus className="w-4 h-4 mr-1" /> Registrar Pago
              </Button>
            </div>

            {supplierPayments.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Sin pagos registrados"
                description="Registra los pagos realizados a proveedores"
                actionLabel="Registrar Pago"
                onAction={() => setSupplierPaymentOpen(true)}
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {supplierPayments.map((payment) => (
                  <div key={payment.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#fef3c7' }}
                    >
                      <Receipt className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">{payment.supplier}</p>
                      <p className="text-sm text-stone-500">
                        ${(payment.amount || 0).toLocaleString()} • {format(new Date(payment.date), 'd MMM yyyy', { locale: es })} • {payment.method}
                      </p>
                      {payment.notes && <p className="text-xs text-stone-400 mt-1">{payment.notes}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-stone-400 hover:text-red-500"
                      onClick={() => setDeleteConfirm({ type: 'supplier', item: payment })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Service Form */}
      <ServiceForm
        open={serviceFormOpen}
        onClose={() => { setServiceFormOpen(false); setEditingService(null); }}
        service={editingService}
        soldTripId={tripId}
        onSave={handleSaveService}
        isLoading={createServiceMutation.isPending || updateServiceMutation.isPending}
      />

      {/* Client Payment Form */}
      <PaymentForm
        open={clientPaymentOpen}
        onClose={() => setClientPaymentOpen(false)}
        soldTripId={tripId}
        type="client"
        onSave={(data) => createClientPaymentMutation.mutate(data)}
        isLoading={createClientPaymentMutation.isPending}
      />

      {/* Supplier Payment Form */}
      <PaymentForm
        open={supplierPaymentOpen}
        onClose={() => setSupplierPaymentOpen(false)}
        soldTripId={tripId}
        type="supplier"
        onSave={(data) => createSupplierPaymentMutation.mutate(data)}
        isLoading={createSupplierPaymentMutation.isPending}
      />

      {/* Invoice View */}
      <InvoiceView
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        soldTrip={soldTrip}
        services={services}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm.type === 'service') {
                  deleteServiceMutation.mutate(deleteConfirm.item.id);
                } else {
                  deletePaymentMutation.mutate({ type: deleteConfirm.type, id: deleteConfirm.item.id });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}