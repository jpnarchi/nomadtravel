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
import { parseLocalDate, formatDate } from '@/components/utils/dateHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FinancialSummary from './SoldTripDetail/components/FinancialSummary';

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

const ACCENT = {
  emerald: '#2D4629',
  blue:    '#1D4ED8',
  amber:   '#C9A84C',
  purple:  '#7C3AED',
  slate:   '#475569',
};

const CompactStatCard = memo(({ title, value, subtitle, icon: Icon, trend, trendValue, color = "emerald" }) => {
  const accent = ACCENT[color] || ACCENT.emerald;
  return (
    <div className="bg-white rounded-2xl p-5"
         style={{ border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wide"
           style={{ color: '#AEAEB2', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>
          {title}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          {trend !== undefined && (
            <span className="text-xs font-semibold flex items-center gap-0.5"
                  style={{ color: trend >= 0 ? '#16A34A' : '#DC2626' }}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: `${accent}18` }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
        </div>
      </div>
      <p className="text-2xl font-bold leading-tight"
         style={{ color: '#1C1C1E', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {subtitle && <p className="text-xs mt-1" style={{ color: '#AEAEB2' }}>{subtitle}</p>}
      {trendValue && <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>{trendValue}</p>}
    </div>
  );
});

CompactStatCard.displayName = 'CompactStatCard';

const ALERT_ACCENT = {
  red:   { border: 'rgba(220,38,38,0.18)',  bg: 'rgba(220,38,38,0.06)',  iconColor: '#DC2626', badgeBg: '#DC2626' },
  amber: { border: 'rgba(201,168,76,0.25)', bg: 'rgba(201,168,76,0.07)', iconColor: '#C9A84C', badgeBg: '#C9A84C' },
  blue:  { border: 'rgba(29,78,216,0.18)',  bg: 'rgba(29,78,216,0.06)',  iconColor: '#1D4ED8', badgeBg: '#1D4ED8' },
};

const AlertCard = memo(({ title, description, items, color = "red", icon: Icon, isExpanded, onToggle, renderItem }) => {
  const a = ALERT_ACCENT[color] || ALERT_ACCENT.red;
  return (
    <div className="bg-white rounded-2xl overflow-hidden"
         style={{ border: `1px solid ${a.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <button
        onClick={onToggle}
        className="w-full px-5 py-3.5 flex items-center justify-between transition-colors"
        style={{ background: isExpanded ? a.bg : 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = a.bg; }}
        onMouseLeave={e => { e.currentTarget.style.background = isExpanded ? a.bg : 'transparent'; }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: a.bg, border: `1px solid ${a.border}` }}>
            <Icon className="w-4 h-4" style={{ color: a.iconColor }} />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E', fontFamily: 'Inter, sans-serif' }}>
                {title}
              </p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ background: a.badgeBg }}>
                {items.length}
              </span>
            </div>
            <p className="text-xs truncate" style={{ color: '#AEAEB2' }}>{description}</p>
          </div>
        </div>
        <div className="ml-3 flex-shrink-0">
          {isExpanded
            ? <ChevronUp className="w-4 h-4" style={{ color: a.iconColor }} />
            : <ChevronDown className="w-4 h-4" style={{ color: '#AEAEB2' }} />}
        </div>
      </button>
      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="space-y-2 max-h-96 overflow-y-auto">
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
  // When a specific trip is selected, use ALL payments (same as useTripMetrics/FinancialSummary)
  const { filteredClientPayments, filteredSupplierPayments, selectedTripData } = useMemo(() => {
    if (selectedTrip === 'all') {
      return {
        filteredClientPayments: confirmedClientPayments,
        filteredSupplierPayments: confirmedSupplierPayments,
        selectedTripData: null
      };
    }

    return {
      filteredClientPayments: allClientPayments.filter(p => p.sold_trip_id === selectedTrip),
      filteredSupplierPayments: allSupplierPayments.filter(p => p.sold_trip_id === selectedTrip),
      selectedTripData: allSoldTrips.find(t => t.id === selectedTrip)
    };
  }, [selectedTrip, confirmedClientPayments, confirmedSupplierPayments, allClientPayments, allSupplierPayments, allSoldTrips]);

  // Account balance calculations (matches useTripMetrics when trip is selected)
  const { totalIncome, totalExpenses, accountBalance, tripMetrics } = useMemo(() => {
    const income = filteredClientPayments.reduce((sum, p) => sum + (p.amount_usd_fixed || p.amount || 0), 0);
    const expenses = filteredSupplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // When a trip is selected, compute FinancialSummary metrics
    let metrics = null;
    if (selectedTrip !== 'all') {
      const tripServices = allServices.filter(s => s.sold_trip_id === selectedTrip);
      const totalServices = tripServices.reduce((sum, s) => sum + (s.price || 0), 0);
      const totalCommissions = tripServices.reduce((sum, s) => sum + (s.commission || 0), 0);

      const totalServicesToPay = tripServices.reduce((sum, s) => {
        const reservationStatus = s.reservation_status || s.metadata?.reservation_status;
        if (reservationStatus === 'pagado') return sum;
        return sum + (s.price || 0);
      }, 0);

      const clientBalance = Math.max(0, totalServicesToPay - income - expenses);
      const paymentProgress = totalServices > 0 ? Math.round((income / totalServices) * 100) : 0;

      metrics = {
        totalServices,
        totalCommissions,
        totalClientPaid: income,
        totalSupplierPaid: expenses,
        clientBalance,
        paymentProgress
      };
    }

    return {
      totalIncome: income,
      totalExpenses: expenses,
      accountBalance: income - expenses,
      tripMetrics: metrics
    };
  }, [filteredClientPayments, filteredSupplierPayments, selectedTrip, allServices]);

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

  // Clients with negative balance (same logic as useTripMetrics / FinancialSummary)
  const clientsWithNegativeBalance = useMemo(() =>
    allSoldTrips
      .map(trip => {
        const tripClientPayments = allClientPayments
          .filter(p => p.sold_trip_id === trip.id)
          .reduce((sum, p) => sum + (p.amount_usd_fixed || p.amount || 0), 0);

        const tripSupplierPayments = allSupplierPayments
          .filter(p => p.sold_trip_id === trip.id)
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const tripServices = allServices.filter(s => s.sold_trip_id === trip.id);
        const totalServices = tripServices.reduce((sum, s) => sum + (s.price || 0), 0);

        // Exclude services marked as "pagado" (paid directly to supplier)
        const totalServicesToPay = tripServices.reduce((sum, s) => {
          const reservationStatus = s.reservation_status || s.metadata?.reservation_status;
          if (reservationStatus === 'pagado') return sum;
          return sum + (s.price || 0);
        }, 0);

        const totalCommissions = tripServices.reduce((sum, s) => sum + (s.commission || 0), 0);
        const paymentProgress = totalServices > 0 ? Math.round((tripClientPayments / totalServices) * 100) : 0;

        // Balance = totalServicesToPay - clientPaid - supplierPaid (matches useTripMetrics)
        const rawBalance = Math.max(0, totalServicesToPay - tripClientPayments - tripSupplierPayments);
        const balance = Math.abs(rawBalance) < 2 ? 0 : rawBalance;

        if (balance > 0) {
          const agent = allUsers.find(u => u.email === trip.created_by);
          return {
            ...trip,
            balance,
            clientPayments: tripClientPayments,
            supplierPayments: tripSupplierPayments,
            totalServices,
            totalServicesToPay,
            totalCommissions,
            paymentProgress,
            agentName: agent?.full_name || 'Sin asignar'
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.balance - a.balance),
    [allSoldTrips, allClientPayments, allSupplierPayments, allServices, allUsers]
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

  const RANK_COLORS = ['#C9A84C', '#9CA3AF', '#CD7F32', '#2D4629', '#475569'];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Dashboard Global
          </h1>
          <p className="text-sm mt-1" style={{ color: '#AEAEB2' }}>Vista consolidada de toda la agencia</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-xs rounded-xl" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
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
            <SelectTrigger className="w-full sm:w-48 h-9 text-xs rounded-xl" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
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

      {/* Account Balance Panel */}
      <div className="bg-white rounded-2xl overflow-hidden"
           style={{ border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #2D4629, #C9A84C)' }} />
        <div className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            {/* Balance info */}
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide mb-1"
                 style={{ color: '#AEAEB2', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>
                {selectedTrip === 'all' ? 'Saldo en Cuenta' : 'Resumen del Viaje'}
              </p>
              {selectedTrip !== 'all' && selectedTripData && (
                <p className="text-xs mb-2" style={{ color: '#6B6B6F' }}>
                  {selectedTripData.client_name} — {selectedTripData.destination}
                </p>
              )}
              <p className="text-4xl font-bold mb-4"
                 style={{ color: '#1C1C1E', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>
                ${accountBalance.toLocaleString()}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.12)' }}>
                  <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: '#16A34A', letterSpacing: '0.06em' }}>Total Cobrado</p>
                  <p className="text-lg font-bold" style={{ color: '#1C1C1E', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                    ${totalIncome.toLocaleString()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>{filteredClientPayments.length} pagos</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.1)' }}>
                  <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: '#DC2626', letterSpacing: '0.06em' }}>Total Pagado</p>
                  <p className="text-lg font-bold" style={{ color: '#1C1C1E', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                    ${totalExpenses.toLocaleString()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>{filteredSupplierPayments.length} pagos</p>
                </div>
              </div>
            </div>
            {/* Trip selector */}
            <div className="lg:w-64">
              <p className="text-xs font-medium mb-1.5" style={{ color: '#6B6B6F' }}>Filtrar por viaje</p>
              <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                <SelectTrigger className="w-full h-9 text-xs rounded-xl" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <SelectValue placeholder="Todos los viajes" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="all">Todos los viajes</SelectItem>
                  {tripsForSelector.map(trip => (
                    <SelectItem key={trip.id} value={trip.id}>{trip.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* FinancialSummary when trip selected */}
      {selectedTrip !== 'all' && tripMetrics && (
        <FinancialSummary metrics={tripMetrics} />
      )}

      {/* Alerts */}
      <div className="space-y-2">
        {clientsWithNegativeBalance.length > 0 && (
          <AlertCard
            title="Clientes con Saldo Por Cobrar"
            description={`${clientsWithNegativeBalance.length} ${clientsWithNegativeBalance.length === 1 ? 'viaje tiene' : 'viajes tienen'} pagos pendientes`}
            items={clientsWithNegativeBalance}
            color="red"
            icon={AlertCircle}
            isExpanded={showPendingCollection}
            onToggle={() => setShowPendingCollection(!showPendingCollection)}
            renderItem={(trip) => (
              <div key={trip.id} className="rounded-xl p-3 transition-colors"
                   style={{ background: '#FAFAFA', border: '1px solid rgba(220,38,38,0.1)' }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)'; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.1)'; }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>{trip.client_name || 'Sin cliente'}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: '#F5F5F7', color: '#6B6B6F' }}>
                        {trip.agentName}
                      </span>
                    </div>
                    <p className="text-xs truncate mb-1" style={{ color: '#AEAEB2' }}>{trip.destination}</p>
                    <div className="flex gap-3 text-xs">
                      <span style={{ color: '#1D4ED8' }}>Total: ${(trip.totalServices || 0).toLocaleString()}</span>
                      <span style={{ color: '#16A34A' }}>Recibido: ${trip.clientPayments.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold" style={{ color: '#DC2626' }}>${trip.balance.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: '#AEAEB2' }}>por cobrar</p>
                  </div>
                </div>
              </div>
            )}
          />
        )}

        {highValueTrips.length > 0 && (
          <AlertCard
            title="Oportunidades de Alto Valor"
            description={`${highValueTrips.length} ${highValueTrips.length === 1 ? 'cotización' : 'cotizaciones'} mayores a $20,000 USD`}
            items={highValueTrips}
            color="amber"
            icon={Target}
            isExpanded={showHighValueTrips}
            onToggle={() => setShowHighValueTrips(!showHighValueTrips)}
            renderItem={(trip) => (
              <div key={trip.id} className="rounded-xl p-3 transition-colors"
                   style={{ background: '#FAFAFA', border: '1px solid rgba(201,168,76,0.15)' }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>{trip.client_name || 'Sin cliente'}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: '#F5F5F7', color: '#6B6B6F' }}>
                        {trip.agentName}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: '#AEAEB2' }}>{trip.destination}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold" style={{ color: '#C9A84C' }}>${(trip.budget || 0).toLocaleString()}</p>
                    <p className="text-xs" style={{ color: '#AEAEB2' }}>presupuesto</p>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CompactStatCard title="Ventas del Mes" value={`$${monthlyStats.sales.toLocaleString()}`} subtitle="USD"
          icon={DollarSign} trend={monthlyStats.salesTrend}
          trendValue={`vs mes anterior: $${monthlyStats.prevSales.toLocaleString()}`} color="emerald" />
        <CompactStatCard title="Comisiones del Mes" value={`$${monthlyStats.commission.toLocaleString()}`} subtitle="USD"
          icon={TrendingUp} trend={monthlyStats.commissionTrend}
          trendValue={`vs mes anterior: $${monthlyStats.prevCommission.toLocaleString()}`} color="blue" />
        <CompactStatCard title="Viajes Activos" value={trips.length}
          subtitle={`${additionalMetrics.activeQuotations} cotizando, ${additionalMetrics.inNegotiation} en negociación`}
          icon={Plane} color="purple" />
        <CompactStatCard title="Clientes Totales" value={clients.length}
          subtitle="Registrados en el sistema" icon={Users} color="slate" />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CompactStatCard title="Tasa de Conversión" value={`${additionalMetrics.conversionRate}%`}
          subtitle={`${soldTrips.length} vendidos de ${trips.length} totales`} icon={Percent} color="emerald" />
        <CompactStatCard title="Ticket Promedio" value={`$${additionalMetrics.averageTicket.toLocaleString()}`}
          subtitle="USD por viaje vendido" icon={DollarSign} color="blue" />
        <CompactStatCard title="Viajes Vendidos" value={soldTrips.length}
          subtitle="Total histórico" icon={CheckCircle} color="amber" />
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-2xl overflow-hidden"
           style={{ border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-4 flex items-center justify-between"
             style={{ borderBottom: '1px solid rgba(0,0,0,0.055)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'rgba(201,168,76,0.12)' }}>
              <Award className="w-4 h-4" style={{ color: '#C9A84C' }} />
            </div>
            <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#1C1C1E', letterSpacing: '-0.01em' }}>
              Top Performers
            </h3>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#F5F5F7', color: '#6B6B6F' }}>
            Total Histórico
          </span>
        </div>

        {agentStats.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
            {agentStats.slice(0, 5).map((agent, index) => (
              <div key={agent.email} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-stone-50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                     style={{ background: RANK_COLORS[index] || '#475569' }}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>{agent.name}</p>
                  <p className="text-xs" style={{ color: '#AEAEB2' }}>
                    {agent.trips} viajes · ${Math.round(agent.avgTicket).toLocaleString()} ticket promedio
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold" style={{ color: '#2D4629', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                    ${agent.sales.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: '#AEAEB2' }}>en ventas</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: '#AEAEB2' }}>No hay datos de agentes disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}
