import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Calendar, Users, Plus, 
  Edit2, Trash2, Loader2, Hotel, Plane, Car, 
  Compass, Package, DollarSign, Receipt, FileText,
  CheckCircle, Clock, AlertCircle, TrendingUp,
  CreditCard, Building2, MoreVertical, AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ServiceForm from '@/components/soldtrips/ServiceForm';
import PaymentForm from '@/components/soldtrips/PaymentForm';
import SupplierPaymentForm from '@/components/soldtrips/SupplierPaymentForm';
import PaymentPlanForm from '@/components/soldtrips/PaymentPlanForm';
import EditPaymentPlanItem from '@/components/soldtrips/EditPaymentPlanItem';
import InvoiceView from '@/components/soldtrips/InvoiceView';
import SoldTripForm from '@/components/soldtrips/SoldTripForm';
import EmptyState from '@/components/ui/EmptyState';

const SERVICE_ICONS = {
  hotel: Hotel,
  vuelo: Plane,
  traslado: Car,
  tour: Compass,
  crucero: Package,
  dmc: Building2,
  otro: Package
};

const SERVICE_LABELS = {
  hotel: 'Hotel',
  vuelo: 'Vuelo',
  traslado: 'Traslado',
  tour: 'Tour',
  crucero: 'Crucero',
  dmc: 'DMC',
  otro: 'Otro'
};

const SERVICE_COLORS = {
  hotel: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  vuelo: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  traslado: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  tour: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  crucero: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  dmc: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  otro: { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200' }
};

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  parcial: { label: 'Pago Parcial', color: 'bg-blue-100 text-blue-700' },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  completado: { label: 'Completado', color: 'bg-emerald-100 text-emerald-800' }
};

