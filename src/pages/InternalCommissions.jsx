import React, { useState, useMemo, memo } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Loader2, Search, DollarSign, Plus,
  Users, Edit2, Trash2, CheckCircle, Clock, Calendar, ArrowUpDown, AlertCircle, TrendingUp, X, Filter
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
import InternalCommissionForm from '@/components/commissions/InternalCommissionForm';
import EmptyState from '@/components/ui/EmptyState';
import AgentCommissionInvoice from '@/components/commissions/AgentCommissionInvoice';
import { updateSoldTripTotalsFromServices } from '@/components/utils/soldTripRecalculations';

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  pagado_a_agencia_interno: { label: 'Pagado a agencia', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  pagada_agente: { label: 'Pagada al Agente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

const IATA_LABELS = {
  montecito: 'IATA Montecito',
  nomad: 'IATA Nomad'
};

// Loading Skeleton
const TableSkeleton = memo(() => (
  <div className="space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 animate-pulse">
        <div className="h-14 bg-stone-200 rounded-xl flex-1"></div>
        <div className="h-14 bg-stone-200 rounded-xl w-32"></div>
      </div>
    ))}
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

// Modern Stats Card Component
const StatsCard = memo(({ title, value, subtitle, icon: Icon, gradient, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: index * 0.05, duration: 0.3, type: "spring" }}
    whileHover={{ y: -5, scale: 1.02 }}
  >
    <Card className={`relative overflow-hidden group cursor-pointer bg-gradient-to-br ${gradient} p-3 md:p-4 shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[90px] md:min-h-[110px]`}>
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] md:text-xs font-bold text-white/90 uppercase tracking-wide line-clamp-1">{title}</p>
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="w-7 h-7 md:w-8 md:h-8 bg-white/20 rounded-lg flex items-center justify-center shadow-lg backdrop-blur-sm flex-shrink-0"
          >
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
          </motion.div>
        </div>
        <p className="text-base md:text-lg lg:text-xl font-black text-white mb-1 break-all leading-none">{value}</p>
        {subtitle && <p className="text-[10px] md:text-xs text-white/80 font-semibold line-clamp-1 mt-auto">{subtitle}</p>}
      </div>
    </Card>
  </motion.div>
));

StatsCard.displayName = 'StatsCard';

