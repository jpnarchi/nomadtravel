import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval, isPast, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DollarSign,
  Plane,
  Users,
  TrendingUp,
  Loader2,
  Award,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Target,
  Clock,
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { parseLocalDate } from '@/components/utils/dateHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Skeleton Loading Component
const DashboardSkeleton = memo(() => (
  <div className="space-y-6 animate-pulse">
    <div className="h-10 bg-stone-200 rounded-lg w-64"></div>
    <div className="h-64 bg-stone-200 rounded-3xl"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-stone-200 rounded-xl"></div>
      ))}
    </div>
    <div className="h-96 bg-stone-200 rounded-xl"></div>
  </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

// Compact Stats Card
const CompactStatCard = memo(({ title, value, subtitle, icon: Icon, trend, trendValue, color = "emerald" }) => {
  const colorClasses = {
    emerald: "from-emerald-500 to-teal-600",
    blue: "from-blue-500 to-indigo-600",
    amber: "from-amber-500 to-orange-600",
    purple: "from-purple-500 to-pink-600",
    slate: "from-slate-500 to-stone-600"
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <div className="p-3 md:p-5 relative">
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-xs md:text-sm text-stone-500 font-medium mb-1">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-stone-900 mb-0.5">{value}</p>
          {subtitle && <p className="text-xs text-stone-400 line-clamp-2">{subtitle}</p>}
          {trendValue && <p className="text-xs text-stone-500 mt-1 line-clamp-1">{trendValue}</p>}
        </div>
      </div>
    </Card>
  );
});

CompactStatCard.displayName = 'CompactStatCard';

// Alert Card Component
const AlertCard = memo(({
  title,
  description,
  items,
  color = "red",
  icon: Icon,
  isExpanded,
  onToggle,
  renderItem
}) => {
  const colorClasses = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      subtext: "text-red-700",
      icon: "text-red-600",
      hover: "hover:bg-red-100",
      badge: "bg-red-600 text-white"
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      subtext: "text-amber-700",
      icon: "text-amber-600",
      hover: "hover:bg-amber-100",
      badge: "bg-amber-600 text-white"
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      subtext: "text-blue-700",
      icon: "text-blue-600",
      hover: "hover:bg-blue-100",
      badge: "bg-blue-600 text-white"
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
      <button
        onClick={onToggle}
        className={`w-full p-3 md:p-4 flex items-center justify-between ${colors.hover} transition-colors group`}
      >
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-4 h-4 md:w-4.5 md:h-4.5 ${colors.icon}`} />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className={`font-bold ${colors.text} text-xs md:text-sm truncate`}>{title}</h3>
              <span className={`${colors.badge} text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0`}>
                {items.length}
              </span>
            </div>
            <p className={`text-xs ${colors.subtext} truncate md:whitespace-normal`}>{description}</p>
          </div>
        </div>
        <div className="ml-2 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className={`w-4 h-4 ${colors.icon} transition-transform group-hover:scale-110`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${colors.icon} transition-transform group-hover:scale-110`} />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <div className="space-y-2 max-h-[60vh] md:max-h-96 overflow-y-auto pr-1">
            {items.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
});

AlertCard.displayName = 'AlertCard';

