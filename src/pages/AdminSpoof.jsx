import React, { useState, useMemo } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, ExternalLink, Loader2, AlertCircle, Shield, Mail, UserCheck } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isAdminEmail } from '@/config/adminEmails';

export default function AdminSpoof() {
  const [search, setSearch] = useState('');

  const { data: allUsers = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseAPI.entities.User.list()
  });

  // Fetch counts per user for context
  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => supabaseAPI.entities.Client.list()
  });

  const { data: allTrips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => supabaseAPI.entities.Trip.list()
  });

  const { data: allSoldTrips = [] } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => supabaseAPI.entities.SoldTrip.list()
  });

  // Aggregate stats per user email
  const userStats = useMemo(() => {
    const stats = {};
    allUsers.forEach(u => {
      const email = u.email?.toLowerCase();
      if (email) {
        stats[email] = { clients: 0, trips: 0, soldTrips: 0 };
      }
    });

    allClients.forEach(c => {
      const email = c.created_by?.toLowerCase();
      if (email && stats[email]) stats[email].clients++;
    });

    allTrips.forEach(t => {
      const email = t.created_by?.toLowerCase();
      if (email && stats[email]) stats[email].trips++;
    });

    allSoldTrips.forEach(s => {
      const email = s.created_by?.toLowerCase();
      if (email && stats[email]) stats[email].soldTrips++;
    });

    return stats;
  }, [allUsers, allClients, allTrips, allSoldTrips]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(u =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  const handleSpoof = (user) => {
    const params = new URLSearchParams({
      spoof_email: user.email,
      spoof_name: user.full_name || user.email,
      spoof_id: user.id || user.email,
    });
    // Open in a new tab at the Dashboard with spoof params
    window.open(`/Dashboard?${params.toString()}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>Error al cargar usuarios: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                 style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Spoof de Usuarios</h1>
              <p className="text-sm text-stone-500">Ver la aplicación como cualquier usuario registrado</p>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 px-3 py-1.5 text-sm self-start">
          <Shield className="w-3.5 h-3.5 mr-1.5" />
          Solo Administradores
        </Badge>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Modo de Suplantación (Spoof)</p>
            <p className="text-sm text-amber-700 mt-1">
              Al hacer clic en "Spoof", se abrirá una nueva pestaña donde podrás ver la aplicación exactamente como la ve el usuario seleccionado.
              Todos los datos que verás serán los del usuario suplantado. Para salir del modo spoof, cierra la pestaña o haz clic en el banner de spoof.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Users className="w-4 h-4" />
        <span>{filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const stats = userStats[u.email?.toLowerCase()] || { clients: 0, trips: 0, soldTrips: 0 };
          const isAdmin = isAdminEmail(u.email);
          const initials = (u.full_name || u.email || '?')
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={u.id || u.email}
              className="bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg, var(--nomad-green-light) 0%, var(--nomad-green) 100%)' }}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900 truncate">
                        {u.full_name || 'Sin nombre'}
                      </h3>
                      {isAdmin && (
                        <Badge className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0 flex-shrink-0">
                          Admin
                        </Badge>
                      )}
                      {u.custom_role === 'supervisor' && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0 flex-shrink-0">
                          Supervisor
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <p className="text-sm text-stone-500 truncate">{u.email}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-stone-800">{stats.clients}</p>
                    <p className="text-xs text-stone-500">Clientes</p>
                  </div>
                  <div className="w-px h-8 bg-stone-100" />
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-stone-800">{stats.trips}</p>
                    <p className="text-xs text-stone-500">Viajes</p>
                  </div>
                  <div className="w-px h-8 bg-stone-100" />
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-stone-800">{stats.soldTrips}</p>
                    <p className="text-xs text-stone-500">Vendidos</p>
                  </div>
                </div>

                {/* Spoof Button */}
                <Button
                  onClick={() => handleSpoof(u)}
                  className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-white font-medium gap-2 transition-all duration-200 group-hover:shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  Spoof — Ver como este usuario
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500">No se encontraron usuarios</p>
        </div>
      )}
    </div>
  );
}