export default function SoldTripDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('id');

  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [clientPaymentOpen, setClientPaymentOpen] = useState(false);
  const [editingClientPayment, setEditingClientPayment] = useState(null);
  const [supplierPaymentOpen, setSupplierPaymentOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [paymentPlanOpen, setPaymentPlanOpen] = useState(false);
  const [editingPlanItem, setEditingPlanItem] = useState(null);
  const [editTripOpen, setEditTripOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: soldTrip, isLoading: tripLoading } = useQuery({
    queryKey: ['soldTrip', tripId],
    queryFn: async () => {
      const trips = await base44.entities.SoldTrip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId,
    refetchOnWindowFocus: false
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

  const { data: paymentPlan = [] } = useQuery({
    queryKey: ['paymentPlan', tripId],
    queryFn: () => base44.entities.ClientPaymentPlan.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: (data) => base44.entities.TripService.create(data),
    onSuccess: async () => {
      await updateTripTotals();
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.refetchQueries({ queryKey: ['tripServices', tripId] });
      await queryClient.refetchQueries({ queryKey: ['allServices'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrips'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrip', tripId] });
      setServiceFormOpen(false);
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TripService.update(id, data),
    onSuccess: async () => {
      await updateTripTotals();
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.refetchQueries({ queryKey: ['tripServices', tripId] });
      await queryClient.refetchQueries({ queryKey: ['allServices'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrips'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrip', tripId] });
      setServiceFormOpen(false);
      setEditingService(null);
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.TripService.delete(id),
    onSuccess: async () => {
      await updateTripTotals();
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.refetchQueries({ queryKey: ['tripServices', tripId] });
      await queryClient.refetchQueries({ queryKey: ['allServices'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrips'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrip', tripId] });
      setDeleteConfirm(null);
    }
  });

  const updateClientPaymentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientPayment.update(id, data),
    onSuccess: async () => {
      await updateTripTotals();
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.refetchQueries({ queryKey: ['clientPayments', tripId] });
      await queryClient.refetchQueries({ queryKey: ['soldTrips'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrip', tripId] });
      setClientPaymentOpen(false);
      setEditingClientPayment(null);
    }
  });

  const createClientPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const payment = await base44.entities.ClientPayment.create(data);
      
      // Update payment plan if exists
      const plan = await base44.entities.ClientPaymentPlan.filter({ sold_trip_id: tripId });
      if (plan.length > 0) {
        // Sort by due date, prioritize overdue and pending
        const sortedPlan = plan
          .filter(p => p.status !== 'pagado')
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        
        let remainingAmount = data.amount;
        
        for (const planItem of sortedPlan) {
          if (remainingAmount <= 0) break;
          
          const amountDue = planItem.amount_due - (planItem.amount_paid || 0);
          const amountToApply = Math.min(remainingAmount, amountDue);
          
          const newAmountPaid = (planItem.amount_paid || 0) + amountToApply;
          const newStatus = newAmountPaid >= planItem.amount_due ? 'pagado' : 'parcial';
          
          await base44.entities.ClientPaymentPlan.update(planItem.id, {
            amount_paid: newAmountPaid,
            status: newStatus
          });
          
          remainingAmount -= amountToApply;
        }
      }
      
      return payment;
    },
    onSuccess: async () => {
      await updateTripTotals();
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.refetchQueries({ queryKey: ['clientPayments', tripId] });
      await queryClient.refetchQueries({ queryKey: ['paymentPlan', tripId] });
      await queryClient.refetchQueries({ queryKey: ['soldTrips'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrip', tripId] });
      setClientPaymentOpen(false);
      setEditingClientPayment(null);
    }
  });

  const createSupplierPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const payment = await base44.entities.SupplierPayment.create(data);
      
      // If associated with a service, update service's amount_paid_to_supplier
      if (data.trip_service_id) {
        const servicePayments = await base44.entities.SupplierPayment.filter({ 
          trip_service_id: data.trip_service_id 
        });
        const totalPaid = servicePayments.reduce((sum, p) => sum + (p.amount || 0), 0) + data.amount;
        
        await base44.entities.TripService.update(data.trip_service_id, {
          amount_paid_to_supplier: totalPaid
        });
      }
      
      return payment;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['supplierPayments', tripId] });
      queryClient.invalidateQueries({ queryKey: ['tripServices', tripId] });
      await updateTripTotals();
      setSupplierPaymentOpen(false);
    }
  });

  const createPaymentPlanMutation = useMutation({
    mutationFn: async (payments) => {
      return await base44.entities.ClientPaymentPlan.bulkCreate(payments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentPlan', tripId] });
      setPaymentPlanOpen(false);
    }
  });

  const updatePaymentPlanItemMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientPaymentPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentPlan', tripId] });
      setEditingPlanItem(null);
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: ({ type, id }) => {
      if (type === 'client') return base44.entities.ClientPayment.delete(id);
      return base44.entities.SupplierPayment.delete(id);
    },
    onSuccess: async () => {
      await updateTripTotals();
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.refetchQueries({ queryKey: ['clientPayments', tripId] });
      await queryClient.refetchQueries({ queryKey: ['supplierPayments', tripId] });
      await queryClient.refetchQueries({ queryKey: ['soldTrips'] });
      await queryClient.refetchQueries({ queryKey: ['soldTrip', tripId] });
      setDeleteConfirm(null);
    }
  });

  const updateTripMutation = useMutation({
    mutationFn: (data) => base44.entities.SoldTrip.update(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
      setEditTripOpen(false);
    }
  });

  const updateTripTotals = async () => {
    if (!tripId) return;

    try {
      const [newServices, newClientPayments, newSupplierPayments] = await Promise.all([
        base44.entities.TripService.filter({ sold_trip_id: tripId }),
        base44.entities.ClientPayment.filter({ sold_trip_id: tripId }),
        base44.entities.SupplierPayment.filter({ sold_trip_id: tripId })
      ]);

      const totalPrice = newServices.reduce((sum, s) => sum + (s.total_price || 0), 0);
      const totalCommission = newServices.reduce((sum, s) => sum + (s.commission || 0), 0);
      const totalPaidByClient = newClientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalPaidToSuppliers = newSupplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Auto-update status
      let newStatus = 'pendiente';
      if (totalPaidByClient >= totalPrice && totalPrice > 0) {
        newStatus = 'pagado';
      } else if (totalPaidByClient > 0) {
        newStatus = 'parcial';
      }

      await base44.entities.SoldTrip.update(tripId, {
        total_price: totalPrice,
        total_commission: totalCommission,
        total_paid_by_client: totalPaidByClient,
        total_paid_to_suppliers: totalPaidToSuppliers,
        status: newStatus
      });

      queryClient.invalidateQueries({ queryKey: ['soldTrip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
    } catch (error) {
      console.error('Error updating trip totals:', error);
    }
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
        return {
          title: service.hotel_name || 'Hotel',
          subtitle: `${service.hotel_city || ''} • ${service.nights || 0} noches`,
          extra: service.check_in ? `Check-in: ${format(new Date(service.check_in), 'd MMM', { locale: es })}` : ''
        };
      case 'vuelo':
        return {
          title: `${service.airline || 'Vuelo'} ${service.flight_number || ''}`,
          subtitle: service.route || '',
          extra: service.flight_date ? format(new Date(service.flight_date), 'd MMM yyyy', { locale: es }) : ''
        };
      case 'traslado':
        return {
          title: `${service.transfer_origin || ''} → ${service.transfer_destination || ''}`,
          subtitle: `${service.transfer_type === 'privado' ? 'Privado' : 'Compartido'} • ${service.transfer_passengers || 1} pax`,
          extra: service.transfer_datetime ? format(new Date(service.transfer_datetime), 'd MMM HH:mm', { locale: es }) : ''
        };
      case 'tour':
        return {
          title: service.tour_name || 'Tour',
          subtitle: `${service.tour_city || ''} • ${service.tour_people || 1} personas`,
          extra: service.tour_date ? format(new Date(service.tour_date), 'd MMM yyyy', { locale: es }) : ''
        };
      case 'crucero':
        return {
          title: service.cruise_ship || service.cruise_line || 'Crucero',
          subtitle: `${service.cruise_itinerary || ''} • ${service.cruise_nights || 0} noches`,
          extra: service.cruise_departure_date ? `Salida: ${format(new Date(service.cruise_departure_date), 'd MMM', { locale: es })}` : ''
        };
      case 'dmc':
        return {
          title: service.dmc_name || service.dmc_destination || 'DMC',
          subtitle: service.dmc_services || service.dmc_destination || '',
          extra: service.dmc_date ? format(new Date(service.dmc_date), 'd MMM yyyy', { locale: es }) : ''
        };
      case 'otro':
        return {
          title: service.other_name || service.other_description?.substring(0, 50) || 'Servicio',
          subtitle: service.other_name && service.other_description ? service.other_description : '',
          extra: service.other_date ? format(new Date(service.other_date), 'd MMM yyyy', { locale: es }) : ''
        };
      default:
        return { title: 'Servicio', subtitle: '', extra: '' };
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
  const paymentProgress = totalServices > 0 ? Math.round((totalClientPaid / totalServices) * 100) : 0;
  
  const daysUntilTrip = differenceInDays(new Date(soldTrip.start_date), new Date());
  const isTripPast = isPast(new Date(soldTrip.start_date));
  const statusConfig = STATUS_CONFIG[soldTrip.status] || STATUS_CONFIG.pendiente;

  // Group services by type
  const servicesByType = services.reduce((acc, s) => {
    if (!acc[s.service_type]) acc[s.service_type] = [];
    acc[s.service_type].push(s);
    return acc;
  }, {});

  // Servicios con pagos pendientes próximos a vencer (menos de 30 días)
  const today = new Date();
  const pendingPaymentAlerts = services.filter(service => {
    if (!service.payment_due_date) return false;
    if (service.reservation_status === 'pagado') return false;
    
    const dueDate = new Date(service.payment_due_date);
    const daysUntilDue = differenceInDays(dueDate, today);
    return daysUntilDue <= 30;
  }).map(service => {
    const dueDate = new Date(service.payment_due_date);
    const daysUntilDue = differenceInDays(dueDate, today);
    const isOverdue = daysUntilDue < 0;
    return { ...service, daysUntilDue, isOverdue };
  }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Back & Title */}
          <div className="flex items-start gap-4 flex-1">
            <Link to={createPageUrl('SoldTrips')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-stone-800">{soldTrip.client_name}</h1>
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-stone-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" style={{ color: '#2E442A' }} />
                  <span className="font-medium">{soldTrip.destination}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(soldTrip.start_date), 'd MMM yyyy', { locale: es })}
                    {soldTrip.end_date && ` - ${format(new Date(soldTrip.end_date), 'd MMM', { locale: es })}`}
                  </span>
                </div>
                {soldTrip.travelers && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{soldTrip.travelers} viajero(s)</span>
                  </div>
                )}
                {!isTripPast && (
                  <Badge 
                    variant="outline" 
                    className={`${daysUntilTrip <= 7 ? 'border-red-300 text-red-600' : 'border-stone-300'}`}
                  >
                    {daysUntilTrip === 0 ? '¡Viaje hoy!' : daysUntilTrip < 0 ? 'Viaje pasado' : `Faltan ${daysUntilTrip} días`}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditTripOpen(true)}
              className="rounded-xl"
              style={{ borderColor: '#2E442A', color: '#2E442A' }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
            {paymentPlan.length === 0 && (
              <Button
                variant="outline"
                onClick={() => setPaymentPlanOpen(true)}
                className="rounded-xl"
                style={{ borderColor: '#2E442A', color: '#2E442A' }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Plan de Pagos
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setInvoiceOpen(true)}
              className="rounded-xl"
              style={{ borderColor: '#2E442A', color: '#2E442A' }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Invoice
            </Button>
            <Select 
              value={soldTrip.status} 
              onValueChange={(value) => updateTripMutation.mutate({ status: value })}
            >
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="parcial">Pago Parcial</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
              <DollarSign className="w-5 h-5" style={{ color: '#2E442A' }} />
            </div>
            <div>
              <p className="text-xs text-stone-400">Total Viaje</p>
              <p className="text-xl font-bold" style={{ color: '#2E442A' }}>${totalServices.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Comisiones</p>
              <p className="text-xl font-bold text-emerald-600">${totalCommissions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Cobrado</p>
              <p className="text-xl font-bold text-green-600">${totalClientPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Por Cobrar</p>
              <p className={`text-xl font-bold ${clientBalance > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                ${clientBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Pagado Proveedores</p>
              <p className="text-xl font-bold text-amber-600">${totalSupplierPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-stone-800">Progreso de Cobro</h3>
          <span className="text-sm font-medium" style={{ color: '#2E442A' }}>{paymentProgress}%</span>
        </div>
        <Progress value={paymentProgress} className="h-3" />
        <div className="flex justify-between mt-2 text-xs text-stone-400">
          <span>$0</span>
          <span>${totalServices.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Alerts */}
      {pendingPaymentAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-sm text-red-800">Pagos Pendientes ({pendingPaymentAlerts.length})</h3>
          </div>
          
          <div className="space-y-2">
            {pendingPaymentAlerts.map((service) => {
              const Icon = SERVICE_ICONS[service.service_type] || Package;
              const details = getServiceDetails(service);
              
              return (
                <div
                  key={service.id}
                  className={`p-3 rounded-lg border text-sm ${
                    service.isOverdue 
                      ? 'bg-red-100 border-red-300' 
                      : service.daysUntilDue <= 7 
                        ? 'bg-orange-100 border-orange-300' 
                        : 'bg-yellow-50 border-yellow-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${
                        service.isOverdue ? 'text-red-700' : service.daysUntilDue <= 7 ? 'text-orange-700' : 'text-yellow-700'
                      }`} />
                      <span className="font-medium text-stone-800 truncate">{details.title}</span>
                      <span className="text-xs text-stone-500 hidden sm:inline">• {SERVICE_LABELS[service.service_type]}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold" style={{ color: '#2E442A' }}>
                        ${(service.total_price || 0).toLocaleString()}
                      </span>
                      <Badge className={`text-xs ${
                        service.isOverdue 
                          ? 'bg-red-600 text-white' 
                          : service.daysUntilDue <= 7 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-yellow-500 text-white'
                      }`}>
                        {service.isOverdue 
                          ? `Vencido ${Math.abs(service.daysUntilDue)}d` 
                          : service.daysUntilDue === 0 
                            ? '¡Hoy!' 
                            : `${service.daysUntilDue}d`}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-stone-100 p-1 rounded-xl">
          <TabsTrigger value="services" className="rounded-lg">
            Servicios <Badge variant="secondary" className="ml-2 text-xs">{services.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="client-payments" className="rounded-lg">
            Pagos Cliente <Badge variant="secondary" className="ml-2 text-xs">{clientPayments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="supplier-payments" className="rounded-lg">
            Pagos Proveedores <Badge variant="secondary" className="ml-2 text-xs">{supplierPayments.length}</Badge>
          </TabsTrigger>
          {paymentPlan.length > 0 && (
            <TabsTrigger value="payment-plan" className="rounded-lg">
              Plan de Pagos <Badge variant="secondary" className="ml-2 text-xs">{paymentPlan.length}</Badge>
            </TabsTrigger>
          )}
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
                <Plus className="w-4 h-4 mr-1" /> Agregar Servicio
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
              <div className="p-5 space-y-6">
                {Object.entries(servicesByType).map(([type, typeServices]) => {
                  const Icon = SERVICE_ICONS[type] || Package;
                  const colors = SERVICE_COLORS[type] || SERVICE_COLORS.otro;
                  
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <h4 className="font-semibold text-stone-700">{SERVICE_LABELS[type]}s</h4>
                        <Badge variant="outline" className="text-xs">{typeServices.length}</Badge>
                      </div>
                      
                      <div className="space-y-3 ml-10">
                        <AnimatePresence>
                          {typeServices.map((service) => {
                            const details = getServiceDetails(service);
                            return (
                              <motion.div
                                key={service.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-sm transition-all`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <p className="font-semibold text-stone-800">{details.title}</p>
                                      <Badge variant="outline" className="text-xs">
                                        {service.booked_by === 'montecito' ? 'Montecito' : 'IATA Nomad'}
                                      </Badge>
                                      <Select
                                        value={service.reservation_status || 'reservado'}
                                        onValueChange={(value) => updateServiceMutation.mutate({ id: service.id, data: { reservation_status: value } })}
                                      >
                                        <SelectTrigger className={`h-6 w-auto text-xs rounded-md border-0 px-2 ${
                                          service.reservation_status === 'pagado' ? 'bg-green-100 text-green-700' :
                                          service.reservation_status === 'cancelado' ? 'bg-red-100 text-red-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="reservado">Reservado</SelectItem>
                                          <SelectItem value="pagado">Pagado</SelectItem>
                                          <SelectItem value="cancelado">Cancelado</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <p className="text-sm text-stone-600">{details.subtitle}</p>
                                    {details.extra && (
                                      <p className="text-xs text-stone-400 mt-1">{details.extra}</p>
                                    )}
                                    {service.notes && (
                                      <p className="text-xs text-stone-500 mt-2 italic">"{service.notes}"</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                  <p className="font-bold text-lg" style={{ color: '#2E442A' }}>
                                   ${(service.total_price || 0).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-stone-400">
                                   Comisión: ${(service.commission || 0).toLocaleString()}
                                  </p>
                                  {service.amount_paid_to_supplier > 0 && (
                                   <p className="text-xs text-amber-600 mt-1">
                                     Pagado: ${service.amount_paid_to_supplier.toLocaleString()}
                                   </p>
                                  )}
                                  {service.total_price - (service.amount_paid_to_supplier || 0) > 0 && (
                                   <p className="text-xs text-orange-500">
                                     Falta: ${(service.total_price - (service.amount_paid_to_supplier || 0)).toLocaleString()}
                                   </p>
                                  )}
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => { setEditingService(service); setServiceFormOpen(true); }}>
                                        <Edit2 className="w-4 h-4 mr-2" /> Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => setDeleteConfirm({ type: 'service', item: service })}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Services Summary */}
            {services.length > 0 && (
              <div className="p-5 bg-stone-50 border-t border-stone-100">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Total Servicios</p>
                    <p className="text-xl font-bold" style={{ color: '#2E442A' }}>${totalServices.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Total Comisiones</p>
                    <p className="text-xl font-bold text-emerald-600">${totalCommissions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Client Payments Tab */}
        <TabsContent value="client-payments">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-800">Pagos del Cliente</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Total cobrado: <span className="font-semibold text-green-600">${totalClientPaid.toLocaleString()}</span> de ${totalServices.toLocaleString()}
                </p>
              </div>
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
                icon={CreditCard}
                title="Sin pagos registrados"
                description="Registra los pagos recibidos del cliente"
                actionLabel="Registrar Pago"
                onAction={() => setClientPaymentOpen(true)}
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {clientPayments.sort((a, b) => new Date(b.date) - new Date(a.date)).map((payment, index) => (
                  <motion.div 
                    key={payment.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-green-600">
                        +${(payment.amount || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <span>{format(new Date(payment.date), 'd MMMM yyyy', { locale: es })}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs capitalize">{payment.method}</Badge>
                      </div>
                      {payment.notes && <p className="text-xs text-stone-400 mt-1">{payment.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-400 hover:text-blue-600"
                        onClick={() => {
                          setEditingClientPayment(payment);
                          setClientPaymentOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-400 hover:text-red-500"
                        onClick={() => setDeleteConfirm({ type: 'client', item: payment })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Supplier Payments Tab */}
        <TabsContent value="supplier-payments">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-800">Pagos a Proveedores</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Total pagado: <span className="font-semibold text-amber-600">${totalSupplierPaid.toLocaleString()}</span>
                </p>
              </div>
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
                icon={Building2}
                title="Sin pagos registrados"
                description="Registra los pagos realizados a proveedores"
                actionLabel="Registrar Pago"
                onAction={() => setSupplierPaymentOpen(true)}
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {supplierPayments.sort((a, b) => new Date(b.date) - new Date(a.date)).map((payment, index) => (
                  <motion.div 
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-4"
                    >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50">
                     <Building2 className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                     <p className="font-semibold text-stone-800">{payment.supplier}</p>
                     {payment.trip_service_id && (
                       <p className="text-xs text-blue-600 mt-0.5">
                         Asociado a servicio
                       </p>
                     )}
                     <div className="flex items-center gap-2 text-sm text-stone-500">
                       <span className="font-bold text-amber-600">${(payment.amount || 0).toLocaleString()}</span>
                       <span>•</span>
                       <span>{format(new Date(payment.date), 'd MMM yyyy', { locale: es })}</span>
                       <span>•</span>
                       <Badge variant="outline" className="text-xs capitalize">{payment.method}</Badge>
                     </div>
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
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Payment Plan Tab */}
        {paymentPlan.length > 0 && (
          <TabsContent value="payment-plan">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
              <div className="p-5 border-b border-stone-100">
                <h3 className="font-semibold text-stone-800">Plan de Pagos del Cliente</h3>
                <p className="text-sm text-stone-500 mt-1">
                  {paymentPlan.filter(p => p.status === 'pagado').length} de {paymentPlan.length} pagos completados
                </p>
              </div>

              <div className="divide-y divide-stone-100">
                {paymentPlan.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map((plan) => {
                  const dueDate = new Date(plan.due_date);
                  const today = new Date();
                  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntilDue < 0 && plan.status !== 'pagado';
                  
                  return (
                    <div 
                      key={plan.id}
                      className={`p-4 hover:bg-stone-50 transition-colors ${
                        isOverdue ? 'bg-red-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          plan.status === 'pagado' ? 'bg-green-50' :
                          isOverdue ? 'bg-red-50' :
                          'bg-blue-50'
                        }`}>
                          <span className={`font-bold ${
                            plan.status === 'pagado' ? 'text-green-600' :
                            isOverdue ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            #{plan.payment_number}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-lg" style={{ color: '#2E442A' }}>
                              ${plan.amount_due.toLocaleString()}
                            </p>
                            <Badge className={
                              plan.status === 'pagado' ? 'bg-green-100 text-green-700' :
                              plan.status === 'atrasado' ? 'bg-red-100 text-red-700' :
                              plan.status === 'parcial' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>
                              {plan.status === 'pagado' ? 'Pagado' :
                               plan.status === 'atrasado' ? 'Atrasado' :
                               plan.status === 'parcial' ? 'Parcial' :
                               'Pendiente'}
                            </Badge>
                            {plan.reminder_sent && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                ✓ Recordatorio Enviado
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-stone-500">
                            <Calendar className="w-3 h-3" />
                            <span>Vence: {format(dueDate, 'd MMMM yyyy', { locale: es })}</span>
                            {!isOverdue && daysUntilDue >= 0 && plan.status !== 'pagado' && (
                              <>
                                <span>•</span>
                                <span className={daysUntilDue <= 7 ? 'text-orange-600 font-medium' : ''}>
                                  {daysUntilDue === 0 ? '¡Hoy!' : `${daysUntilDue} días`}
                                </span>
                              </>
                            )}
                            {isOverdue && (
                              <>
                                <span>•</span>
                                <span className="text-red-600 font-medium">
                                  Vencido hace {Math.abs(daysUntilDue)} días
                                </span>
                              </>
                            )}
                          </div>
                          
                          {plan.amount_paid > 0 && plan.status !== 'pagado' && (
                            <p className="text-xs text-blue-600 mt-1">
                              Pagado parcialmente: ${plan.amount_paid.toLocaleString()} 
                              (Falta: ${(plan.amount_due - plan.amount_paid).toLocaleString()})
                            </p>
                          )}
                          
                          {plan.reminder_sent && (
                            <p className="text-xs text-stone-400 mt-1">
                              Último recordatorio: {format(new Date(plan.last_reminder_date), 'd MMM', { locale: es })}
                            </p>
                          )}
                          
                          {plan.notes && (
                            <p className="text-xs text-stone-500 mt-1 italic">"{plan.notes}"</p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPlanItem(plan)}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <ServiceForm
        open={serviceFormOpen}
        onClose={() => { setServiceFormOpen(false); setEditingService(null); }}
        service={editingService}
        soldTripId={tripId}
        onSave={handleSaveService}
        isLoading={createServiceMutation.isPending || updateServiceMutation.isPending}
      />

      <PaymentForm
        open={clientPaymentOpen}
        onClose={() => {
          setClientPaymentOpen(false);
          setEditingClientPayment(null);
        }}
        soldTripId={tripId}
        payment={editingClientPayment}
        type="client"
        onSave={(data) => {
          if (editingClientPayment) {
            updateClientPaymentMutation.mutate({ id: editingClientPayment.id, data });
          } else {
            createClientPaymentMutation.mutate(data);
          }
        }}
        isLoading={createClientPaymentMutation.isPending || updateClientPaymentMutation.isPending}
      />

      <SupplierPaymentForm
        open={supplierPaymentOpen}
        onClose={() => setSupplierPaymentOpen(false)}
        soldTripId={tripId}
        services={services}
        onSave={(data) => createSupplierPaymentMutation.mutate(data)}
        isLoading={createSupplierPaymentMutation.isPending}
      />

      <PaymentPlanForm
        open={paymentPlanOpen}
        onClose={() => setPaymentPlanOpen(false)}
        soldTripId={tripId}
        soldTrip={soldTrip}
        totalAmount={totalServices}
        onSave={(payments) => createPaymentPlanMutation.mutate(payments)}
        isLoading={createPaymentPlanMutation.isPending}
      />

      <EditPaymentPlanItem
        open={!!editingPlanItem}
        onClose={() => setEditingPlanItem(null)}
        planItem={editingPlanItem}
        onSave={(data) => updatePaymentPlanItemMutation.mutate({ id: editingPlanItem.id, data })}
        isLoading={updatePaymentPlanItemMutation.isPending}
      />

      <InvoiceView
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        soldTrip={soldTrip}
        services={services}
        clientPayments={clientPayments}
      />

      <SoldTripForm
        open={editTripOpen}
        onClose={() => setEditTripOpen(false)}
        soldTrip={soldTrip}
        onSave={(data) => updateTripMutation.mutate(data)}
        isLoading={updateTripMutation.isPending}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
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