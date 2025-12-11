import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function FamTripForm({ open, onClose, trip, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    destinations: '',
    start_date: '',
    end_date: '',
    provider: '',
    provider_info: '',
    places_info: '',
    relevant_info: '',
    assigned_agents: [],
    notes: ''
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: open
  });

  useEffect(() => {
    if (trip) {
      setFormData({
        name: trip.name || '',
        destinations: trip.destinations || '',
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        provider: trip.provider || '',
        provider_info: trip.provider_info || '',
        places_info: trip.places_info || '',
        relevant_info: trip.relevant_info || '',
        assigned_agents: trip.assigned_agents || [],
        notes: trip.notes || ''
      });
    } else {
      setFormData({
        name: '',
        destinations: '',
        start_date: '',
        end_date: '',
        provider: '',
        provider_info: '',
        places_info: '',
        relevant_info: '',
        assigned_agents: [],
        notes: ''
      });
    }
  }, [trip, open]);

  const addAgent = (user) => {
    if (!formData.assigned_agents.find(a => a.agent_email === user.email)) {
      setFormData({
        ...formData,
        assigned_agents: [...formData.assigned_agents, {
          agent_name: user.full_name,
          agent_email: user.email,
          review_submitted: false
        }]
      });
    }
  };

  const removeAgent = (index) => {
    const newAgents = [...formData.assigned_agents];
    newAgents.splice(index, 1);
    setFormData({ ...formData, assigned_agents: newAgents });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trip ? 'Editar FAM Trip' : 'Nuevo FAM Trip'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre del FAM Trip *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Destinos *</Label>
            <Input
              value={formData.destinations}
              onChange={(e) => setFormData({ ...formData, destinations: e.target.value })}
              placeholder="Ej: París, Roma, Barcelona"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de Inicio *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Fecha de Fin</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Proveedor que Invita *</Label>
            <Input
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Información del Proveedor</Label>
            <Textarea
              value={formData.provider_info}
              onChange={(e) => setFormData({ ...formData, provider_info: e.target.value })}
              rows={2}
              placeholder="Detalles sobre el proveedor..."
            />
          </div>

          <div>
            <Label>Información de Lugares</Label>
            <Textarea
              value={formData.places_info}
              onChange={(e) => setFormData({ ...formData, places_info: e.target.value })}
              rows={2}
              placeholder="Hoteles, restaurantes, atracciones..."
            />
          </div>

          <div>
            <Label>Información Relevante</Label>
            <Textarea
              value={formData.relevant_info}
              onChange={(e) => setFormData({ ...formData, relevant_info: e.target.value })}
              rows={2}
              placeholder="Otra información importante del viaje..."
            />
          </div>

          {/* Assigned Agents */}
          <div>
            <Label className="mb-2 block">Agentes Asignados</Label>
            <div className="mb-3">
              <Select onValueChange={(value) => {
                const user = users.find(u => u.email === value);
                if (user) addAgent(user);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Agregar agente..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {formData.assigned_agents.map((agent, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-700">{agent.agent_name}</p>
                    <p className="text-xs text-stone-400">{agent.agent_email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAgent(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {trip ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}