export default function InternalCommissions() {
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const queryClient = useQueryClient();

  const { data: internalCommissions = [], isLoading: loadingInternal } = useQuery({
    queryKey: ['internalCommissions'],
    queryFn: () => supabaseAPI.entities.InternalCommission.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseAPI.entities.User.list()
  });

  const { data: soldTrips = [], isLoading: loadingTrips } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => supabaseAPI.entities.SoldTrip.list()
  });

  const { data: tripServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ['tripServices'],
    queryFn: () => supabaseAPI.entities.TripService.list()
  });

  const isLoading = loadingInternal || loadingTrips || loadingServices;

  // Helper to get service provider name
  function getServiceProviderName(service) {
    switch (service.service_type) {
      case 'hotel':
        return service.hotel_name || service.hotel_chain || 'Hotel';
      case 'vuelo':
        return service.airline || 'Vuelo';
      case 'traslado':
        return `Traslado ${service.transfer_origin || ''} - ${service.transfer_destination || ''}`;
      case 'tour':
        return service.tour_name || 'Tour';
      case 'crucero':
        return service.cruise_ship || service.cruise_line || 'Crucero';
      case 'tren':
        return `${service.train_operator || 'Tren'} ${service.train_number || ''}`.trim();
      case 'dmc':
        return service.dmc_name || 'DMC';
      case 'otro':
        return service.other_name || service.other_description || 'Servicio';
      default:
        return 'Servicio';
    }
  }

  // Calculate agent commission cut
  function calculateAgentCut(amount, bookedBy) {
    return amount * 0.50;
  }

  // Calculate Nomad commission cut
  function calculateNomadCut(amount, bookedBy) {
    return bookedBy === 'montecito' ? amount * 0.35 : amount * 0.50;
  }

  // Combine internal commissions with trip services that have commission
  const commissions = useMemo(() => {
    const internal = internalCommissions.map(c => ({
      ...c,
      source: 'internal'
    }));

    const fromServices = tripServices
      .filter(s => s.commission && s.commission > 0)
      .map(s => {
        const trip = soldTrips.find(t => t.id === s.sold_trip_id);
        const agentEmail = trip?.created_by || '';
        const agent = users.find(u => u.email === agentEmail);

        let status = 'pendiente';
        if (s.paid_to_agent) {
          status = 'pagada_agente';
        } else if (s.commission_paid) {
          status = 'pagado_a_agencia_interno';
        }

        return {
          id: `service_${s.id}`,
          service_id: s.id,
          agent_email: agentEmail,
          agent_name: agent?.full_name || agentEmail || 'Sin asignar',
          sold_trip_id: s.sold_trip_id,
          sold_trip_name: trip ? `${trip.client_name} - ${trip.destination}` : 'Viaje',
          service_provider: getServiceProviderName(s),
          estimated_amount: s.commission || 0,
          estimated_payment_date: s.commission_payment_date || null,
          iata_used: s.booked_by === 'montecito' ? 'montecito' : 'nomad',
          status: status,
          paid_to_agent: s.paid_to_agent || false,
          received_date: s.commission_paid ? s.commission_payment_date : null,
          received_amount: s.commission_paid ? s.commission : null,
          agent_commission: calculateAgentCut(s.commission, s.booked_by),
          nomad_commission: calculateNomadCut(s.commission, s.booked_by),
          source: 'tripService'
        };
      });

    return [...internal, ...fromServices];
  }, [internalCommissions, tripServices, soldTrips, users]);

  const createMutation = useMutation({
    mutationFn: (data) => supabaseAPI.entities.InternalCommission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalCommissions'] });
      setFormOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.InternalCommission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalCommissions'] });
      setFormOpen(false);
      setEditingCommission(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseAPI.entities.InternalCommission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalCommissions'] });
      setDeleteConfirm(null);
    }
  });

  const updateTripServiceMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.TripService.update(id, data),
    onSuccess: async (_, variables) => {
      const service = tripServices.find(s => s.id === variables.id);
      if (service?.sold_trip_id) {
        await updateSoldTripTotalsFromServices(service.sold_trip_id, queryClient);
      }
      queryClient.invalidateQueries({ queryKey: ['tripServices'] });
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
    }
  });

  const updateSoldTripMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.SoldTrip.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
    }
  });

  const deleteTripServiceMutation = useMutation({
    mutationFn: async ({ serviceId, sold_trip_id }) => {
      await supabaseAPI.entities.TripService.delete(serviceId);
      return sold_trip_id;
    },
    onSuccess: async (sold_trip_id) => {
      if (sold_trip_id) {
        await updateSoldTripTotalsFromServices(sold_trip_id, queryClient);
      }
      queryClient.invalidateQueries({ queryKey: ['tripServices'] });
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
      setDeleteConfirm(null);
    }
  });

  // Update commission amount
  const handleUpdateCommissionAmount = async (commission, newAmount) => {
    if (commission.source === 'tripService') {
      await updateTripServiceMutation.mutateAsync({
        id: commission.service_id,
        data: { commission: newAmount }
      });

      const tripServices = await supabaseAPI.entities.TripService.filter({ sold_trip_id: commission.sold_trip_id });
      const totalCommission = tripServices.reduce((sum, s) => {
        if (s.id === commission.service_id) return sum + newAmount;
        return sum + (s.commission || 0);
      }, 0);

      await updateSoldTripMutation.mutateAsync({
        id: commission.sold_trip_id,
        data: { total_commission: totalCommission }
      });
    } else {
      updateMutation.mutate({
        id: commission.id,
        data: { estimated_amount: newAmount }
      });
    }
  };

  // Toggle paid to agent status
  const handleTogglePaidToAgent = async (commission, isPaid) => {
    if (commission.source === 'tripService') {
      await updateTripServiceMutation.mutateAsync({
        id: commission.service_id,
        data: { paid_to_agent: isPaid }
      });
    } else {
      updateMutation.mutate({
        id: commission.id,
        data: { status: isPaid ? 'pagada_agente' : 'recibida' }
      });
    }
  };

  // Toggle selection for invoice
  const handleToggleSelection = (commission) => {
    setSelectedCommissions(prev => {
      const exists = prev.find(c => c.id === commission.id);
      if (exists) {
        return prev.filter(c => c.id !== commission.id);
      }
      return [...prev, commission];
    });
  };

  // Select all for an agent
  const handleSelectAllForAgent = (agentCommissions, isSelected) => {
    if (isSelected) {
      setSelectedCommissions(prev => {
        const existingIds = prev.map(c => c.id);
        const newCommissions = agentCommissions.filter(c => !existingIds.includes(c.id));
        return [...prev, ...newCommissions];
      });
    } else {
      const agentIds = agentCommissions.map(c => c.id);
      setSelectedCommissions(prev => prev.filter(c => !agentIds.includes(c.id)));
    }
  };

  // Generate invoice
  const handleGenerateInvoice = () => {
    if (selectedCommissions.length === 0) return;
    setInvoiceOpen(true);
  };

  // Mark selected as paid
  const handleMarkSelectedAsPaid = async () => {
    for (const commission of selectedCommissions) {
      await handleTogglePaidToAgent(commission, true);
    }
    setSelectedCommissions([]);
    setInvoiceOpen(false);
  };

  // Update commission status
  const handleUpdateStatus = async (commission, newStatus) => {
    if (commission.source === 'tripService') {
      const updateData = {
        commission_paid: newStatus === 'pagado_a_agencia_interno' || newStatus === 'pagada_agente',
        paid_to_agent: newStatus === 'pagada_agente'
      };
      await updateTripServiceMutation.mutateAsync({
        id: commission.service_id,
        data: updateData
      });
    } else {
      updateMutation.mutate({
        id: commission.id,
        data: { status: newStatus }
      });
    }
  };

  const handleSave = (data) => {
    let agentCommission = 0;
    let nomadCommission = 0;

    if (data.received_amount && data.received_amount > 0) {
      if (data.iata_used === 'montecito') {
        agentCommission = data.received_amount * 0.50;
        nomadCommission = data.received_amount * 0.35;
      } else if (data.iata_used === 'nomad') {
        agentCommission = data.received_amount * 0.50;
        nomadCommission = data.received_amount * 0.50;
      }
    }

    const finalData = {
      ...data,
      agent_commission: agentCommission,
      nomad_commission: nomadCommission
    };

    if (editingCommission) {
      updateMutation.mutate({ id: editingCommission.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  // Get unique agents
  const uniqueAgents = useMemo(() =>
    [...new Set([
      ...commissions.map(c => c.agent_name),
      ...users.map(u => u.full_name)
    ])].filter(Boolean),
    [commissions, users]
  );

  // Filter commissions
  const filteredCommissions = useMemo(() =>
    commissions
      .filter(c => {
        const matchesSearch =
          (c.agent_name || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.sold_trip_name || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.service_provider || '').toLowerCase().includes(search.toLowerCase());
        const matchesAgent = filterAgent === 'all' || c.agent_name === filterAgent;

        const commissionDate = c.estimated_payment_date ? new Date(c.estimated_payment_date) : null;
        const matchesDateFrom = !dateFrom || (commissionDate && commissionDate >= new Date(dateFrom));
        const matchesDateTo = !dateTo || (commissionDate && commissionDate <= new Date(dateTo));

        return matchesSearch && matchesAgent && matchesDateFrom && matchesDateTo;
      })
      .sort((a, b) => {
        const dateA = a.estimated_payment_date ? new Date(a.estimated_payment_date) : new Date(0);
        const dateB = b.estimated_payment_date ? new Date(b.estimated_payment_date) : new Date(0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }),
    [commissions, search, filterAgent, dateFrom, dateTo, sortOrder]
  );

  // Split by status
  const pendingCommissions = useMemo(() => filteredCommissions.filter(c => c.status === 'pendiente'), [filteredCommissions]);
  const validatedCommissions = useMemo(() => filteredCommissions.filter(c => c.status === 'pagado_a_agencia_interno'), [filteredCommissions]);
  const paidCommissions = useMemo(() => filteredCommissions.filter(c => c.status === 'pagada_agente'), [filteredCommissions]);

  // Group by agent
  const getCommissionsByAgent = (list) => {
    return list.reduce((acc, c) => {
      const agent = c.agent_name || 'Sin asignar';
      if (!acc[agent]) acc[agent] = [];
      acc[agent].push(c);
      return acc;
    }, {});
  };

  // Calculate agent totals
  const calculateAgentTotals = (agentCommissions) => {
    const pending = agentCommissions.filter(c => c.status === 'pendiente');
    const received = agentCommissions.filter(c => c.status === 'recibida' || c.status === 'pagada_agente');

    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, c) => sum + (c.estimated_amount || 0), 0),
      receivedCount: received.length,
      receivedAmount: received.reduce((sum, c) => sum + (c.received_amount || 0), 0),
      totalAgentCommission: received.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
      totalNomadCommission: received.reduce((sum, c) => sum + (c.nomad_commission || 0), 0)
    };
  };

  // Global stats
  const globalStats = useMemo(() => ({
    pendingCount: pendingCommissions.length,
    pendingAmount: pendingCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
    validatedCount: validatedCommissions.length,
    validatedAmount: validatedCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
    paidCount: paidCommissions.length,
    paidAmount: paidCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
    totalAgentCommission: filteredCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
    totalNomadCommission: filteredCommissions.reduce((sum, c) => sum + (c.nomad_commission || 0), 0)
  }), [pendingCommissions, validatedCommissions, paidCommissions, filteredCommissions]);

  const hasActiveFilters = search || filterAgent !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch('');
    setFilterAgent('all');
    setDateFrom('');
    setDateTo('');
  };

  // Commissions pending validation
  const commissionsToValidate = useMemo(() =>
    tripServices.filter(s =>
      s.paid_to_agency === true &&
      s.commission > 0 &&
      !s.commission_paid
    ),
    [tripServices]
  );

  const handleConfirmPayment = async (service) => {
    await updateTripServiceMutation.mutateAsync({
      id: service.id,
      data: { commission_paid: true }
    });
  };

  // Render commissions table
  const renderCommissionsTable = (commissionsByAgent, tabType) => {
    if (Object.keys(commissionsByAgent).length === 0) {
      const emptyMessages = {
        pending: { title: "Sin comisiones pendientes", description: "No hay comisiones pendientes" },
        validated: { title: "Sin comisiones validadas", description: "No hay comisiones marcadas como pagado a agencia" },
        paid: { title: "Sin comisiones pagadas", description: "No hay comisiones pagadas a agentes aún" }
      };
      const msg = emptyMessages[tabType] || emptyMessages.pending;

      return (
        <EmptyState
          icon={DollarSign}
          title={msg.title}
          description={msg.description}
          actionLabel="Nueva Comisión"
          onAction={() => setFormOpen(true)}
        />
      );
    }

    return Object.entries(commissionsByAgent).map(([agent, agentCommissions]) => {
      const totals = calculateAgentTotals(agentCommissions);
      return (
        <div key={agent} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-stone-200 overflow-hidden">
          {/* Agent Header */}
          <div className="p-4 md:p-5 bg-gradient-to-r from-stone-50 to-stone-100 border-b-2 border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base md:text-lg">{agent}</h3>
                  <p className="text-xs md:text-sm text-stone-500">{agentCommissions.length} comisión{agentCommissions.length !== 1 ? 'es' : ''}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3 text-sm">
                <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 shadow-sm">
                  <span className="text-emerald-700 font-bold">Agente: ${totals.totalAgentCommission.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200 shadow-sm">
                  <span className="text-purple-700 font-bold">Nomad: ${totals.totalNomadCommission.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Commissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-stone-50 to-white border-b border-stone-200">
                <tr>
                  {(tabType === 'pending' || tabType === 'validated') && (
                    <th className="text-center p-3 md:p-4 font-bold text-stone-700 text-xs uppercase w-10">
                      <Checkbox
                        checked={agentCommissions.every(c => selectedCommissions.find(s => s.id === c.id))}
                        onCheckedChange={(checked) => handleSelectAllForAgent(agentCommissions, checked)}
                      />
                    </th>
                  )}
                  <th className="text-left p-3 md:p-4 font-bold text-stone-700 text-xs uppercase tracking-wide">Viaje</th>
                  <th className="text-left p-3 md:p-4 font-bold text-stone-700 text-xs uppercase tracking-wide">Proveedor</th>
                  <th className="text-left p-3 md:p-4 font-bold text-stone-700 text-xs uppercase tracking-wide">IATA</th>
                  <th className="text-left p-3 md:p-4 font-bold text-stone-700 text-xs uppercase tracking-wide">Estatus</th>
                  <th className="text-right p-3 md:p-4 font-bold text-stone-700 text-xs uppercase tracking-wide">Comisión</th>
                  <th className="text-right p-3 md:p-4 font-bold text-stone-700 text-xs uppercase tracking-wide">Agente</th>
                  <th className="text-right p-3 md:p-4 font-bold text-stone-700 text-xs uppercase tracking-wide">Nomad</th>
                  <th className="text-center p-3 md:p-4 font-bold text-stone-700 text-xs uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {agentCommissions.map((commission, idx) => (
                  <motion.tr
                    key={commission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                    className="hover:bg-gradient-to-r hover:from-stone-50 hover:to-transparent transition-all group"
                  >
                    {(tabType === 'pending' || tabType === 'validated') && (
                      <td className="p-3 md:p-4 text-center">
                        <Checkbox
                          checked={!!selectedCommissions.find(c => c.id === commission.id)}
                          onCheckedChange={() => handleToggleSelection(commission)}
                        />
                      </td>
                    )}
                    <td className="p-3 md:p-4">
                      <span className="font-semibold text-stone-900">{commission.sold_trip_name || '-'}</span>
                      {commission.estimated_payment_date && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          Pago est: {format(parseLocalDate(commission.estimated_payment_date), 'd MMM yy', { locale: es })}
                        </p>
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-stone-700">{commission.service_provider || '-'}</td>
                    <td className="p-3 md:p-4">
                      <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                        {IATA_LABELS[commission.iata_used] || commission.iata_used}
                      </Badge>
                    </td>
                    <td className="p-3 md:p-4">
                      <Select
                        value={commission.status}
                        onValueChange={(value) => handleUpdateStatus(commission, value)}
                      >
                        <SelectTrigger className="w-36 h-9 text-xs rounded-lg border-2 shadow-sm font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="pagado_a_agencia_interno">Pagado a agencia</SelectItem>
                          <SelectItem value="pagada_agente">Pagada al Agente</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 md:p-4 text-right">
                      <Input
                        type="number"
                        defaultValue={commission.estimated_amount || 0}
                        onBlur={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          if (newValue !== commission.estimated_amount) {
                            handleUpdateCommissionAmount(commission, newValue);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                        className="w-28 text-right font-bold rounded-lg h-9 text-stone-900 shadow-sm"
                      />
                    </td>
                    <td className="p-3 md:p-4 text-right font-bold text-emerald-600 text-base">
                      ${(commission.agent_commission || 0).toLocaleString()}
                    </td>
                    <td className="p-3 md:p-4 text-right font-bold text-purple-600 text-base">
                      ${(commission.nomad_commission || 0).toLocaleString()}
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex gap-2 justify-center">
                        {commission.source === 'internal' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => {
                              setEditingCommission(commission);
                              setFormOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700"
                          onClick={() => setDeleteConfirm(commission)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-stone-200 rounded-lg w-64 animate-pulse"></div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-stone-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="bg-white rounded-xl overflow-hidden">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Comisiones Internas</h1>
          <p className="text-sm md:text-base text-stone-500 mt-1">
            Control de comisiones por agente • {filteredCommissions.length} comisión{filteredCommissions.length !== 1 ? 'es' : ''}
            {hasActiveFilters && ' (filtradas)'}
          </p>
        </div>
        <Button
          onClick={() => { setEditingCommission(null); setFormOpen(true); }}
          className="text-white rounded-xl shadow-md hover:shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Comisión
        </Button>
      </motion.div>

      {/* Commissions Pending Validation Alert */}
      {commissionsToValidate.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 md:p-5 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-amber-900 text-base md:text-lg">
                  ⚠️ Comisiones Pendientes de Validar Pago a Agencia
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('validated')}
                  className="ml-4 border-amber-400 text-amber-700 hover:bg-amber-100 rounded-xl shadow-sm"
                >
                  Ver Pagado a agencia
                </Button>
              </div>
              <p className="text-sm text-amber-800 mb-3">
                {commissionsToValidate.length} {commissionsToValidate.length === 1 ? 'comisión marcada' : 'comisiones marcadas'} como "Pagado a agencia" por el agente. Revisar y confirmar recepción del pago:
              </p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {commissionsToValidate.map(service => {
                  const trip = soldTrips.find(t => t.id === service.sold_trip_id);
                  const agent = users.find(u => u.email === trip?.created_by);
                  const serviceName = (() => {
                    switch (service.service_type) {
                      case 'hotel': return service.hotel_name || 'Hotel';
                      case 'vuelo': return service.airline || 'Vuelo';
                      case 'dmc': return service.dmc_name || 'DMC';
                      case 'crucero': return service.cruise_ship || 'Crucero';
                      case 'tour': return service.tour_name || 'Tour';
                      case 'tren': return service.train_operator || 'Tren';
                      default: return service.other_name || 'Servicio';
                    }
                  })();

                  return (
                    <div key={service.id} className="bg-white rounded-xl p-3 md:p-4 border-2 border-amber-300 hover:border-amber-400 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-stone-900">{trip?.client_name || 'Sin cliente'}</p>
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300 font-semibold">
                              {agent?.full_name || 'Sin agente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-stone-700 mb-1">{serviceName} • {trip?.destination}</p>
                          {service.paid_to_agency_date && (
                            <p className="text-xs text-amber-700 font-medium">
                              Marcado: {format(parseLocalDate(service.paid_to_agency_date), 'd MMM yyyy', { locale: es })}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex items-center gap-3 flex-shrink-0">
                          <div>
                            <p className="text-lg md:text-xl font-black text-amber-700">
                              ${(service.commission || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-stone-500 font-medium">comisión</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmPayment(service)}
                            disabled={updateTripServiceMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                          >
                            {updateTripServiceMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Confirmar Pago'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatsCard
          title="Pendientes"
          value={`$${globalStats.pendingAmount.toLocaleString()}`}
          subtitle={`${globalStats.pendingCount} comisión${globalStats.pendingCount !== 1 ? 'es' : ''}`}
          icon={Clock}
          gradient="from-amber-500 via-orange-500 to-red-500"
          index={0}
        />
        <StatsCard
          title="Pagado a agencia"
          value={`$${globalStats.validatedAmount.toLocaleString()}`}
          subtitle={`${globalStats.validatedCount} comisión${globalStats.validatedCount !== 1 ? 'es' : ''}`}
          icon={DollarSign}
          gradient="from-blue-500 via-blue-600 to-indigo-600"
          index={1}
        />
        <StatsCard
          title="Pagadas a Agentes"
          value={`$${globalStats.paidAmount.toLocaleString()}`}
          subtitle={`${globalStats.paidCount} comisión${globalStats.paidCount !== 1 ? 'es' : ''}`}
          icon={CheckCircle}
          gradient="from-emerald-500 via-green-600 to-teal-600"
          index={2}
        />
        <StatsCard
          title="Total Agentes"
          value={`$${globalStats.totalAgentCommission.toLocaleString()}`}
          subtitle="Suma total"
          icon={Users}
          gradient="from-slate-700 via-slate-800 to-slate-900"
          index={3}
        />
        <StatsCard
          title="Total Nomad"
          value={`$${globalStats.totalNomadCommission.toLocaleString()}`}
          subtitle="Suma total"
          icon={TrendingUp}
          gradient="from-purple-500 via-purple-600 to-indigo-600"
          index={4}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-5 bg-gradient-to-br from-stone-50 to-white border border-stone-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-stone-500" />
          <h3 className="font-bold text-stone-900">Filtros</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-xs h-7 rounded-lg"
            >
              <X className="w-3 h-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Buscar por agente, viaje o proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="w-full md:w-48 rounded-xl">
              <SelectValue placeholder="Todos los agentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los agentes</SelectItem>
              {uniqueAgents.map(agent => (
                <SelectItem key={agent} value={agent}>{agent}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full md:w-40 rounded-xl"
              placeholder="Desde"
            />
            <span className="text-stone-400">-</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full md:w-40 rounded-xl"
              placeholder="Hasta"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="rounded-xl w-full md:w-auto"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortOrder === 'asc' ? 'Más cercanas' : 'Más lejanas'}
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl p-1 grid grid-cols-3 w-full">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Clock className="w-4 h-4 mr-2" /> Pendientes ({pendingCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="validated" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
            <DollarSign className="w-4 h-4 mr-2" /> Pagado a agencia ({validatedCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
            <CheckCircle className="w-4 h-4 mr-2" /> Pagadas ({paidCommissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Commissions */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {selectedCommissions.length > 0 && (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-900 font-semibold">
                  <span className="font-black">{selectedCommissions.length}</span> comisión{selectedCommissions.length !== 1 ? 'es' : ''} seleccionada{selectedCommissions.length !== 1 ? 's' : ''}
                  • Total: <span className="font-black">${selectedCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0).toLocaleString()}</span>
                </p>
                <Button
                  onClick={handleGenerateInvoice}
                  className="text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
                >
                  Generar Invoice
                </Button>
              </div>
            </Card>
          )}
          {renderCommissionsTable(getCommissionsByAgent(pendingCommissions), 'pending')}
        </TabsContent>

        {/* Validated Commissions */}
        <TabsContent value="validated" className="mt-4 space-y-4">
          {selectedCommissions.length > 0 && (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-900 font-semibold">
                  <span className="font-black">{selectedCommissions.length}</span> comisión{selectedCommissions.length !== 1 ? 'es' : ''} seleccionada{selectedCommissions.length !== 1 ? 's' : ''}
                  • Total: <span className="font-black">${selectedCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0).toLocaleString()}</span>
                </p>
                <Button
                  onClick={handleGenerateInvoice}
                  className="text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
                >
                  Generar Invoice
                </Button>
              </div>
            </Card>
          )}
          {renderCommissionsTable(getCommissionsByAgent(validatedCommissions), 'validated')}
        </TabsContent>

        {/* Paid Commissions */}
        <TabsContent value="paid" className="mt-4 space-y-4">
          {renderCommissionsTable(getCommissionsByAgent(paidCommissions), 'paid')}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <InternalCommissionForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCommission(null); }}
        commission={editingCommission}
        users={users}
        soldTrips={soldTrips}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comisión?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.source === 'tripService'
                ? 'Se eliminará el servicio asociado a esta comisión y se recalcularán los totales del viaje.'
                : 'Se eliminará esta comisión de forma permanente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm?.source === 'tripService') {
                  deleteTripServiceMutation.mutate({ serviceId: deleteConfirm.service_id, sold_trip_id: deleteConfirm.sold_trip_id });
                } else {
                  deleteMutation.mutate(deleteConfirm.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Eliminar Comisión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Modal */}
      <AgentCommissionInvoice
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        commissions={selectedCommissions}
        onMarkAsPaid={handleMarkSelectedAsPaid}
      />
    </div>
  );
}
