import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Plane, Users, TrendingUp, Loader2, Award, AlertCircle, CheckCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { parseLocalDate } from '@/components/utils/dateHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedTrip, setSelectedTrip] = useState('all');
  const [showPendingCollection, setShowPendingCollection] = useState(false);
  const [showHighValueTrips, setShowHighValueTrips] = useState(false);

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseAPI.entities.User.list()
  });

  const { data: rawTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => supabaseAPI.entities.Trip.list()
  });

  const { data: rawSoldTrips = [], isLoading: soldLoading } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => supabaseAPI.entities.SoldTrip.list()
  });

  const { data: rawClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => supabaseAPI.entities.Client.list()
  });

  // Filter out deleted records
  const allTrips = rawTrips.filter(t => !t.is_deleted);
  const allSoldTrips = rawSoldTrips.filter(t => !t.is_deleted);
  const allClients = rawClients.filter(c => !c.is_deleted);

  const { data: allClientPayments = [] } = useQuery({
    queryKey: ['clientPayments'],
    queryFn: () => supabaseAPI.entities.ClientPayment.list()
  });

  const { data: allSupplierPayments = [] } = useQuery({
    queryKey: ['supplierPayments'],
    queryFn: () => supabaseAPI.entities.SupplierPayment.list()
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ['allServices'],
    queryFn: () => supabaseAPI.entities.TripService.list()
  });

  // Calculate account balance (confirmed payments only)
  const confirmedClientPayments = allClientPayments.filter(p => p.confirmed === true);
  // Exclude payments made with 'tarjeta_cliente' from agency balance (pero sí se cuentan en el viaje vendido)
  const confirmedSupplierPayments = allSupplierPayments.filter(p => p.confirmed === true && p.method !== 'tarjeta_cliente');

  // Filter by trip if selected
  let filteredClientPayments = confirmedClientPayments;
  let filteredSupplierPayments = confirmedSupplierPayments;
  let selectedTripData = null;

  if (selectedTrip !== 'all') {
    filteredClientPayments = confirmedClientPayments.filter(p => p.sold_trip_id === selectedTrip);
    filteredSupplierPayments = confirmedSupplierPayments.filter(p => p.sold_trip_id === selectedTrip);
    selectedTripData = allSoldTrips.find(t => t.id === selectedTrip);
  }

  const totalIncome = filteredClientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = filteredSupplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const accountBalance = totalIncome - totalExpenses;

  // Get all sold trips with client names for selector
  const tripsForSelector = allSoldTrips
    .filter(t => t.client_name)
    .map(t => ({
      id: t.id,
      label: `${t.client_name} - ${t.destination}`,
      client: t.client_name,
      destination: t.destination
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Filter by agent - include all users who have created trips
  const usersWithTrips = new Set(allSoldTrips.map(t => t.created_by).filter(Boolean));
  const agents = allUsers.filter(u => usersWithTrips.has(u.email));
  const trips = selectedAgent === 'all' ? allTrips : allTrips.filter(t => t.created_by === selectedAgent);
  const soldTrips = selectedAgent === 'all' ? allSoldTrips : allSoldTrips.filter(t => t.created_by === selectedAgent);
  const clients = selectedAgent === 'all' ? allClients : allClients.filter(c => c.created_by === selectedAgent);

  // Calculate monthly stats
  const [year, month] = selectedMonth.split('-');
  const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthEnd = endOfMonth(monthStart);

  const monthlySales = soldTrips
    .filter(trip => {
      if (!trip.created_date) return false;
      const created = parseLocalDate(trip.created_date.split('T')[0]);
      return isWithinInterval(created, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, trip) => sum + (trip.total_price || 0), 0);

  const monthlyCommission = soldTrips
    .filter(trip => {
      if (!trip.created_date) return false;
      const created = parseLocalDate(trip.created_date.split('T')[0]);
      return isWithinInterval(created, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, trip) => sum + (trip.total_commission || 0), 0);

  // High-value trips in quotation
  const highValueTrips = allTrips.filter(trip => 
    trip.stage === 'cotizando' && 
    (trip.budget || 0) > 20000
  ).map(trip => {
    const agent = allUsers.find(u => u.email === trip.created_by);
    return {
      ...trip,
      agentName: agent?.full_name || 'Sin asignar'
    };
  });

  // Clients with negative balance
  const clientsWithNegativeBalance = allSoldTrips.map(trip => {
    const clientPayments = allClientPayments
      .filter(p => p.sold_trip_id === trip.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const supplierPayments = allSupplierPayments
      .filter(p => p.sold_trip_id === trip.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calcular el total de servicios que el cliente debe pagar
    // Excluyendo los servicios marcados como "pagado" (pagados directamente al proveedor)
    const tripServices = allServices.filter(s => s.sold_trip_id === trip.id);
    const totalServicesToPay = tripServices.reduce((sum, s) => {
      if (s.reservation_status === 'pagado') return sum;
      return sum + (s.total_price || 0);
    }, 0);

    // Balance = totalServicesToPay - clientPayments (same as "Por Cobrar")
    const balance = totalServicesToPay - clientPayments;

    if (balance > 0) {
      const agent = allUsers.find(u => u.email === trip.created_by);
      return {
        ...trip,
        balance,
        clientPayments,
        supplierPayments,
        totalServicesToPay,
        agentName: agent?.full_name || 'Sin asignar'
      };
    }
    return null;
  }).filter(Boolean);

  // Top performers
  const agentStats = agents.map(agent => {
    const agentSoldTrips = allSoldTrips.filter(t => t.created_by === agent.email);
    const totalSales = agentSoldTrips.reduce((sum, t) => sum + (t.total_price || 0), 0);
    return {
      name: agent.full_name,
      email: agent.email,
      sales: totalSales,
      trips: agentSoldTrips.length
    };
  }).sort((a, b) => b.sales - a.sales);

  // Net Commissions Post-Trip Control
  const today = new Date();
  const finishedTripsWithNetCommissions = allSoldTrips
    .filter(trip => trip.end_date && isPast(parseLocalDate(trip.end_date)))
    .map(trip => {
      // Calculate client balance
      const totalPrice = trip.total_price || 0;
      const totalPaidByClient = trip.total_paid_by_client || 0;
      const clientBalance = totalPaidByClient - totalPrice;

      // Get services for this trip
      const tripServices = allServices.filter(s => s.sold_trip_id === trip.id);

      // Get supplier payments for this trip
      const supplierPaymentsForTrip = allSupplierPayments.filter(p => p.sold_trip_id === trip.id);

      // Calculate net commissions pending
      const netCommissionsPending = tripServices.reduce((sum, service) => {
        // Check if any supplier payment for this service is "neto"
        const hasNetoPayment = supplierPaymentsForTrip.some(
          p => p.trip_service_id === service.id && p.payment_type === 'neto'
        );

        // If commission not paid to agent yet and has neto payment
        if (!service.paid_to_agent && hasNetoPayment) {
          return sum + ((service.commission || 0) * 0.5); // 50% to agent
        }
        return sum;
      }, 0);

      // Only include trips with pending net commissions
      if (netCommissionsPending > 0) {
        const status = clientBalance >= netCommissionsPending ? 'ready' : 'review';
        const agent = allUsers.find(u => u.email === trip.created_by);
        
        return {
          ...trip,
          clientBalance,
          netCommissionsPending,
          status,
          agentName: agent?.full_name || 'Sin asignar'
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Sort: ready first, then by date
      if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
      return new Date(b.end_date) - new Date(a.end_date);
    });

  const readyCount = finishedTripsWithNetCommissions.filter(t => t.status === 'ready').length;
  const reviewCount = finishedTripsWithNetCommissions.filter(t => t.status === 'review').length;

  const isLoading = tripsLoading || soldLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-800">Dashboard Global</h1>
          <p className="text-stone-500 mt-1">Vista consolidada de toda la agencia</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = format(date, 'yyyy-MM');
                const label = format(date, 'MMMM yyyy', { locale: es });
                return (
                  <SelectItem key={value} value={value}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los agentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los agentes</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.email} value={agent.email}>
                  {agent.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Account Balance - Big Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8" />
              <h2 className="text-xl font-semibold opacity-90">Saldo en Cuenta</h2>
            </div>
            <div className="mb-6">
              <p className="text-5xl lg:text-6xl font-bold mb-2">
                ${accountBalance.toLocaleString()}
              </p>
              <p className="text-emerald-100 text-sm">
                {selectedTrip === 'all' 
                  ? 'Balance total de la agencia' 
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
                <p className="text-xs text-emerald-100 mt-1">{filteredClientPayments.length} pagos confirmados</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-emerald-100 text-sm mb-1">Total Pagado</p>
                <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-emerald-100 mt-1">{filteredSupplierPayments.length} pagos confirmados</p>
              </div>
            </div>
          </div>
          <div className="lg:w-80">
            <label className="block text-sm font-medium text-emerald-100 mb-2">
              Filtrar por Viaje
            </label>
            <Select value={selectedTrip} onValueChange={setSelectedTrip}>
              <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white h-12 rounded-xl">
                <SelectValue placeholder="Todos los viajes" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                <SelectItem value="all">Todos los viajes</SelectItem>
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
                {filteredClientPayments.length > 0 ? (
                  filteredClientPayments
                    .filter(p => p.date)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(payment => (
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
                {filteredSupplierPayments.length > 0 ? (
                  filteredSupplierPayments
                    .filter(p => p.date)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(payment => (
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

      {/* Pending Collection Alert */}
      {clientsWithNegativeBalance.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowPendingCollection(!showPendingCollection)}
            className="w-full p-4 flex items-center justify-between hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-bold text-red-900">
                  💰 Clientes con Saldo Por Cobrar
                </h3>
                <p className="text-sm text-red-800">
                  {clientsWithNegativeBalance.length} {clientsWithNegativeBalance.length === 1 ? 'viaje vendido tiene' : 'viajes vendidos tienen'} pagos pendientes de cobro
                </p>
              </div>
            </div>
            {showPendingCollection ? (
              <ChevronUp className="w-5 h-5 text-red-600 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
          </button>
          {showPendingCollection && (
            <div className="p-4 pt-0">
              <div className="space-y-2">
                {clientsWithNegativeBalance.map(trip => (
                  <div key={trip.id} className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-stone-800">{trip.client_name || 'Sin cliente'}</p>
                          <Badge variant="outline" className="text-xs">
                            {trip.agentName}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-600">{trip.destination}</p>
                        <div className="flex gap-3 mt-2 text-xs">
                          <span className="text-blue-600">Total: ${(trip.total_price || 0).toLocaleString()}</span>
                          <span className="text-green-600">Recibido: ${trip.clientPayments.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          ${trip.balance.toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-500">por cobrar</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* High Value Trips Alert */}
      {highValueTrips.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowHighValueTrips(!showHighValueTrips)}
            className="w-full p-4 flex items-center justify-between hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-bold text-amber-900">
                  ⚡ Oportunidades de Alto Valor en Cotización
                </h3>
                <p className="text-sm text-amber-800">
                  {highValueTrips.length} {highValueTrips.length === 1 ? 'viaje' : 'viajes'} con presupuesto mayor a $20,000 USD en etapa de cotización
                </p>
              </div>
            </div>
            {showHighValueTrips ? (
              <ChevronUp className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
          </button>
          {showHighValueTrips && (
            <div className="p-4 pt-0">
              <div className="space-y-2">
                {highValueTrips.map(trip => (
                  <div key={trip.id} className="bg-white rounded-lg p-3 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-stone-800">{trip.client_name || 'Sin cliente'}</p>
                          <Badge variant="outline" className="text-xs">
                            {trip.agentName}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-600">{trip.destination}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">
                          ${(trip.budget || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-500">presupuesto</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas del Mes"
          value={`$${monthlySales.toLocaleString()}`}
          subtitle="USD"
          icon={DollarSign}
        />
        <StatsCard
          title="Comisiones del Mes"
          value={`$${monthlyCommission.toLocaleString()}`}
          subtitle="USD"
          icon={TrendingUp}
        />
        <StatsCard
          title="Viajes Activos"
          value={trips.length}
          subtitle="En proceso"
          icon={Plane}
        />
        <StatsCard
          title="Clientes Totales"
          value={clients.length}
          subtitle="Registrados"
          icon={Users}
        />
      </div>



      {/* Top Performers */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5" style={{ color: '#2E442A' }} />
          <h3 className="text-lg font-bold text-stone-800">Top Performers (Total Histórico)</h3>
        </div>
        {agentStats.length > 0 ? (
          <div className="space-y-3">
            {agentStats.slice(0, 5).map((agent, index) => (
              <div key={agent.email} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#2E442A' }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800">{agent.name}</p>
                    <p className="text-xs text-stone-500">{agent.trips} viajes vendidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg" style={{ color: '#2E442A' }}>
                    ${agent.sales.toLocaleString()}
                  </p>
                  <p className="text-xs text-stone-500">en ventas</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-stone-500">No hay datos de agentes disponibles</p>
            <p className="text-xs text-stone-400 mt-2">
              {agents.length === 0
                ? 'No se encontraron usuarios con rol "user"'
                : 'No hay viajes vendidos registrados'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}