import React, { useState, useEffect, useContext } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewModeContext } from '@/Layout';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';
import {
  Plus, Search, Edit2, Trash2, Mail, Phone,
  Calendar, Loader2, Users, Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import ClientForm from '@/components/clients/ClientForm';
import EmptyState from '@/components/ui/EmptyState';

export default function Clients() {
  const { viewMode } = useContext(ViewModeContext);
  const { user: clerkUser } = useUser();

  // Convert Clerk user to app user format
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName || clerkUser.username,
    role: clerkUser.publicMetadata?.role || 'user',
    custom_role: clerkUser.publicMetadata?.custom_role
  } : null;

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin' && viewMode === 'admin';

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) {
        return supabaseAPI.entities.Client.list();
      } else {
        return supabaseAPI.entities.Client.filter({ created_by: user.email });
      }
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => supabaseAPI.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setFormOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setFormOpen(false);
      setEditingClient(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseAPI.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleteConfirm(null);
    }
  });

  const handleSave = (data) => {
    // Convert empty strings to null for date fields
    const cleanedData = {
      ...data,
      birth_date: data.birth_date || null
    };

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: cleanedData });
    } else {
      createMutation.mutate({ ...cleanedData, created_by: user?.email });
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = search.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(searchLower) ||
      client.last_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(search)
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
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-800">Clientes</h1>
          <p className="text-stone-500 mt-1">{clients.length} clientes registrados</p>
        </div>
        <Button 
          onClick={() => { setEditingClient(null); setFormOpen(true); }}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Buscar clientes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Sin resultados" : "Sin clientes"}
          description={search ? "No se encontraron clientes con esa búsqueda" : "Agrega tu primer cliente para comenzar"}
          actionLabel={!search ? "Agregar Cliente" : undefined}
          onAction={!search ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="text-left p-4 font-medium text-stone-600">Cliente</th>
                  <th className="text-left p-4 font-medium text-stone-600">Email</th>
                  <th className="text-left p-4 font-medium text-stone-600">Teléfono</th>
                  <th className="text-left p-4 font-medium text-stone-600">Cumpleaños</th>
                  <th className="text-right p-4 font-medium text-stone-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                          style={{ backgroundColor: '#2E442A' }}
                        >
                          {client.first_name?.[0]}{client.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-stone-800 truncate">
                            {client.first_name} {client.last_name}
                          </p>
                          {client.notes && (
                            <p className="text-xs text-stone-400 truncate max-w-[200px]">{client.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-stone-600 text-xs">{client.email}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-stone-600 text-xs">{client.phone || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-stone-600 text-xs">
                        {client.birth_date ? format(parseLocalDate(client.birth_date), 'd MMM yyyy', { locale: es }) : '-'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={createPageUrl(`ClientDetail?id=${client.id}`)}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4 text-stone-400" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingClient(client); setFormOpen(true); }}>
                          <Edit2 className="w-4 h-4 text-stone-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm(client)}>
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
      )}

      {/* Form Dialog */}
      <ClientForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingClient(null); }}
        client={editingClient}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a{' '}
              <strong>{deleteConfirm?.first_name} {deleteConfirm?.last_name}</strong>.
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