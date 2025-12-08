import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Search, Eye, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  parcial: { label: 'Parcial', color: 'bg-orange-100 text-orange-700' },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  completado: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700' }
};

export default function AdminSoldTrips() {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: allSoldTrips = [], isLoading } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => base44.entities.SoldTrip.list(),
    refetchOnWindowFocus: true,
    refetchInterval: 5000
  });

  const agents = allUsers.filter(u => u.role === 'user');
  
  const filteredSoldTrips = allSoldTrips
    .filter(t => selectedAgent === 'all' || t.created_by === selectedAgent)
    .filter(t => selectedStatus === 'all' || t.status === selectedStatus)
    .filter(t => {
      const searchLower = search.toLowerCase();
      return (
        t.client_name?.toLowerCase().includes(searchLower) ||
        t.destination?.toLowerCase().includes(searchLower)
      );
    });

  const totalSales = filteredSoldTrips.reduce((sum, t) => sum + (t.total_price || 0), 0);
  const totalCommissions = filteredSoldTrips.reduce((sum, t) => sum + (t.total_commission || 0), 0);

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
          <h1 className="text-2xl font-bold text-stone-800">Todos los Viajes Vendidos</h1>
          <p className="text-stone-500 text-sm mt-1">
            {filteredSoldTrips.length} viaje{filteredSoldTrips.length !== 1 ? 's' : ''} vendido{filteredSoldTrips.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Total Ventas</p>
          <p className="text-2xl font-bold" style={{ color: '#2E442A' }}>${totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Total Comisiones</p>
          <p className="text-2xl font-bold text-green-600">${totalCommissions.toLocaleString()}</p>
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
                <th className="text-right p-3 font-semibold text-stone-600">Total</th>
                <th className="text-right p-3 font-semibold text-stone-600">Comisión</th>
                <th className="text-left p-3 font-semibold text-stone-600">Estado</th>
                <th className="text-left p-3 font-semibold text-stone-600">Agente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSoldTrips.map((trip) => {
                const agent = allUsers.find(u => u.email === trip.created_by);
                const statusConfig = STATUS_CONFIG[trip.status];
                return (
                  <tr key={trip.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3">
                      <span className="font-medium text-stone-800">{trip.client_name}</span>
                    </td>
                    <td className="p-3 text-stone-600">{trip.destination}</td>
                    <td className="p-3 text-stone-600">
                      {trip.start_date ? format(new Date(trip.start_date), 'd MMM yy', { locale: es }) : '-'}
                    </td>
                    <td className="p-3 text-right font-semibold text-stone-800">
                      ${(trip.total_price || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-semibold text-green-600">
                      ${(trip.total_commission || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge className={statusConfig?.color}>{statusConfig?.label}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{agent?.full_name || 'Sin asignar'}</Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(createPageUrl(`SoldTripDetail?id=${trip.id}`))}
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

        {filteredSoldTrips.length === 0 && (
          <EmptyState
            icon={CheckCircle}
            title="No hay viajes vendidos"
            description="No se encontraron viajes con los filtros seleccionados"
          />
        )}
      </div>
    </div>
  );
}