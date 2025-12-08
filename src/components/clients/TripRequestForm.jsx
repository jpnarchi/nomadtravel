import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, X } from 'lucide-react';

const DESTINATIONS = [
  'Sudeste Asiático', 'Asia Oriental', 'Asia del Sur', 'Medio Oriente',
  'Europa Occidental', 'Europa del Este', 'Europa del Norte', 'Europa del Sur',
  'África del Norte', 'África del Este', 'África del Sur', 'África Occidental',
  'Oceanía / Pacífico', 'Norteamérica', 'Caribe', 'Centroamérica', 'Sudamérica',
  'Islas del Índico', 'Islas del Mediterráneo'
];

const TRIP_MOTIVES = [
  { value: 'honeymoon', label: 'Honeymoon' },
  { value: 'aniversario', label: 'Aniversario' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'negocio', label: 'Negocio' },
  { value: 'familia', label: 'Familia' },
  { value: 'amigos', label: 'Amigos' },
  { value: 'otro', label: 'Otro' }
];

const ACTIVITIES = [
  'Cultura', 'Gastronomía', 'Aventura', 'Playa', 'Hiking', 'Compras',
  'Relax', 'Naturaleza', 'Wellness', 'Vida nocturna', 'Lujo', 'Historia',
  'Safari', 'Nieve', 'Deportes acuáticos'
];

export default function TripRequestForm({ open, onClose, onSave, isLoading, initialData }) {
  const [formData, setFormData] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    budget: '',
    mood: '',
    travelers: '',
    children: '',
    activities: [],
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        destination: '',
        start_date: '',
        end_date: '',
        budget: '',
        mood: '',
        travelers: '',
        children: '',
        activities: [],
        notes: ''
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleActivity = (activity) => {
    const current = formData.activities || [];
    if (current.includes(activity)) {
      setFormData({ ...formData, activities: current.filter(a => a !== activity) });
    } else {
      setFormData({ ...formData, activities: [...current, activity] });
    }
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Destination */}
      <div className="space-y-2">
        <Label>Destino del viaje *</Label>
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

      {/* Dates */}
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

      {/* Budget & Motive */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Presupuesto aprox. (USD)</Label>
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
        <div className="space-y-2">
          <Label>Motivo del viaje</Label>
          <Select value={formData.mood} onValueChange={(v) => setFormData({ ...formData, mood: v })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {TRIP_MOTIVES.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Travelers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="travelers">Número de adultos</Label>
          <Input
            id="travelers"
            type="text"
            value={formData.travelers}
            onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
            className="rounded-xl"
            placeholder="Ej: 2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="children">Número de niños</Label>
          <Input
            id="children"
            type="text"
            value={formData.children}
            onChange={(e) => setFormData({ ...formData, children: e.target.value })}
            className="rounded-xl"
            placeholder="Ej: 1"
          />
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-2">
        <Label>Actividades que les interesan</Label>
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map(activity => (
            <Badge 
              key={activity}
              variant={formData.activities?.includes(activity) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              style={formData.activities?.includes(activity) ? { backgroundColor: '#2E442A' } : {}}
              onClick={() => toggleActivity(activity)}
            >
              {activity}
            </Badge>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="rounded-xl resize-none"
          placeholder="Cualquier detalle adicional sobre el viaje..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading}
          className="rounded-xl text-white"
          style={{ backgroundColor: '#2E442A' }}
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Enviar Solicitud
        </Button>
      </div>
    </form>
  );

  if (!onClose) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            Nueva Solicitud de Viaje
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}