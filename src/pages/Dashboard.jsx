import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Plane, Users, TrendingUp, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { ViewModeContext } from '@/Layout';
import StatsCard from '@/components/ui/StatsCard';
import FunnelChart from '@/components/dashboard/FunnelChart';
import UpcomingTrips from '@/components/dashboard/UpcomingTrips';
import TasksList from '@/components/dashboard/TasksList';
import UpcomingPayments from '@/components/dashboard/UpcomingPayments';
import ActiveReminders from '@/components/dashboard/ActiveReminders';
import { parseLocalDate } from '@/components/utils/dateHelpers';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { viewMode } = useContext(ViewModeContext);
  const [user, setUser] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin' && viewMode === 'admin';

  const { data: allTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.Trip.list();
      return base44.entities.Trip.filter({ created_by: user.email });
    },
    enabled: !!user
  });

  const { data: allSoldTrips = [], isLoading: soldLoading } = useQuery({
    queryKey: ['soldTrips', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.SoldTrip.list();
      return base44.entities.SoldTrip.filter({ created_by: user.email });
    },
    enabled: !!user
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.Client.list();
      return base44.entities.Client.filter({ created_by: user.email });
    },
    enabled: !!user
  });

  // Filter out deleted records
  const trips = allTrips.filter(t => !t.is_deleted);
  const soldTrips = allSoldTrips.filter(t => !t.is_deleted);
  const clients = allClients.filter(c => !c.is_deleted);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.Task.list();
      return base44.entities.Task.filter({ created_by: user.email });
    },
    enabled: !!user
  });

  const soldTripIds = soldTrips.map(t => t.id);
  const { data: allServices = [] } = useQuery({
    queryKey: ['services', soldTripIds],
    queryFn: async () => {
      if (soldTripIds.length === 0) return [];
      return base44.entities.TripService.list();
    },
    enabled: soldTripIds.length > 0
  });

  // Filter services to only show user's trips
  const services = allServices.filter(service => 
    soldTripIds.includes(service.sold_trip_id)
  );

  const { data: allClientPayments = [] } = useQuery({
    queryKey: ['clientPayments'],
    queryFn: () => base44.entities.ClientPayment.list(),
    enabled: !!user
  });

  const { data: allSupplierPayments = [] } = useQuery({
    queryKey: ['supplierPayments'],
    queryFn: () => base44.entities.SupplierPayment.list(),
    enabled: !!user
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  // Calculate monthly sales
  const thisMonth = {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  };

  const monthlySales = soldTrips
    .filter(trip => {
      const created = new Date(trip.created_date);
      return isWithinInterval(created, thisMonth);
    })
    .reduce((sum, trip) => sum + (trip.total_price || 0), 0);

  const monthlyCommission = soldTrips
    .filter(trip => {
      const created = new Date(trip.created_date);
      return isWithinInterval(created, thisMonth);
    })
    .reduce((sum, trip) => sum + (trip.total_commission || 0), 0);

  // Clients with negative balance
  const myClientsWithNegativeBalance = soldTrips.map(trip => {
    const clientPayments = allClientPayments
      .filter(p => p.sold_trip_id === trip.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const supplierPayments = allSupplierPayments
      .filter(p => p.sold_trip_id === trip.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const balance = clientPayments - supplierPayments;
    
    if (balance < 0) {
      return {
        ...trip,
        balance,
        clientPayments,
        supplierPayments
      };
    }
    return null;
  }).filter(Boolean);



  // Account Balance Panel (similar to admin but filtered by user)
  const confirmedClientPayments = allClientPayments.filter(p => p.confirmed === true);
  const confirmedSupplierPayments = allSupplierPayments.filter(p => p.confirmed === true && p.method !== 'tarjeta_cliente');

  let filteredClientPaymentsForBalance = confirmedClientPayments;
  let filteredSupplierPaymentsForBalance = confirmedSupplierPayments;
  let selectedTripData = null;

  if (selectedTrip !== 'all') {
    filteredClientPaymentsForBalance = confirmedClientPayments.filter(p => p.sold_trip_id === selectedTrip);
    filteredSupplierPaymentsForBalance = confirmedSupplierPayments.filter(p => p.sold_trip_id === selectedTrip);
    selectedTripData = soldTrips.find(t => t.id === selectedTrip);
  } else {
    // Filter by user's trips only
    const userTripIds = soldTrips.map(t => t.id);
    filteredClientPaymentsForBalance = confirmedClientPayments.filter(p => userTripIds.includes(p.sold_trip_id));
    filteredSupplierPaymentsForBalance = confirmedSupplierPayments.filter(p => userTripIds.includes(p.sold_trip_id));
  }

  const totalIncome = filteredClientPaymentsForBalance.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = filteredSupplierPaymentsForBalance.reduce((sum, p) => sum + (p.amount || 0), 0);
  const accountBalance = totalIncome - totalExpenses;

  const tripsForSelector = soldTrips
    .filter(t => t.client_name)
    .map(t => ({
      id: t.id,
      label: `${t.client_name} - ${t.destination}`,
      client: t.client_name,
      destination: t.destination
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const isLoading = tripsLoading || soldLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-0.5">Vista general de tu actividad</p>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Ventas del Mes"
          value={`$${monthlySales.toLocaleString()}`}
          subtitle="USD"
          icon={DollarSign}
        />
        <StatsCard
          title="Comisiones"
          value={`$${monthlyCommission.toLocaleString()}`}
          subtitle="Este mes"
          icon={TrendingUp}
        />
        <StatsCard
          title="Viajes"
          value={trips.length}
          subtitle="En proceso"
          icon={Plane}
        />
        <StatsCard
          title="Clientes"
          value={clients.length}
          subtitle="Totales"
          icon={Users}
        />
      </div>

      {/* Account Balance Panel */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8" />
              <h2 className="text-xl font-semibold opacity-90">Mi Saldo en Cuenta</h2>
            </div>
            <div className="mb-6">
              <p className="text-5xl lg:text-6xl font-bold mb-2">
                ${accountBalance.toLocaleString()}
              </p>
              <p className="text-emerald-100 text-sm">
                {selectedTrip === 'all' 
                  ? 'Balance total de mis clientes' 
                  : selectedTripData 
                    ? `Balance de ${selectedTripData.client_name} - ${selectedTripData.destination}`
                    : 'Balance del viaje seleccionado'
                }
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-emerald-100 text-sm mb-1">Total Cobrado</p>
                <p className="text-2xl font-bold">${totalIncome.toLocaleString()}</p>
                <p className="text-xs text-emerald-100 mt-1">{filteredClientPaymentsForBalance.length} pagos confirmados</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-emerald-100 text-sm mb-1">Total Pagado</p>
                <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-emerald-100 mt-1">{filteredSupplierPaymentsForBalance.length} pagos confirmados</p>
              </div>
            </div>
          </div>
          <div className="lg:w-80">
            <label className="block text-sm font-medium text-emerald-100 mb-2">
              Filtrar por Viaje
            </label>
            <Select value={selectedTrip} onValueChange={setSelectedTrip}>
              <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white h-12 rounded-xl">
                <SelectValue placeholder="Todos mis viajes" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                <SelectItem value="all">Todos mis viajes</SelectItem>
                {tripsForSelector.map(trip => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTrip !== 'all' && (
              <p className="text-xs text-emerald-100 mt-2">
                Solo mostrando pagos confirmados de este viaje
              </p>
            )}
          </div>
        </div>

        {/* Payment Details - When trip is selected */}
        {selectedTrip !== 'all' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Payments */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pagos del Cliente
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredClientPaymentsForBalance.length > 0 ? (
                  filteredClientPaymentsForBalance.sort((a, b) => new Date(b.date) - new Date(a.date)).map(payment => (
                    <div key={payment.id} className="bg-white/20 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">${payment.amount.toLocaleString()}</p>
                          <p className="text-emerald-100 text-xs mt-1">
                            {format(parseLocalDate(payment.date), 'd MMM yyyy', { locale: es })}
                          </p>
                          <p className="text-emerald-200 text-xs capitalize">{payment.method}</p>
                        </div>
                        {payment.notes && (
                          <p className="text-emerald-100 text-xs max-w-[150px]">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-emerald-100 text-sm">Sin pagos registrados</p>
                )}
              </div>
            </div>

            {/* Supplier Payments */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pagos a Proveedores
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredSupplierPaymentsForBalance.length > 0 ? (
                  filteredSupplierPaymentsForBalance.sort((a, b) => new Date(b.date) - new Date(a.date)).map(payment => (
                    <div key={payment.id} className="bg-white/20 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">${payment.amount.toLocaleString()}</p>
                          <p className="text-emerald-100 text-xs mt-1">
                            {format(parseLocalDate(payment.date), 'd MMM yyyy', { locale: es })}
                          </p>
                          <p className="text-emerald-200 text-xs">{payment.supplier}</p>
                          <p className="text-emerald-200 text-xs capitalize">{payment.method}</p>
                        </div>
                        {payment.notes && (
                          <p className="text-emerald-100 text-xs max-w-[150px]">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-emerald-100 text-sm">Sin pagos registrados</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Negative Balance Alert */}
      {myClientsWithNegativeBalance.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2">
                🚨 Clientes con Saldo Negativo
              </h3>
              <p className="text-sm text-red-800 mb-3">
                {myClientsWithNegativeBalance.length} {myClientsWithNegativeBalance.length === 1 ? 'viaje tiene' : 'viajes tienen'} gastos mayores a los pagos recibidos:
              </p>
              <div className="space-y-2">
                {myClientsWithNegativeBalance.map(trip => (
                  <div key={trip.id} className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-stone-800">{trip.client_name || 'Sin cliente'}</p>
                        <p className="text-sm text-stone-600">{trip.destination}</p>
                        <div className="flex gap-3 mt-2 text-xs">
                          <span className="text-green-600">Recibido: ${trip.clientPayments.toLocaleString()}</span>
                          <span className="text-red-600">Pagado: ${trip.supplierPayments.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          ${Math.abs(trip.balance).toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-500">saldo negativo</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column - Priority Content */}
        <div className="lg:col-span-2 space-y-3">
          {/* Active Reminders - Top Priority */}
          <ActiveReminders userEmail={user?.email} isAdmin={isAdmin} />
          
          {/* Two Column Sub-Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <UpcomingTrips soldTrips={soldTrips} />
            <FunnelChart trips={trips} />
          </div>
          
          {/* Payments */}
          <UpcomingPayments services={services} soldTrips={soldTrips} />
        </div>

        {/* Right Sidebar - Tasks */}
        <div className="lg:col-span-1">
          <TasksList
            tasks={tasks}
            onToggle={(task) => updateTaskMutation.mutate({ 
              id: task.id, 
              data: { completed: !task.completed } 
            })}
            onDelete={(task) => deleteTaskMutation.mutate(task.id)}
            onCreate={(data) => createTaskMutation.mutate(data)}
          />
        </div>
      </div>
    </div>
  );
}