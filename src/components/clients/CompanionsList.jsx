import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, User, Calendar, Loader2 } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { formatDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
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

export default function CompanionsList({ companions = [], onUpdate, isLoading }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    relationship: '',
    passport_number: '',
    passport_expiry: '',
    notes: ''
  });

  const handleAdd = () => {
    setEditingIndex(null);
    setFormData({
      first_name: '',
      last_name: '',
      birth_date: '',
      relationship: '',
      passport_number: '',
      passport_expiry: '',
      notes: ''
    });
    setFormOpen(true);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setFormData(companions[index]);
    setFormOpen(true);
  };

  const handleSave = () => {
    let newCompanions = [...companions];
    if (editingIndex !== null) {
      newCompanions[editingIndex] = formData;
    } else {
      newCompanions.push(formData);
    }
    onUpdate(newCompanions);
    setFormOpen(false);
  };

  const handleDelete = () => {
    const newCompanions = companions.filter((_, i) => i !== deleteIndex);
    onUpdate(newCompanions);
    setDeleteIndex(null);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), new Date(birthDate));
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-stone-800">Acompañantes Frecuentes</h3>
        <Button
          onClick={handleAdd}
          size="sm"
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {companions.length === 0 ? (
        <p className="text-sm text-stone-500 text-center py-4">
          No hay acompañantes registrados
        </p>
      ) : (
        <div className="space-y-3">
          {companions.map((companion, index) => {
            const age = calculateAge(companion.birth_date);
            return (
              <div key={index} className="p-3 bg-stone-50 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ backgroundColor: '#2E442A' }}
                    >
                      {companion.first_name?.[0]}{companion.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800">
                        {companion.first_name} {companion.last_name}
                      </p>
                      {companion.relationship && (
                        <p className="text-xs text-stone-500">{companion.relationship}</p>
                      )}
                      {companion.birth_date && (
                        <p className="text-xs text-stone-400 mt-1">
                          {formatDate(companion.birth_date, 'd MMM yyyy', { locale: es })}
                          {age && ` • ${age} años`}
                        </p>
                      )}
                      {companion.passport_number && (
                        <p className="text-xs text-stone-400">
                          Pasaporte: {companion.passport_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(index)}
                    >
                      <Edit2 className="w-4 h-4 text-stone-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteIndex(index)}
                    >
                      <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
              {editingIndex !== null ? 'Editar Acompañante' : 'Nuevo Acompañante'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Nacimiento</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Relación</Label>
                <Input
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder="Ej: Esposo/a, Hijo/a"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de Pasaporte</Label>
                <Input
                  value={formData.passport_number}
                  onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimiento Pasaporte</Label>
                <Input
                  type="date"
                  value={formData.passport_expiry}
                  onChange={(e) => setFormData({ ...formData, passport_expiry: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !formData.first_name || !formData.last_name}
                className="rounded-xl text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingIndex !== null ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acompañante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este acompañante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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