import React, { useState } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Key, Eye, EyeOff, Copy, Edit2, Trash2, 
  Loader2, ExternalLink, Filter, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { toast } from "sonner";
import CredentialForm from '@/components/credentials/CredentialForm';
import EmptyState from '@/components/ui/EmptyState';

const CATEGORIES = {
  portal_agente: { label: 'Portal de Agente', color: 'bg-blue-100 text-blue-700' },
  aerolinea: { label: 'Aerolínea', color: 'bg-sky-100 text-sky-700' },
  hotel: { label: 'Hotel / Cadena', color: 'bg-purple-100 text-purple-700' },
  plataforma: { label: 'Plataforma', color: 'bg-amber-100 text-amber-700' },
  dmc: { label: 'DMC', color: 'bg-emerald-100 text-emerald-700' },
  consolidador: { label: 'Consolidador', color: 'bg-rose-100 text-rose-700' },
  otro: { label: 'Otro', color: 'bg-stone-100 text-stone-700' }
};

export default function Credentials() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const queryClient = useQueryClient();

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => supabaseAPI.entities.Credential.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => supabaseAPI.entities.Credential.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setFormOpen(false);
      toast.success('Credencial guardada');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.Credential.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setFormOpen(false);
      setEditingCredential(null);
      toast.success('Credencial actualizada');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseAPI.entities.Credential.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setDeleteConfirm(null);
      toast.success('Credencial eliminada');
    }
  });

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const filteredCredentials = credentials.filter(c => {
    const matchesSearch = !search || 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.website?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
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
          <h1 className="text-2xl font-bold text-stone-800">Contraseñas y Accesos</h1>
          <p className="text-stone-500 text-sm mt-1">Gestiona las credenciales de portales y servicios</p>
        </div>
        <Button 
          onClick={() => { setEditingCredential(null); setFormOpen(true); }}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Credencial
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Buscar por nombre, usuario o sitio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <Filter className="w-4 h-4 mr-2 text-stone-400" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Credentials List */}
      {filteredCredentials.length === 0 ? (
        <EmptyState
          icon={Key}
          title={search || categoryFilter !== 'all' ? "Sin resultados" : "Sin credenciales"}
          description={search || categoryFilter !== 'all' ? "No hay credenciales que coincidan" : "Guarda tus accesos a portales y servicios"}
          actionLabel="Nueva Credencial"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="text-left p-4 font-medium text-stone-600">Nombre</th>
                  <th className="text-left p-4 font-medium text-stone-600">Categoría</th>
                  <th className="text-left p-4 font-medium text-stone-600">Usuario</th>
                  <th className="text-left p-4 font-medium text-stone-600">Contraseña</th>
                  <th className="text-left p-4 font-medium text-stone-600">ID Agente</th>
                  <th className="text-right p-4 font-medium text-stone-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredentials.map((credential) => {
                  const category = CATEGORIES[credential.category] || CATEGORIES.otro;
                  const isPasswordVisible = visiblePasswords[credential.id];

                  return (
                    <tr key={credential.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2E442A15' }}>
                            <Key className="w-4 h-4" style={{ color: '#2E442A' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-stone-800 truncate">{credential.name}</p>
                            {credential.website && (
                              <a 
                                href={credential.website.startsWith('http') ? credential.website : `https://${credential.website}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{credential.website.replace(/^https?:\/\//, '')}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`${category.color} text-xs`}>{category.label}</Badge>
                      </td>
                      <td className="p-4">
                        {credential.username ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-stone-600 truncate max-w-[150px]">{credential.username}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(credential.username, 'Usuario')}>
                              <Copy className="w-3 h-3 text-stone-400" />
                            </Button>
                          </div>
                        ) : <span className="text-stone-300">-</span>}
                      </td>
                      <td className="p-4">
                        {credential.password ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-stone-600 truncate max-w-[100px]">
                              {isPasswordVisible ? credential.password : '••••••••'}
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePasswordVisibility(credential.id)}>
                              {isPasswordVisible ? <EyeOff className="w-3 h-3 text-stone-400" /> : <Eye className="w-3 h-3 text-stone-400" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(credential.password, 'Contraseña')}>
                              <Copy className="w-3 h-3 text-stone-400" />
                            </Button>
                          </div>
                        ) : <span className="text-stone-300">-</span>}
                      </td>
                      <td className="p-4">
                        {credential.agent_id ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-stone-600">{credential.agent_id}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(credential.agent_id, 'ID')}>
                              <Copy className="w-3 h-3 text-stone-400" />
                            </Button>
                          </div>
                        ) : <span className="text-stone-300">-</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCredential(credential); setFormOpen(true); }}>
                            <Edit2 className="w-4 h-4 text-stone-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm(credential)}>
                            <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <CredentialForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCredential(null); }}
        credential={editingCredential}
        onSave={(data) => {
          if (editingCredential) {
            updateMutation.mutate({ id: editingCredential.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar credencial?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{deleteConfirm?.name}" permanentemente.
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