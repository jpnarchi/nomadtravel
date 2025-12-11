import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from "sonner";
import { Plane, Search, Eye, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STAGE_CONFIG = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
  cotizando: { label: 'Cotizando', color: 'bg-yellow-100 text-yellow-700' },
  propuesta_enviada: { label: 'Propuesta Enviada', color: 'bg-purple-100 text-purple-700' },
  aceptado: { label: 'Aceptado', color: 'bg-green-100 text-green-700' },
  vendido: { label: 'Vendido', color: 'bg-emerald-100 text-emerald-700' },
  perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700' }
};

export default function AdminTrips() {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: allTrips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list()
  });

  const agents = allUsers.filter(u => u.role === 'user');

  const updateTripAgent = useMutation({
    mutationFn: ({ tripId, newAgentEmail }) => 
      base44.entities.Trip.update(tripId, { created_by: newAgentEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Viaje reasignado');
    }
  });
  
  const filteredTrips = allTrips
    .filter(t => selectedAgent === 'all' || t.created_by === selectedAgent)
    .filter(t => selectedStage === 'all' || t.stage === selectedStage)
    .filter(t => {
      const searchLower = search.toLowerCase();
      return (
        t.client_name?.toLowerCase().includes(searchLower) ||
        t.destination?.toLowerCase().includes(searchLower)
      );
    });

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
          <h1 className="text-2xl font-bold text-stone-800">Todos los Viajes</h1>
          <p className="text-stone-500 text-sm mt-1">
            {filteredTrips.length} viaje{filteredTrips.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todas las etapas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Buscar por cliente o destino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Cliente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Destino</th>
                <th className="text-left p-3 font-semibold text-stone-600">Fecha</th>
                <th className="text-left p-3 font-semibold text-stone-600">Presupuesto</th>
                <th className="text-left p-3 font-semibold text-stone-600">Etapa</th>
                <th className="text-left p-3 font-semibold text-stone-600">Agente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTrips.map((trip) => {
                const agent = allUsers.find(u => u.email === trip.created_by);
                const stageConfig = STAGE_CONFIG[trip.stage];
                return (
                  <tr key={trip.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3">
                      <span className="font-medium text-stone-800">{trip.client_name}</span>
                    </td>
                    <td className="p-3 text-stone-600">{trip.destination}</td>
                    <td className="p-3 text-stone-600">
                      {trip.start_date ? format(new Date(trip.start_date), 'd MMM yy', { locale: es }) : '-'}
                    </td>
                    <td className="p-3 text-stone-600">
                      {trip.budget ? `$${trip.budget.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3">
                      <Badge className={stageConfig?.color}>{stageConfig?.label}</Badge>
                    </td>
                    <td className="p-3">
                      <Select
                        value={trip.created_by || ''}
                        onValueChange={(value) => updateTripAgent.mutate({ 
                          tripId: trip.id, 
                          newAgentEmail: value || null 
                        })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Sin asignar</SelectItem>
                          {agents.map(agentOption => (
                            <SelectItem key={agentOption.email} value={agentOption.email}>
                              {agentOption.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(createPageUrl(`TripDetail?id=${trip.id}`))}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTrips.length === 0 && (
          <EmptyState
            icon={Plane}
            title="No hay viajes"
            description="No se encontraron viajes con los filtros seleccionados"
          />
        )}
      </div>
    </div>
  );
}