import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DESTINATIONS = [
  'Sudeste Asiático',
  'Asia Oriental',
  'Asia del Sur',
  'Medio Oriente',
  'Europa Occidental',
  'Europa del Este',
  'Europa del Norte',
  'Europa del Sur',
  'África del Norte',
  'África del Este',
  'África del Sur',
  'África Occidental',
  'Oceanía / Pacífico',
  'Norteamérica',
  'Caribe',
  'Centroamérica',
  'Sudamérica',
  'Islas del Índico',
  'Islas del Mediterráneo'
];

const STAGES = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'cotizando', label: 'Cotizando' },
  { value: 'propuesta_enviada', label: 'Propuesta Enviada' },
  { value: 'aceptado', label: 'Aceptado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'perdido', label: 'Perdido' }
];

export default function TripForm({ open, onClose, trip, clients, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    trip_name: '',
    client_id: '',
    client_name: '',
    destination: '',
    start_date: '',
    end_date: '',
    travelers: 1,
    budget: '',
    mood: '',
    stage: 'nuevo',
    notes: '',
    lost_reason: ''
  });

  useEffect(() => {
    if (trip) {
      setFormData({
        trip_name: trip.trip_name || '',
        client_id: trip.client_id || '',
        client_name: trip.client_name || '',
        destination: trip.destination || '',
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        travelers: trip.travelers || 1,
        budget: trip.budget || '',
        mood: trip.mood || '',
        stage: trip.stage || 'nuevo',
        notes: trip.notes || '',
        lost_reason: trip.lost_reason || ''
      });
    } else {
      setFormData({
        trip_name: '',
        client_id: '',
        client_name: '',
        destination: '',
        start_date: '',
        end_date: '',
        travelers: 1,
        budget: '',
        mood: '',
        stage: 'nuevo',
        notes: '',
        lost_reason: ''
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
    
    // Validar campos requeridos
    if (!formData.client_id) {
      alert('Por favor selecciona un cliente');
      return;
    }
    if (!formData.destination) {
      alert('Por favor selecciona al menos un destino');
      return;
    }
    if (!formData.start_date) {
      alert('Por favor ingresa una fecha de inicio');
      return;
    }
    
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
            <Label htmlFor="trip_name">Nombre del Viaje</Label>
            <Input
              id="trip_name"
              value={formData.trip_name}
              onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
              className="rounded-xl"
              placeholder="Ej: Luna de miel Europa"
            />
          </div>

          <div className="space-y-2">
            <Label>Cliente <span className="text-red-500">*</span></Label>
            <Select value={formData.client_id} onValueChange={handleClientChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <div className="p-2 text-sm text-stone-500">
                    No tienes clientes. Crea uno primero.
                  </div>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Destino <span className="text-red-500">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl font-normal h-auto min-h-10 py-2"
                >
                  {formData.destination ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.destination.split(', ').map((dest) => (
                        <Badge key={dest} variant="secondary" className="text-xs">
                          {dest}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newDests = formData.destination.split(', ').filter(d => d !== dest);
                              setFormData({ ...formData, destination: newDests.join(', ') });
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-stone-400">Seleccionar destinos</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {DESTINATIONS.map((dest) => {
                    const isSelected = formData.destination?.split(', ').includes(dest);
                    return (
                      <div key={dest} className="flex items-center gap-2">
                        <Checkbox
                          id={dest}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            let currentDests = formData.destination ? formData.destination.split(', ').filter(d => d) : [];
                            if (checked) {
                              currentDests.push(dest);
                            } else {
                              currentDests = currentDests.filter(d => d !== dest);
                            }
                            setFormData({ ...formData, destination: currentDests.join(', ') });
                          }}
                        />
                        <label htmlFor={dest} className="text-sm cursor-pointer">{dest}</label>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha inicio <span className="text-red-500">*</span></Label>
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
                type="text"
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                className="rounded-xl"
                placeholder="Ej: 2 o 2 adultos + 1 niño"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto (USD)</Label>
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

          {formData.stage === 'perdido' && (
            <div className="space-y-2 p-4 bg-red-50 rounded-xl border border-red-200">
              <Label htmlFor="lost_reason" className="text-red-700">Motivo de pérdida *</Label>
              <Textarea
                id="lost_reason"
                value={formData.lost_reason}
                onChange={(e) => setFormData({ ...formData, lost_reason: e.target.value })}
                rows={2}
                className="rounded-xl resize-none border-red-200"
                placeholder="Ej: Precio muy alto, eligió otra agencia, cambió de planes..."
                required={formData.stage === 'perdido'}
              />
            </div>
          )}

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