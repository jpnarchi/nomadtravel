import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Loader2, Search, Filter, DollarSign, Plus, 
  Users, Calendar, Edit2, Trash2, ChevronDown
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import InternalCommissionForm from '@/components/commissions/InternalCommissionForm';
import EmptyState from '@/components/ui/EmptyState';

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
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [activeTab, setActiveTab] = useState('agent');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
          received_date: s.commission_paid ? s.commission_payment_date : null,
          received_amount: s.commission_paid ? s.commission : null,
          agent_commission: s.commission_paid ? calculateAgentCut(s.commission, s.booked_by) : 0,
          nomad_commission: s.commission_paid ? calculateNomadCut(s.commission, s.booked_by) : 0,
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

  // Get unique agents from commissions
  const uniqueAgents = [...new Set(commissions.map(c => c.agent_name))].filter(Boolean);

  // Filter commissions
  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = 
      (c.agent_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.sold_trip_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.service_provider || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesAgent = filterAgent === 'all' || c.agent_name === filterAgent;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  // Group by agent
  const commissionsByAgent = filteredCommissions.reduce((acc, c) => {
    const agent = c.agent_name || 'Sin asignar';
    if (!acc[agent]) acc[agent] = [];
    acc[agent].push(c);
    return acc;
  }, {});

  // Group by month (estimated payment date)
  const commissionsByMonth = filteredCommissions.reduce((acc, c) => {
    if (!c.estimated_payment_date) {
      if (!acc['Sin fecha']) acc['Sin fecha'] = [];
      acc['Sin fecha'].push(c);
      return acc;
    }
    const month = format(new Date(c.estimated_payment_date), 'MMMM yyyy', { locale: es });
    if (!acc[month]) acc[month] = [];
    acc[month].push(c);
    return acc;
  }, {});

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
    totalPending: filteredCommissions.filter(c => c.status === 'pendiente').reduce((sum, c) => sum + (c.estimated_amount || 0), 0),
    totalReceived: filteredCommissions.filter(c => c.status !== 'pendiente').reduce((sum, c) => sum + (c.received_amount || 0), 0),
    totalAgentCommission: filteredCommissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0),
    totalNomadCommission: filteredCommissions.reduce((sum, c) => sum + (c.nomad_commission || 0), 0)
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
          <p className="text-xs text-stone-400">Pendientes</p>
          <p className="text-xl font-bold text-yellow-600">${globalStats.totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Recibidas</p>
          <p className="text-xl font-bold text-blue-600">${globalStats.totalReceived.toLocaleString()}</p>
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Buscar por agente, viaje o proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="recibida">Recibida</SelectItem>
            <SelectItem value="pagada_agente">Pagada al Agente</SelectItem>
          </SelectContent>
        </Select>
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100 rounded-xl p-1">
          <TabsTrigger value="agent" className="rounded-lg data-[state=active]:bg-white">
            <Users className="w-4 h-4 mr-2" /> Por Agente
          </TabsTrigger>
          <TabsTrigger value="date" className="rounded-lg data-[state=active]:bg-white">
            <Calendar className="w-4 h-4 mr-2" /> Por Fecha
          </TabsTrigger>
        </TabsList>

        {/* View by Agent */}
        <TabsContent value="agent" className="mt-4 space-y-4">
          {Object.keys(commissionsByAgent).length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="Sin comisiones"
              description="Agrega la primera comisión interna"
              actionLabel="Nueva Comisión"
              onAction={() => setFormOpen(true)}
            />
          ) : (
            Object.entries(commissionsByAgent).map(([agent, agentCommissions]) => {
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
                          <p className="text-xs text-stone-500">
                            {totals.pendingCount} pendientes • {totals.receivedCount} recibidas
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="px-3 py-1 bg-yellow-50 rounded-lg">
                          <span className="text-yellow-600 font-medium">Pendiente: ${totals.pendingAmount.toLocaleString()}</span>
                        </div>
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
                          <th className="text-left p-3 font-medium text-stone-600">Viaje</th>
                          <th className="text-left p-3 font-medium text-stone-600">Proveedor</th>
                          <th className="text-left p-3 font-medium text-stone-600">IATA</th>
                          <th className="text-left p-3 font-medium text-stone-600">Estatus</th>
                          <th className="text-right p-3 font-medium text-stone-600">Estimada</th>
                          <th className="text-right p-3 font-medium text-stone-600">Recibida</th>
                          <th className="text-right p-3 font-medium text-stone-600">Agente</th>
                          <th className="text-right p-3 font-medium text-stone-600">Nomad</th>
                          <th className="text-right p-3 font-medium text-stone-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {agentCommissions.map(commission => (
                          <tr key={commission.id} className="hover:bg-stone-50">
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
                              <Badge className={`text-xs ${STATUS_CONFIG[commission.status]?.color || 'bg-stone-100'}`}>
                                {STATUS_CONFIG[commission.status]?.label || commission.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right text-stone-600">${(commission.estimated_amount || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-medium text-blue-600">
                              {commission.received_amount ? `$${commission.received_amount.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-3 text-right font-medium" style={{ color: '#2E442A' }}>
                              {commission.agent_commission ? `$${commission.agent_commission.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-3 text-right font-medium text-purple-600">
                              {commission.nomad_commission ? `$${commission.nomad_commission.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => { setEditingCommission(commission); setFormOpen(true); }}
                                >
                                  <Edit2 className="w-4 h-4 text-stone-400" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => setDeleteConfirm(commission)}
                                >
                                  <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
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
            })
          )}
        </TabsContent>

        {/* View by Date */}
        <TabsContent value="date" className="mt-4 space-y-4">
          {Object.keys(commissionsByMonth).length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Sin comisiones"
              description="Agrega la primera comisión interna"
              actionLabel="Nueva Comisión"
              onAction={() => setFormOpen(true)}
            />
          ) : (
            Object.entries(commissionsByMonth)
              .sort((a, b) => {
                if (a[0] === 'Sin fecha') return 1;
                if (b[0] === 'Sin fecha') return -1;
                return new Date(a[1][0]?.estimated_payment_date || 0) - new Date(b[1][0]?.estimated_payment_date || 0);
              })
              .map(([month, monthCommissions]) => {
                const monthTotal = monthCommissions.reduce((sum, c) => sum + (c.estimated_amount || 0), 0);
                const monthReceived = monthCommissions.reduce((sum, c) => sum + (c.received_amount || 0), 0);
                
                return (
                  <div key={month} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-stone-800 capitalize">{month}</h3>
                          <p className="text-xs text-stone-500">{monthCommissions.length} comisiones</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-sm font-medium text-stone-600">Est: ${monthTotal.toLocaleString()}</span>
                        <span className="text-sm font-medium text-blue-600">Rec: ${monthReceived.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-stone-50/50">
                          <tr>
                            <th className="text-left p-3 font-medium text-stone-600">Agente</th>
                            <th className="text-left p-3 font-medium text-stone-600">Viaje</th>
                            <th className="text-left p-3 font-medium text-stone-600">Proveedor</th>
                            <th className="text-left p-3 font-medium text-stone-600">IATA</th>
                            <th className="text-left p-3 font-medium text-stone-600">Estatus</th>
                            <th className="text-right p-3 font-medium text-stone-600">Estimada</th>
                            <th className="text-right p-3 font-medium text-stone-600">Recibida</th>
                            <th className="text-right p-3 font-medium text-stone-600">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {monthCommissions.map(commission => (
                            <tr key={commission.id} className="hover:bg-stone-50">
                              <td className="p-3 font-medium text-stone-800">{commission.agent_name || '-'}</td>
                              <td className="p-3 text-stone-600">{commission.sold_trip_name || '-'}</td>
                              <td className="p-3 text-stone-600">{commission.service_provider || '-'}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">
                                  {IATA_LABELS[commission.iata_used] || commission.iata_used}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge className={`text-xs ${STATUS_CONFIG[commission.status]?.color || 'bg-stone-100'}`}>
                                  {STATUS_CONFIG[commission.status]?.label || commission.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right text-stone-600">${(commission.estimated_amount || 0).toLocaleString()}</td>
                              <td className="p-3 text-right font-medium text-blue-600">
                                {commission.received_amount ? `$${commission.received_amount.toLocaleString()}` : '-'}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => { setEditingCommission(commission); setFormOpen(true); }}
                                  >
                                    <Edit2 className="w-4 h-4 text-stone-400" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => setDeleteConfirm(commission)}
                                  >
                                    <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
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
              })
          )}
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
              Se eliminará esta comisión de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
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