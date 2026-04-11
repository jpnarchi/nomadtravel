import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Settings, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useServiceDropdownOptions,
  useCreateServiceDropdownOption,
  useUpdateServiceDropdownOption,
  useDeleteServiceDropdownOption,
  DROPDOWN_CATEGORIES,
} from '@/hooks/useServiceDropdownOptions';

const SERVICE_TYPE_COLORS = {
  vuelo: 'bg-blue-100 text-blue-700',
  hotel: 'bg-amber-100 text-amber-700',
  crucero: 'bg-cyan-100 text-cyan-700',
  tren: 'bg-purple-100 text-purple-700',
  traslado: 'bg-green-100 text-green-700',
};

function OptionFormDialog({ open, onClose, initial, onSave, isSaving }) {
  const [label, setLabel] = useState(initial?.label || '');
  const [value, setValue] = useState(initial?.value || '');
  const [category, setCategory] = useState(initial?.category || 'airline');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const isEditing = !!initial?.id;

  // Auto-generate value from label when creating
  const handleLabelChange = (v) => {
    setLabel(v);
    if (!isEditing) {
      setValue(
        v.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .replace(/_+/g, '_')
          .slice(0, 60)
      );
    }
  };

  const handleSave = () => {
    if (!label.trim() || !value.trim() || !category) return;
    onSave({ id: initial?.id, label: label.trim(), value: value.trim(), category, is_active: isActive });
  };

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setLabel(initial?.label || '');
      setValue(initial?.value || '');
      setCategory(initial?.category || 'airline');
      setIsActive(initial?.is_active ?? true);
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-stone-900">
            {isEditing ? 'Editar opción' : 'Nueva opción de dropdown'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Categoría / Dropdown</Label>
            <Select value={category} onValueChange={setCategory} disabled={isEditing}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DROPDOWN_CATEGORIES).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                    <span className="ml-2 text-xs text-stone-400">({meta.serviceType})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nombre visible (label)</Label>
            <Input
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="rounded-xl"
              placeholder="Ej: VivaAerobus"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Valor interno (value){' '}
              <span className="text-xs text-stone-400 font-normal">— solo letras, números y guiones bajos</span>
            </Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="rounded-xl font-mono text-sm"
              placeholder="viva_aerobus"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(v => !v)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center ${isActive ? 'bg-emerald-500' : 'bg-stone-300'}`}
            >
              <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <Label className="cursor-pointer select-none" onClick={() => setIsActive(v => !v)}>
              {isActive ? 'Activo' : 'Inactivo'}
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!label.trim() || !value.trim() || isSaving}
              className="flex-1 rounded-xl text-white font-semibold"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategorySection({ categoryKey, meta, options, onAdd, onEdit, onDelete, deletingId }) {
  const [expanded, setExpanded] = useState(true);
  const active = options.filter(o => o.is_active);
  const inactive = options.filter(o => !o.is_active);

  return (
    <Card className="overflow-hidden border border-stone-200 rounded-xl">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 flex items-center gap-3">
          <span className="font-semibold text-stone-900">{meta.label}</span>
          <Badge className={`text-xs font-medium border-0 ${SERVICE_TYPE_COLORS[meta.serviceType] || 'bg-stone-100 text-stone-600'}`}>
            {meta.serviceType}
          </Badge>
          <span className="text-xs text-stone-500">{active.length} activa{active.length !== 1 ? 's' : ''}</span>
          {inactive.length > 0 && (
            <span className="text-xs text-stone-400">, {inactive.length} inactiva{inactive.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onAdd(categoryKey); }}
          className="rounded-lg text-white text-xs h-7 px-3 font-semibold shadow-sm hover:shadow-md transition-all"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
        </Button>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-stone-400 ml-1 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-stone-400 ml-1 flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-stone-100 divide-y divide-stone-50">
          {options.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">
              Sin opciones personalizadas en esta categoría
            </p>
          ) : (
            options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50/60 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.is_active ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{opt.label}</p>
                  <p className="text-xs text-stone-400 font-mono truncate">{opt.value}</p>
                </div>
                {!opt.is_active && (
                  <Badge className="text-xs border-0 bg-stone-100 text-stone-500">inactiva</Badge>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 text-stone-400 hover:text-stone-700"
                  onClick={() => onEdit(opt)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 text-stone-400 hover:text-red-500"
                  onClick={() => onDelete(opt)}
                  disabled={deletingId === opt.id}
                >
                  {deletingId === opt.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

export default function AdminServiceOptions() {
  const { data: allOptions = [], isLoading, error } = useServiceDropdownOptions();
  const createMutation = useCreateServiceDropdownOption();
  const updateMutation = useUpdateServiceDropdownOption();
  const deleteMutation = useDeleteServiceDropdownOption();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null); // null = new, object = edit
  const [defaultCategory, setDefaultCategory] = useState('airline');
  const [deletingId, setDeletingId] = useState(null);

  const optionsByCategory = useMemo(() => {
    const map = {};
    Object.keys(DROPDOWN_CATEGORIES).forEach(k => { map[k] = []; });
    allOptions.forEach(o => {
      if (!map[o.category]) map[o.category] = [];
      map[o.category].push(o);
    });
    return map;
  }, [allOptions]);

  const handleAdd = (category) => {
    setEditingOption(null);
    setDefaultCategory(category);
    setDialogOpen(true);
  };

  const handleEdit = (option) => {
    setEditingOption(option);
    setDialogOpen(true);
  };

  const handleDelete = async (option) => {
    if (!confirm(`¿Eliminar la opción "${option.label}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(option.id);
    try {
      await deleteMutation.mutateAsync(option.id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async ({ id, ...data }) => {
    if (id) {
      await updateMutation.mutateAsync({ id, ...data });
    } else {
      await createMutation.mutateAsync({ ...data, is_active: data.is_active ?? true });
    }
    setDialogOpen(false);
    setEditingOption(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
        <p>Error al cargar opciones: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2E442A 0%, #4a6741 100%)' }}
          >
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Opciones de Servicios</h1>
            <p className="text-sm text-stone-500">
              Personaliza los dropdowns del formulario de servicios
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 px-3 py-1.5 text-sm self-start">
          <Settings className="w-3.5 h-3.5 mr-1.5" />
          Solo Administradores
        </Badge>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">¿Cómo funciona?</p>
            <p className="text-sm text-blue-700 mt-1">
              Las opciones que agregues aquí aparecerán al final de cada dropdown correspondiente en el formulario de servicios.
              Las opciones del sistema base siempre se muestran primero. Puedes desactivar una opción sin eliminarla.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total opciones', value: allOptions.length, color: 'text-stone-800' },
          { label: 'Activas', value: allOptions.filter(o => o.is_active).length, color: 'text-emerald-700' },
          { label: 'Inactivas', value: allOptions.filter(o => !o.is_active).length, color: 'text-stone-400' },
          { label: 'Categorías', value: Object.keys(DROPDOWN_CATEGORIES).length, color: 'text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-stone-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {Object.entries(DROPDOWN_CATEGORIES).map(([key, meta]) => (
          <CategorySection
            key={key}
            categoryKey={key}
            meta={meta}
            options={optionsByCategory[key] || []}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        ))}
      </div>

      {/* Form Dialog */}
      <OptionFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingOption(null); }}
        initial={editingOption ? editingOption : { category: defaultCategory }}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
