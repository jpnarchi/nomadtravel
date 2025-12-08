import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Key, Eye, EyeOff, Copy, Edit2, Trash2, 
  Loader2, ExternalLink, Filter, Lock
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
import PersonalCredentialForm from '@/components/credentials/PersonalCredentialForm';
import EmptyState from '@/components/ui/EmptyState';

const CATEGORIES = {
  banco: { label: 'Banco', color: 'bg-green-100 text-green-700' },
  tarjeta_credito: { label: 'Tarjeta de Crédito', color: 'bg-blue-100 text-blue-700' },
  red_social: { label: 'Red Social', color: 'bg-purple-100 text-purple-700' },
  email: { label: 'Email', color: 'bg-red-100 text-red-700' },
  streaming: { label: 'Streaming', color: 'bg-pink-100 text-pink-700' },
  compras: { label: 'Compras Online', color: 'bg-orange-100 text-orange-700' },
  trabajo: { label: 'Trabajo', color: 'bg-indigo-100 text-indigo-700' },
  salud: { label: 'Salud', color: 'bg-teal-100 text-teal-700' },
  gobierno: { label: 'Gobierno', color: 'bg-slate-100 text-slate-700' },
  educacion: { label: 'Educación', color: 'bg-yellow-100 text-yellow-700' },
  otro: { label: 'Otro', color: 'bg-stone-100 text-stone-700' }
};

export default function PersonalCredentials() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: allCredentials = [], isLoading } = useQuery({
    queryKey: ['personalCredentials'],
    queryFn: () => base44.entities.PersonalCredential.list('-created_date'),
    enabled: !!user
  });

  // Filter only current user's credentials
  const credentials = user ? allCredentials.filter(c => c.created_by === user.email) : [];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalCredential.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalCredentials'] });
      setFormOpen(false);
      toast.success('Contraseña guardada');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PersonalCredential.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalCredentials'] });
      setFormOpen(false);
      setEditingCredential(null);
      toast.success('Contraseña actualizada');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalCredential.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalCredentials'] });
      setDeleteConfirm(null);
      toast.success('Contraseña eliminada');
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

  if (isLoading || !user) {
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
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6" style={{ color: '#2E442A' }} />
            <h1 className="text-2xl font-bold text-stone-800">Mis Contraseñas Personales</h1>
          </div>
          <p className="text-stone-500 text-sm mt-1">Guarda tus contraseñas de forma segura y privada</p>
        </div>
        <Button 
          onClick={() => { setEditingCredential(null); setFormOpen(true); }}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Contraseña
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Privacidad total:</span> Solo tú puedes ver y editar estas contraseñas. Nadie más en el equipo tiene acceso.
            </p>
          </div>
        </div>
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

      {/* Credentials Grid */}
      {filteredCredentials.length === 0 ? (
        <EmptyState
          icon={Lock}
          title={search || categoryFilter !== 'all' ? "Sin resultados" : "Sin contraseñas guardadas"}
          description={search || categoryFilter !== 'all' ? "No hay contraseñas que coincidan" : "Guarda tus contraseñas personales de forma segura"}
          actionLabel="Nueva Contraseña"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCredentials.map((credential) => {
            const category = CATEGORIES[credential.category] || CATEGORIES.otro;
            const isPasswordVisible = visiblePasswords[credential.id];

            return (
              <div key={credential.id} className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2E442A15' }}>
                      <Key className="w-5 h-5" style={{ color: '#2E442A' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-stone-800 truncate">{credential.name}</h3>
                      <Badge className={`${category.color} text-xs mt-1`}>{category.label}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCredential(credential); setFormOpen(true); }}>
                      <Edit2 className="w-4 h-4 text-stone-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm(credential)}>
                      <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {credential.website && (
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">Sitio web</label>
                      <a 
                        href={credential.website.startsWith('http') ? credential.website : `https://${credential.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{credential.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    </div>
                  )}

                  {credential.username && (
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">Usuario</label>
                      <div className="flex items-center gap-2 bg-stone-50 rounded-lg p-2">
                        <span className="font-mono text-sm text-stone-700 flex-1 truncate">{credential.username}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => copyToClipboard(credential.username, 'Usuario')}>
                          <Copy className="w-3 h-3 text-stone-400" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {credential.password && (
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">Contraseña</label>
                      <div className="flex items-center gap-2 bg-stone-50 rounded-lg p-2">
                        <span className="font-mono text-sm text-stone-700 flex-1 truncate">
                          {isPasswordVisible ? credential.password : '••••••••••'}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => togglePasswordVisibility(credential.id)}>
                          {isPasswordVisible ? <EyeOff className="w-3 h-3 text-stone-400" /> : <Eye className="w-3 h-3 text-stone-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => copyToClipboard(credential.password, 'Contraseña')}>
                          <Copy className="w-3 h-3 text-stone-400" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {credential.notes && (
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">Notas</label>
                      <p className="text-sm text-stone-600 bg-stone-50 rounded-lg p-2">{credential.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <PersonalCredentialForm
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
            <AlertDialogTitle>¿Eliminar contraseña?</AlertDialogTitle>
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