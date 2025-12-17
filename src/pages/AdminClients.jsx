import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Search, Eye, Mail, Phone, Loader2, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from '@/components/ui/EmptyState';

export default function AdminClients() {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const navigate = useNavigate();

  const { data: allUsers = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: allClients = [], isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  // Create users map by email for O(1) lookups
  const usersByEmail = useMemo(() => {
    return allUsers.reduce((map, user) => {
      map[user.email] = user;
      return map;
    }, {});
  }, [allUsers]);

  const agents = useMemo(() => 
    allUsers.filter(u => u.role === 'user'),
    [allUsers]
  );

  // Memoize filtered clients
  const filteredClients = useMemo(() => {
    return allClients
      .filter(c => selectedAgent === 'all' || c.created_by === selectedAgent)
      .filter(c => {
        const searchLower = search.toLowerCase();
        return (
          c.first_name?.toLowerCase().includes(searchLower) ||
          c.last_name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
        );
      });
  }, [allClients, selectedAgent, search]);

  // Unified loading state
  const isLoading = usersLoading || clientsLoading;

  // Error handling
  if (usersError || clientsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-stone-800 mb-2">Error al cargar datos</h3>
          <p className="text-sm text-stone-600">
            {usersError ? 'Error al cargar usuarios' : 'Error al cargar clientes'}
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-stone-800">Todos los Clientes</h1>
          <p className="text-stone-500 text-sm mt-1">
            {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} en total
          </p>
        </div>
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Buscar por nombre o email..."
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
                <th className="text-left p-3 font-semibold text-stone-600">Email</th>
                <th className="text-left p-3 font-semibold text-stone-600">Teléfono</th>
                <th className="text-left p-3 font-semibold text-stone-600">Agente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredClients.map((client) => {
                const agent = usersByEmail[client.created_by];
                const clientFullName = `${client.first_name} ${client.last_name}`;
                return (
                  <tr key={client.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3">
                      <span className="font-medium text-stone-800">
                        {clientFullName}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-stone-600">
                        <Mail className="w-4 h-4 text-stone-400" />
                        {client.email}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-stone-600">
                        <Phone className="w-4 h-4 text-stone-400" />
                        {client.phone || '-'}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{agent?.full_name || 'Sin asignar'}</Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(createPageUrl(`ClientDetail?id=${client.id}`))}
                        aria-label={`Ver detalles de ${clientFullName}`}
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

        {filteredClients.length === 0 && (
          <EmptyState
            icon={Users}
            title="No hay clientes"
            description="No se encontraron clientes con los filtros seleccionados"
          />
        )}
      </div>
    </div>
  );
}