import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Loader2, Search, DollarSign, Plus, 
  Users, Edit2, Trash2, CheckCircle, Clock, Calendar, ArrowUpDown
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { updateSoldTripTotalsFromServices } from '@/utils/soldTripRecalculations';

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  recibida: { label: 'Recibida', color: 'bg-blue-100 text-blue-700' },
  pagada_agente: { label: 'Pagada al Agente', color: 'bg-green-100 text-green-700' }
};

const IATA_LABELS = {
  montecito: 'IATA Montecito',
  nomad: 'IATA Nomad'
};

export default function InternalCommissions() {
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'paid'
  const [formOpen, setFormOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc' - asc = nearest to farthest

  const queryClient = useQueryClient();

  const { data: internalCommissions = [], isLoading: loadingInternal } = useQuery({
    queryKey: ['internalCommissions'],
    queryFn: () => base44.entities.InternalCommission.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: soldTrips = [], isLoading: loadingTrips } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => base44.entities.SoldTrip.list()
  });

  const { data: tripServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ['tripServices'],
    queryFn: () => base44.entities.TripService.list()
  });

  const isLoading = loadingInternal || loadingTrips || loadingServices;

  // Combine internal commissions with trip services that have commission
  const commissions = React.useMemo(() => {
    // Internal commissions keep their structure
    const internal = internalCommissions.map(c => ({
      ...c,
      source: 'internal'
    }));

    // Trip services with commission > 0
    const fromServices = tripServices
      .filter(s => s.commission && s.commission > 0)
      .map(s => {
        const trip = soldTrips.find(t => t.id === s.sold_trip_id);
        // Determine agent from trip's created_by
        const agentEmail = trip?.created_by || '';
        const agent = users.find(u => u.email === agentEmail);
        
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
          status: s.commission_paid ? 'recibida' : 'pendiente',
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
      default:
        return service.other_name || 'Servicio';
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InternalCommission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalCommissions'] });
      setFormOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InternalCommission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalCommissions'] });
      setFormOpen(false);
      setEditingCommission(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InternalCommission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalCommissions'] });
      setDeleteConfirm(null);
    }
  });

  const updateTripServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TripService.update(id, data),
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
    mutationFn: ({ id, data }) => base44.entities.SoldTrip.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
    }
  });

  const deleteTripServiceMutation = useMutation({
    mutationFn: async ({ serviceId, sold_trip_id }) => {
      await base44.entities.TripService.delete(serviceId);
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

  // Update commission amount - works for both internal and trip service commissions
  const handleUpdateCommissionAmount = async (commission, newAmount) => {
    if (commission.source === 'tripService') {
      // Update the TripService commission
      await updateTripServiceMutation.mutateAsync({ 
        id: commission.service_id, 
        data: { commission: newAmount } 
      });
      
      // Recalculate total commission for the sold trip
      const tripServices = await base44.entities.TripService.filter({ sold_trip_id: commission.sold_trip_id });
      const totalCommission = tripServices.reduce((sum, s) => {
        if (s.id === commission.service_id) return sum + newAmount;
        return sum + (s.commission || 0);
      }, 0);
      
      await updateSoldTripMutation.mutateAsync({ 
        id: commission.sold_trip_id, 
        data: { total_commission: totalCommission } 
      });
    } else {
      // Update internal commission
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

  // Generate invoice and mark as paid
  const handleGenerateInvoice = () => {
    if (selectedCommissions.length === 0) return;
    setInvoiceOpen(true);
  };

  // Mark selected as paid after invoice
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
        commission_paid: newStatus !== 'pendiente',
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
    // Calculate commissions based on IATA and received amount
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

  // Get unique agents from commissions and users
  const uniqueAgents = [...new Set([
    ...commissions.map(c => c.agent_name),
    ...users.map(u => u.full_name)
  ])].filter(Boolean);

  // Check if commission is paid to agent
  const isPaidToAgent = (commission) => {
    if (commission.source === 'tripService') {
      return commission.paid_to_agent || false;
    }
    return commission.status === 'pagada_agente';
  };

  // Filter commissions
  const filteredCommissions = commissions
    .filter(c => {
      const matchesSearch = 
        (c.agent_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.sold_trip_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.service_provider || '').toLowerCase().includes(search.toLowerCase());
      const matchesAgent = filterAgent === 'all' || c.agent_name === filterAgent;
      
      // Date filter
      const commissionDate = c.estimated_payment_date ? new Date(c.estimated_payment_date) : null;
      const matchesDateFrom = !dateFrom || (commissionDate && commissionDate >= new Date(dateFrom));
      const matchesDateTo = !dateTo || (commissionDate && commissionDate <= new Date(dateTo));
      
      return matchesSearch && matchesAgent && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      const dateA = a.estimated_payment_date ? new Date(a.estimated_payment_date) : new Date(0);
      const dateB = b.estimated_payment_date ? new Date(b.estimated_payment_date) : new Date(0);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  // Split into pending and paid
  const pendingCommissions = filteredCommissions.filter(c => !isPaidToAgent(c));
  const paidCommissions = filteredCommissions.filter(c => isPaidToAgent(c));

  // Group by agent for current tab
  const getCommissionsByAgent = (list) => {
    return list.reduce((acc, c) => {
      const agent = c.agent_name || 'Sin asignar';
      if (!acc[agent]) acc[agent] = [];
      acc[agent].push(c);
      return acc;
    }, {});
  };

  // Calculate totals for an agent
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
  const globalStats = {
    pendingCount: pendingCommissions.length,
    pendingAmount: pendingCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
    paidCount: paidCommissions.length,
    paidAmount: paidCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
    totalAgentCommission: filteredCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
    totalNomadCommission: filteredCommissions.reduce((sum, c) => sum + (c.nomad_commission || 0), 0)
  };

  // Render commissions table
  const renderCommissionsTable = (commissionsByAgent, tabType) => {
    if (Object.keys(commissionsByAgent).length === 0) {
      return (
        <EmptyState
          icon={DollarSign}
          title={tabType === 'pending' ? "Sin comisiones pendientes" : "Sin comisiones pagadas"}
          description={tabType === 'pending' ? "No hay comisiones por pagar a agentes" : "No hay comisiones pagadas aún"}
          actionLabel="Nueva Comisión"
          onAction={() => setFormOpen(true)}
        />
      );
    }

    return Object.entries(commissionsByAgent).map(([agent, agentCommissions]) => {
      const totals = calculateAgentTotals(agentCommissions);
      return (
        <div key={agent} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          {/* Agent Header */}
          <div className="p-4 bg-stone-50 border-b border-stone-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A' }}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800">{agent}</h3>
                  <p className="text-xs text-stone-500">{agentCommissions.length} comisiones</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="px-3 py-1 bg-green-50 rounded-lg">
                  <span className="text-green-600 font-medium">Agente: ${totals.totalAgentCommission.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1 bg-purple-50 rounded-lg">
                  <span className="text-purple-600 font-medium">Nomad: ${totals.totalNomadCommission.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Commissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50/50">
                <tr>
                  {tabType === 'pending' && (
                    <th className="text-center p-3 font-medium text-stone-600 w-10">
                      <Checkbox
                        checked={agentCommissions.every(c => selectedCommissions.find(s => s.id === c.id))}
                        onCheckedChange={(checked) => handleSelectAllForAgent(agentCommissions, checked)}
                      />
                    </th>
                  )}
                  <th className="text-left p-3 font-medium text-stone-600">Viaje</th>
                  <th className="text-left p-3 font-medium text-stone-600">Proveedor</th>
                  <th className="text-left p-3 font-medium text-stone-600">IATA</th>
                  <th className="text-left p-3 font-medium text-stone-600">Estatus</th>
                  <th className="text-right p-3 font-medium text-stone-600">Comisión</th>
                  <th className="text-right p-3 font-medium text-stone-600">Agente</th>
                  <th className="text-right p-3 font-medium text-stone-600">Nomad</th>
                  <th className="text-center p-3 font-medium text-stone-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {agentCommissions.map(commission => (
                  <tr key={commission.id} className="hover:bg-stone-50">
                    {tabType === 'pending' && (
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={!!selectedCommissions.find(c => c.id === commission.id)}
                          onCheckedChange={() => handleToggleSelection(commission)}
                        />
                      </td>
                    )}
                    <td className="p-3">
                      <span className="font-medium text-stone-800">{commission.sold_trip_name || '-'}</span>
                      {commission.estimated_payment_date && (
                        <p className="text-xs text-stone-400">
                          Pago est: {format(new Date(commission.estimated_payment_date), 'd MMM yy', { locale: es })}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-stone-600">{commission.service_provider || '-'}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {IATA_LABELS[commission.iata_used] || commission.iata_used}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Select 
                        value={commission.status} 
                        onValueChange={(value) => handleUpdateStatus(commission, value)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="recibida">Recibida</SelectItem>
                          <SelectItem value="pagada_agente">Pagada al Agente</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-right">
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
                        className="w-24 text-right font-semibold rounded-lg h-8 text-stone-800"
                      />
                    </td>
                    <td className="p-3 text-right font-medium" style={{ color: '#2E442A' }}>
                      ${(commission.agent_commission || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-medium text-purple-600">
                      ${(commission.nomad_commission || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        {commission.source === 'internal' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => setDeleteConfirm(commission)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
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
          <h1 className="text-2xl font-bold text-stone-800">Comisiones Internas</h1>
          <p className="text-stone-500 text-sm mt-1">Control de comisiones por agente</p>
        </div>
        <Button 
          onClick={() => { setEditingCommission(null); setFormOpen(true); }}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Comisión
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Por Pagar a Agentes</p>
          <p className="text-xl font-bold text-orange-600">${globalStats.pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-stone-400">{globalStats.pendingCount} comisiones</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Pagadas a Agentes</p>
          <p className="text-xl font-bold text-green-600">${globalStats.paidAmount.toLocaleString()}</p>
          <p className="text-xs text-stone-400">{globalStats.paidCount} comisiones</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Total Agentes</p>
          <p className="text-xl font-bold" style={{ color: '#2E442A' }}>${globalStats.totalAgentCommission.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Total Nomad</p>
          <p className="text-xl font-bold text-purple-600">${globalStats.totalNomadCommission.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Agente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueAgents.map(agent => (
              <SelectItem key={agent} value={agent}>{agent}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-stone-400" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 rounded-xl"
            placeholder="Desde"
          />
          <span className="text-stone-400">-</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 rounded-xl"
            placeholder="Hasta"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="rounded-xl"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          {sortOrder === 'asc' ? 'Más cercanas primero' : 'Más lejanas primero'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100 rounded-xl p-1">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white">
            <Clock className="w-4 h-4 mr-2" /> Por Pagar ({pendingCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="rounded-lg data-[state=active]:bg-white">
            <CheckCircle className="w-4 h-4 mr-2" /> Pagadas ({paidCommissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Commissions */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {selectedCommissions.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{selectedCommissions.length}</span> comisiones seleccionadas 
                (Total: <span className="font-semibold">${selectedCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0).toLocaleString()}</span>)
              </p>
              <Button 
                onClick={handleGenerateInvoice}
                className="text-white rounded-xl"
                style={{ backgroundColor: '#2E442A' }}
              >
                Generar Invoice
              </Button>
            </div>
          )}
          {renderCommissionsTable(getCommissionsByAgent(pendingCommissions), 'pending')}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comisión?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.source === 'tripService' 
                ? 'Se eliminará el servicio asociado a esta comisión y se recalcularán los totales del viaje.'
                : 'Se eliminará esta comisión de forma permanente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm?.source === 'tripService') {
                  deleteTripServiceMutation.mutate({ serviceId: deleteConfirm.service_id, sold_trip_id: deleteConfirm.sold_trip_id });
                } else {
                  deleteMutation.mutate(deleteConfirm.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
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