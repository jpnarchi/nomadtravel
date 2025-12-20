import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';

/**
 * Normaliza una fecha a formato YYYY-MM-DD sin conversiones de timezone.
 * Evita el bug del día corrido.
 */
function normalizeDateOnly(value) {
  if (!value) return '';
  // Si viene "2025-12-19" o "2025-12-19T00:00:00.000Z", tomar solo YYYY-MM-DD
  return String(value).slice(0, 10);
}

export default function SoldTripForm({ open, onClose, soldTrip, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    travelers: '',
    notes: ''
  });

  useEffect(() => {
    if (soldTrip && open) {
      setFormData({
        destination: soldTrip.destination || '',
        start_date: normalizeDateOnly(soldTrip.start_date),
        end_date: normalizeDateOnly(soldTrip.end_date),
        travelers: soldTrip.travelers || '',
        notes: soldTrip.notes || ''
      });
    }
  }, [soldTrip, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Viaje Vendido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <p className="text-sm font-medium text-stone-700">{soldTrip?.client_name}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destino *</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha Inicio *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha Fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="travelers">Número de Viajeros</Label>
            <Input
              id="travelers"
              type="text"
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
              className="rounded-xl"
              placeholder="Ej: 2 o 2 adultos + 1 niño"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}