import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const STAGES = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'cotizando', label: 'Cotizando' },
  { value: 'propuesta_enviada', label: 'Propuesta Enviada' },
  { value: 'aceptado', label: 'Aceptado' },
  { value: 'vendido', label: 'Vendido' }
];

export default function TripForm({ open, onClose, trip, clients, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    destination: '',
    start_date: '',
    end_date: '',
    travelers: 1,
    budget: '',
    mood: '',
    stage: 'nuevo',
    notes: ''
  });

  useEffect(() => {
    if (trip) {
      setFormData({
        client_id: trip.client_id || '',
        client_name: trip.client_name || '',
        destination: trip.destination || '',
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        travelers: trip.travelers || 1,
        budget: trip.budget || '',
        mood: trip.mood || '',
        stage: trip.stage || 'nuevo',
        notes: trip.notes || ''
      });
    } else {
      setFormData({
        client_id: '',
        client_name: '',
        destination: '',
        start_date: '',
        end_date: '',
        travelers: 1,
        budget: '',
        mood: '',
        stage: 'nuevo',
        notes: ''
      });
    }
  }, [trip, open]);

  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {trip ? 'Editar Viaje' : 'Nuevo Viaje'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={formData.client_id} onValueChange={handleClientChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destino *</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
              className="rounded-xl"
              placeholder="Ej: París, Francia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha inicio *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travelers">Número de personas</Label>
              <Input
                id="travelers"
                type="number"
                min="1"
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value) || 1 })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto (MXN)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || '' })}
                className="rounded-xl"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mood">Mood del viaje</Label>
              <Input
                id="mood"
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                className="rounded-xl"
                placeholder="Ej: Romántico, Aventura"
              />
            </div>
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {trip ? 'Actualizar' : 'Crear Viaje'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}