export default function AdminDashboard() {
  const [selectedAgent, setSelectedAgent] = useState(() => {
    return localStorage.getItem('dashboard_agent_filter') || 'all';
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem('dashboard_month_filter') || format(new Date(), 'yyyy-MM');
  });
  const [selectedTrip, setSelectedTrip] = useState('all');
  const [showPendingCollection, setShowPendingCollection] = useState(false);
  const [showHighValueTrips, setShowHighValueTrips] = useState(false);

  // Persist filters
  useEffect(() => {
    localStorage.setItem('dashboard_agent_filter', selectedAgent);
  }, [selectedAgent]);

  useEffect(() => {
    localStorage.setItem('dashboard_month_filter', selectedMonth);
  }, [selectedMonth]);

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

  // Memoized filtered data
  const allTrips = useMemo(() => rawTrips.filter(t => !t.is_deleted), [rawTrips]);
  const allSoldTrips = useMemo(() => rawSoldTrips.filter(t => !t.is_deleted), [rawSoldTrips]);
  const allClients = useMemo(() => rawClients.filter(c => !c.is_deleted), [rawClients]);

  // Memoized confirmed payments
  const confirmedClientPayments = useMemo(() =>
    allClientPayments.filter(p => p.confirmed === true),
    [allClientPayments]
  );

  const confirmedSupplierPayments = useMemo(() =>
    allSupplierPayments.filter(p => p.confirmed === true && p.method !== 'tarjeta_cliente'),
    [allSupplierPayments]
  );

  // Filter by trip if selected
  const { filteredClientPayments, filteredSupplierPayments, selectedTripData } = useMemo(() => {
    if (selectedTrip === 'all') {
      return {
        filteredClientPayments: confirmedClientPayments,
        filteredSupplierPayments: confirmedSupplierPayments,
        selectedTripData: null
      };
    }

    return {
      filteredClientPayments: confirmedClientPayments.filter(p => p.sold_trip_id === selectedTrip),
      filteredSupplierPayments: confirmedSupplierPayments.filter(p => p.sold_trip_id === selectedTrip),
      selectedTripData: allSoldTrips.find(t => t.id === selectedTrip)
    };
  }, [selectedTrip, confirmedClientPayments, confirmedSupplierPayments, allSoldTrips]);

  // Account balance calculations
  const { totalIncome, totalExpenses, accountBalance } = useMemo(() => {
    const income = filteredClientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const expenses = filteredSupplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      accountBalance: income - expenses
    };
  }, [filteredClientPayments, filteredSupplierPayments]);

  // Trips for selector
  const tripsForSelector = useMemo(() =>
    allSoldTrips
      .filter(t => t.client_name)
      .map(t => ({
        id: t.id,
        label: `${t.client_name} - ${t.destination}`,
        client: t.client_name,
        destination: t.destination
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [allSoldTrips]
  );

  // Filter by agent
  const { agents, trips, soldTrips, clients } = useMemo(() => {
    const usersWithTrips = new Set(allSoldTrips.map(t => t.created_by).filter(Boolean));
    const agentsList = allUsers.filter(u => usersWithTrips.has(u.email));

    if (selectedAgent === 'all') {
      return {
        agents: agentsList,
        trips: allTrips,
        soldTrips: allSoldTrips,
        clients: allClients
      };
    }

    return {
      agents: agentsList,
      trips: allTrips.filter(t => t.created_by === selectedAgent),
      soldTrips: allSoldTrips.filter(t => t.created_by === selectedAgent),
      clients: allClients.filter(c => c.created_by === selectedAgent)
    };
  }, [selectedAgent, allUsers, allTrips, allSoldTrips, allClients]);

  // Monthly stats with comparison
  const monthlyStats = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = endOfMonth(monthStart);

    const prevMonthStart = subMonths(monthStart, 1);
    const prevMonthEnd = endOfMonth(prevMonthStart);

    const currentMonthSales = soldTrips
      .filter(trip => {
        if (!trip.created_date) return false;
        const created = parseLocalDate(trip.created_date.split('T')[0]);
        return isWithinInterval(created, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, trip) => sum + (trip.total_price || 0), 0);

    const prevMonthSales = soldTrips
      .filter(trip => {
        if (!trip.created_date) return false;
        const created = parseLocalDate(trip.created_date.split('T')[0]);
        return isWithinInterval(created, { start: prevMonthStart, end: prevMonthEnd });
      })
      .reduce((sum, trip) => sum + (trip.total_price || 0), 0);

    const currentMonthCommission = soldTrips
      .filter(trip => {
        if (!trip.created_date) return false;
        const created = parseLocalDate(trip.created_date.split('T')[0]);
        return isWithinInterval(created, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, trip) => sum + (trip.total_commission || 0), 0);

    const prevMonthCommission = soldTrips
      .filter(trip => {
        if (!trip.created_date) return false;
        const created = parseLocalDate(trip.created_date.split('T')[0]);
        return isWithinInterval(created, { start: prevMonthStart, end: prevMonthEnd });
      })
      .reduce((sum, trip) => sum + (trip.total_commission || 0), 0);

    const salesTrend = prevMonthSales > 0
      ? Math.round(((currentMonthSales - prevMonthSales) / prevMonthSales) * 100)
      : 0;

    const commissionTrend = prevMonthCommission > 0
      ? Math.round(((currentMonthCommission - prevMonthCommission) / prevMonthCommission) * 100)
      : 0;

    return {
      sales: currentMonthSales,
      commission: currentMonthCommission,
      salesTrend,
      commissionTrend,
      prevSales: prevMonthSales,
      prevCommission: prevMonthCommission
    };
  }, [soldTrips, selectedMonth]);

  // Additional metrics
  const additionalMetrics = useMemo(() => {
    // Conversion rate (trips sold / total trips)
    const conversionRate = trips.length > 0
      ? Math.round((soldTrips.length / trips.length) * 100)
      : 0;

    // Average ticket
    const averageTicket = soldTrips.length > 0
      ? Math.round(soldTrips.reduce((sum, t) => sum + (t.total_price || 0), 0) / soldTrips.length)
      : 0;

    // Active quotations
    const activeQuotations = trips.filter(t => t.stage === 'cotizando').length;

    // Trips in negotiation
    const inNegotiation = trips.filter(t => t.stage === 'negociacion').length;

    return {
      conversionRate,
      averageTicket,
      activeQuotations,
      inNegotiation
    };
  }, [trips, soldTrips]);

  // High-value trips with agents
  const highValueTrips = useMemo(() =>
    allTrips
      .filter(trip => trip.stage === 'cotizando' && (trip.budget || 0) > 20000)
      .map(trip => {
        const agent = allUsers.find(u => u.email === trip.created_by);
        return {
          ...trip,
          agentName: agent?.full_name || 'Sin asignar'
        };
      })
      .sort((a, b) => (b.budget || 0) - (a.budget || 0)),
    [allTrips, allUsers]
  );

  // Clients with negative balance
  const clientsWithNegativeBalance = useMemo(() =>
    allSoldTrips
      .map(trip => {
        const clientPayments = allClientPayments
          .filter(p => p.sold_trip_id === trip.id)
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const tripServices = allServices.filter(s => s.sold_trip_id === trip.id);
        const totalServicesToPay = tripServices.reduce((sum, s) => {
          const reservationStatus = s.reservation_status || s.metadata?.reservation_status;
          if (reservationStatus === 'pagado') return sum;
          return sum + (s.total_price || s.price || 0);
        }, 0);

        const balance = totalServicesToPay - clientPayments;

        if (balance > 0) {
          const agent = allUsers.find(u => u.email === trip.created_by);
          return {
            ...trip,
            balance,
            clientPayments,
            totalServicesToPay,
            agentName: agent?.full_name || 'Sin asignar'
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.balance - a.balance),
    [allSoldTrips, allClientPayments, allServices, allUsers]
  );

  // Top performers
  const agentStats = useMemo(() =>
    agents
      .map(agent => {
        const agentSoldTrips = allSoldTrips.filter(t => t.created_by === agent.email);
        const totalSales = agentSoldTrips.reduce((sum, t) => sum + (t.total_price || 0), 0);
        const avgTicket = agentSoldTrips.length > 0 ? totalSales / agentSoldTrips.length : 0;

        return {
          name: agent.full_name,
          email: agent.email,
          sales: totalSales,
          trips: agentSoldTrips.length,
          avgTicket
        };
      })
      .sort((a, b) => b.sales - a.sales),
    [agents, allSoldTrips]
  );

  const isLoading = tripsLoading || soldLoading || usersLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-stone-800">Dashboard Global</h1>
          <p className="text-sm md:text-base text-stone-500 mt-1">Vista consolidada de toda la agencia</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-40">
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
            <SelectTrigger className="w-full sm:w-48">
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

      {/* Account Balance - Compact Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 text-white">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 md:gap-3 mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h2 className="text-base md:text-lg font-semibold opacity-90">Saldo en Cuenta</h2>
            </div>
            <div className="mb-3 md:mb-4">
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1">
                ${accountBalance.toLocaleString()}
              </p>
              <p className="text-emerald-100 text-xs md:text-sm">
                {selectedTrip === 'all'
                  ? 'Balance total de la agencia'
                  : selectedTripData
                    ? `${selectedTripData.client_name} - ${selectedTripData.destination}`
                    : 'Balance del viaje seleccionado'
                }
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2.5 md:p-3">
                <p className="text-emerald-100 text-xs mb-1">Total Cobrado</p>
                <p className="text-lg md:text-xl font-bold">${totalIncome.toLocaleString()}</p>
                <p className="text-xs text-emerald-100 mt-0.5">{filteredClientPayments.length} pagos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2.5 md:p-3">
                <p className="text-emerald-100 text-xs mb-1">Total Pagado</p>
                <p className="text-lg md:text-xl font-bold">${totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-emerald-100 mt-0.5">{filteredSupplierPayments.length} pagos</p>
              </div>
            </div>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-emerald-100 mb-2">
              Filtrar por Viaje
            </label>
            <Select value={selectedTrip} onValueChange={setSelectedTrip}>
              <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white h-11 rounded-xl w-full">
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
          </div>
        </div>

        {/* Payment Details - When trip is selected */}
        {selectedTrip !== 'all' && (
          <div className="mt-3 md:mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {/* Client Payments */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-3">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2 text-xs md:text-sm">
                <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Pagos del Cliente
              </h4>
              <div className="space-y-1.5 md:space-y-2 max-h-40 md:max-h-48 overflow-y-auto">
                {filteredClientPayments.length > 0 ? (
                  filteredClientPayments
                    .filter(p => p.date)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(payment => (
                    <div key={payment.id} className="bg-white/20 rounded-lg p-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium text-sm">${payment.amount.toLocaleString()}</p>
                          <p className="text-emerald-100 text-xs">
                            {format(parseLocalDate(payment.date), 'd MMM yyyy', { locale: es })}
                          </p>
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
            <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-3">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2 text-xs md:text-sm">
                <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Pagos a Proveedores
              </h4>
              <div className="space-y-1.5 md:space-y-2 max-h-40 md:max-h-48 overflow-y-auto">
                {filteredSupplierPayments.length > 0 ? (
                  filteredSupplierPayments
                    .filter(p => p.date)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(payment => (
                    <div key={payment.id} className="bg-white/20 rounded-lg p-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium text-sm">${payment.amount.toLocaleString()}</p>
                          <p className="text-emerald-100 text-xs">
                            {format(parseLocalDate(payment.date), 'd MMM yyyy', { locale: es })}
                          </p>
                          <p className="text-emerald-200 text-xs">{payment.supplier}</p>
                        </div>
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

      {/* Alerts */}
      <div className="space-y-2 md:space-y-3">
        {clientsWithNegativeBalance.length > 0 && (
          <AlertCard
            title="💰 Clientes con Saldo Por Cobrar"
            description={`${clientsWithNegativeBalance.length} ${clientsWithNegativeBalance.length === 1 ? 'viaje tiene' : 'viajes tienen'} pagos pendientes`}
            items={clientsWithNegativeBalance}
            color="red"
            icon={AlertCircle}
            isExpanded={showPendingCollection}
            onToggle={() => setShowPendingCollection(!showPendingCollection)}
            renderItem={(trip) => (
              <div key={trip.id} className="bg-white rounded-lg p-2.5 md:p-3 border border-red-100 hover:border-red-300 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <p className="font-semibold text-stone-800 text-xs md:text-sm truncate">{trip.client_name || 'Sin cliente'}</p>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {trip.agentName}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-600 mb-1.5 truncate">{trip.destination}</p>
                    <div className="flex flex-col sm:flex-row sm:gap-3 gap-1 text-xs">
                      <span className="text-blue-600 font-medium">Total: ${(trip.total_price || 0).toLocaleString()}</span>
                      <span className="text-green-600 font-medium">Recibido: ${trip.clientPayments.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base md:text-lg font-bold text-red-600">
                      ${trip.balance.toLocaleString()}
                    </p>
                    <p className="text-xs text-stone-500 whitespace-nowrap">por cobrar</p>
                  </div>
                </div>
              </div>
            )}
          />
        )}

        {highValueTrips.length > 0 && (
          <AlertCard
            title="⚡ Oportunidades de Alto Valor"
            description={`${highValueTrips.length} ${highValueTrips.length === 1 ? 'cotización' : 'cotizaciones'} mayores a $20,000 USD`}
            items={highValueTrips}
            color="amber"
            icon={Target}
            isExpanded={showHighValueTrips}
            onToggle={() => setShowHighValueTrips(!showHighValueTrips)}
            renderItem={(trip) => (
              <div key={trip.id} className="bg-white rounded-lg p-2.5 md:p-3 border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <p className="font-semibold text-stone-800 text-xs md:text-sm truncate">{trip.client_name || 'Sin cliente'}</p>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {trip.agentName}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-600 truncate">{trip.destination}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base md:text-lg font-bold text-amber-600">
                      ${(trip.budget || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-stone-500 whitespace-nowrap">presupuesto</p>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <CompactStatCard
          title="Ventas del Mes"
          value={`$${monthlyStats.sales.toLocaleString()}`}
          subtitle="USD"
          icon={DollarSign}
          trend={monthlyStats.salesTrend}
          trendValue={`vs mes anterior: $${monthlyStats.prevSales.toLocaleString()}`}
          color="emerald"
        />
        <CompactStatCard
          title="Comisiones del Mes"
          value={`$${monthlyStats.commission.toLocaleString()}`}
          subtitle="USD"
          icon={TrendingUp}
          trend={monthlyStats.commissionTrend}
          trendValue={`vs mes anterior: $${monthlyStats.prevCommission.toLocaleString()}`}
          color="blue"
        />
        <CompactStatCard
          title="Viajes Activos"
          value={trips.length}
          subtitle={`${additionalMetrics.activeQuotations} cotizando, ${additionalMetrics.inNegotiation} en negociación`}
          icon={Plane}
          color="purple"
        />
        <CompactStatCard
          title="Clientes Totales"
          value={clients.length}
          subtitle="Registrados en el sistema"
          icon={Users}
          color="slate"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <CompactStatCard
          title="Tasa de Conversión"
          value={`${additionalMetrics.conversionRate}%`}
          subtitle={`${soldTrips.length} vendidos de ${trips.length} totales`}
          icon={Percent}
          color="emerald"
        />
        <CompactStatCard
          title="Ticket Promedio"
          value={`$${additionalMetrics.averageTicket.toLocaleString()}`}
          subtitle="USD por viaje vendido"
          icon={DollarSign}
          color="blue"
        />
        <CompactStatCard
          title="Viajes Vendidos"
          value={soldTrips.length}
          subtitle="Total histórico"
          icon={CheckCircle}
          color="amber"
        />
      </div>

      {/* Top Performers */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-stone-800">Top Performers</h3>
          <Badge variant="outline" className="ml-auto">Total Histórico</Badge>
        </div>
        {agentStats.length > 0 ? (
          <div className="space-y-2">
            {agentStats.slice(0, 5).map((agent, index) => (
              <div key={agent.email} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md"
                    style={{
                      background: index === 0
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : index === 1
                        ? 'linear-gradient(135deg, #C0C0C0, #808080)'
                        : index === 2
                        ? 'linear-gradient(135deg, #CD7F32, #8B4513)'
                        : 'linear-gradient(135deg, #2E442A, #1a2817)'
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800">{agent.name}</p>
                    <p className="text-xs text-stone-500">
                      {agent.trips} viajes • ${Math.round(agent.avgTicket).toLocaleString()} ticket promedio
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-emerald-600">
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
          </div>
        )}
      </Card>
    </div>
  );
}
