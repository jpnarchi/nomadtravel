import React, { useState } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Building2, Star, MapPin, 
  Phone, Mail, ExternalLink, Edit2, Trash2, 
  Loader2, Filter, ChevronRight, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
import SupplierForm from '@/components/suppliers/SupplierForm';
import EmptyState from '@/components/ui/EmptyState';

const SUPPLIER_TYPES = {
  dmc: { label: 'DMC', color: 'bg-purple-100 text-purple-700' },
  hotel_directo: { label: 'Hotel Directo', color: 'bg-blue-100 text-blue-700' },
  cadena_hotelera: { label: 'Cadena Hotelera', color: 'bg-indigo-100 text-indigo-700' },
  aerolinea: { label: 'Aerolínea', color: 'bg-sky-100 text-sky-700' },
  plataforma: { label: 'Plataforma', color: 'bg-amber-100 text-amber-700' },
  transporte: { label: 'Transporte', color: 'bg-emerald-100 text-emerald-700' },
  tours: { label: 'Tours / Actividades', color: 'bg-pink-100 text-pink-700' },
  agencia_representante: { label: 'Agencia Representante', color: 'bg-teal-100 text-teal-700' },
  otro: { label: 'Otro', color: 'bg-stone-100 text-stone-700' }
};

export default function Suppliers() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [smartImportMode, setSmartImportMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supabaseAPI.entities.Supplier.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => supabaseAPI.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setFormOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.Supplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setFormOpen(false);
      setEditingSupplier(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseAPI.entities.Supplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteConfirm(null);
    }
  });

  const handleSave = (data) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const searchLower = search.toLowerCase();
    const matchesName = s.name?.toLowerCase().includes(searchLower);
    const matchesDestination = s.destinations?.some(d => d.toLowerCase().includes(searchLower));
    const matchesSearch = matchesName || matchesDestination;
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'}`} 
      />
    ));
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
          <h1 className="text-2xl font-bold text-stone-800">Proveedores</h1>
          <p className="text-stone-500 text-sm mt-1">Gestiona tus proveedores y contactos</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => { setEditingSupplier(null); setSmartImportMode(true); setFormOpen(true); }}
            variant="outline"
            className="rounded-xl"
          >
            <Sparkles className="w-4 h-4 mr-2" style={{ color: '#2E442A' }} /> Smart Import
          </Button>
          <Button 
            onClick={() => { setEditingSupplier(null); setSmartImportMode(false); setFormOpen(true); }}
            className="text-white rounded-xl"
            style={{ backgroundColor: '#2E442A' }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Buscar por nombre o destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <Filter className="w-4 h-4 mr-2 text-stone-400" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(SUPPLIER_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers List */}
                  {filteredSuppliers.length === 0 ? (
                    <EmptyState
                      icon={Building2}
                      title={search || typeFilter !== 'all' ? "Sin resultados" : "Sin proveedores"}
                      description={search || typeFilter !== 'all' ? "No hay proveedores que coincidan" : "Agrega tu primer proveedor"}
                      actionLabel="Nuevo Proveedor"
                      onAction={() => setFormOpen(true)}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-stone-50 border-b border-stone-100">
                            <tr>
                              <th className="text-left p-4 font-medium text-stone-600">Proveedor</th>
                              <th className="text-left p-4 font-medium text-stone-600">Tipo</th>
                              <th className="text-left p-4 font-medium text-stone-600">Destinos</th>
                              <th className="text-left p-4 font-medium text-stone-600">Rating</th>
                              <th className="text-left p-4 font-medium text-stone-600">Comisión</th>
                              <th className="text-right p-4 font-medium text-stone-600">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSuppliers.map((supplier) => {
                              const typeConfig = SUPPLIER_TYPES[supplier.type] || SUPPLIER_TYPES.otro;
                              return (
                                <tr key={supplier.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2E442A15' }}>
                                        <Building2 className="w-4 h-4" style={{ color: '#2E442A' }} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-medium text-stone-800 truncate">{supplier.name}</p>
                                        {supplier.website && (
                                          <a 
                                            href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            <span className="truncate max-w-[120px]">{supplier.website.replace(/^https?:\/\//, '')}</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <Badge className={`${typeConfig.color} text-xs`}>{typeConfig.label}</Badge>
                                  </td>
                                  <td className="p-4">
                                    {supplier.destinations?.length > 0 ? (
                                      <div className="flex items-center gap-1 text-stone-600 text-xs">
                                        <MapPin className="w-3 h-3 text-stone-400" />
                                        <span className="truncate max-w-[150px]">
                                          {supplier.destinations.slice(0, 2).join(', ')}
                                          {supplier.destinations.length > 2 && ` +${supplier.destinations.length - 2}`}
                                        </span>
                                      </div>
                                    ) : <span className="text-stone-300">-</span>}
                                  </td>
                                  <td className="p-4">
                                    {supplier.rating ? (
                                      <div className="flex items-center gap-0.5">
                                        {renderStars(supplier.rating)}
                                      </div>
                                    ) : <span className="text-stone-300">-</span>}
                                  </td>
                                  <td className="p-4">
                                    <span className="text-stone-600 text-xs">{supplier.commission || '-'}</span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                      <Link to={createPageUrl(`SupplierDetail?id=${supplier.id}`)}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <ChevronRight className="w-4 h-4 text-stone-400" />
                                        </Button>
                                      </Link>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingSupplier(supplier); setFormOpen(true); }}>
                                        <Edit2 className="w-4 h-4 text-stone-400" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm(supplier)}>
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
      <SupplierForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingSupplier(null); setSmartImportMode(false); }}
        supplier={editingSupplier}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
        showSmartImportOnOpen={smartImportMode}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{deleteConfirm?.name}" y todos sus contactos y documentos.
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