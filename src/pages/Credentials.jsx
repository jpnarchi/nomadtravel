import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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
    queryFn: () => base44.entities.Credential.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Credential.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setFormOpen(false);
      toast.success('Credencial guardada');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Credential.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setFormOpen(false);
      setEditingCredential(null);
      toast.success('Credencial actualizada');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Credential.delete(id),
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCredentials.map((credential) => {
            const category = CATEGORIES[credential.category] || CATEGORIES.otro;
            const isPasswordVisible = visiblePasswords[credential.id];

            return (
              <div
                key={credential.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
                      <Key className="w-5 h-5" style={{ color: '#2E442A' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800">{credential.name}</h3>
                      <Badge className={`${category.color} text-xs mt-1`}>{category.label}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => { setEditingCredential(credential); setFormOpen(true); }}
                    >
                      <Edit2 className="w-4 h-4 text-stone-400" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setDeleteConfirm(credential)}
                    >
                      <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>

                {credential.website && (
                  <a 
                    href={credential.website.startsWith('http') ? credential.website : `https://${credential.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-3"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{credential.website}</span>
                  </a>
                )}

                <div className="space-y-2 text-sm">
                  {credential.username && (
                    <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                      <div>
                        <span className="text-stone-400 text-xs">Usuario</span>
                        <p className="text-stone-700 font-mono">{credential.username}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(credential.username, 'Usuario')}
                      >
                        <Copy className="w-3 h-3 text-stone-400" />
                      </Button>
                    </div>
                  )}

                  {credential.password && (
                    <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <span className="text-stone-400 text-xs">Contraseña</span>
                        <p className="text-stone-700 font-mono truncate">
                          {isPasswordVisible ? credential.password : '••••••••'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => togglePasswordVisibility(credential.id)}
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="w-3 h-3 text-stone-400" />
                          ) : (
                            <Eye className="w-3 h-3 text-stone-400" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(credential.password, 'Contraseña')}
                        >
                          <Copy className="w-3 h-3 text-stone-400" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {credential.agent_id && (
                    <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                      <div>
                        <span className="text-stone-400 text-xs">ID de Agente</span>
                        <p className="text-stone-700 font-mono">{credential.agent_id}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(credential.agent_id, 'ID')}
                      >
                        <Copy className="w-3 h-3 text-stone-400" />
                      </Button>
                    </div>
                  )}
                </div>

                {credential.notes && (
                  <p className="text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
                    {credential.notes}
                  </p>
                )}
              </div>
            );
          })}
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