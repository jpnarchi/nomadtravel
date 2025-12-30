import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Loader2 } from 'lucide-react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';

export default function IndustryFairForm({ open, onClose, fair, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    organizer: '',
    start_date: '',
    end_date: '',
    location: '',
    cost_per_person: '',
    includes: {
      flights: false,
      accommodation: false,
      meals: false,
      registration: false,
      transportation: false
    },
    includes_description: '',
    assigned_agents: [],
    website: '',
    notes: ''
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseAPI.entities.User.list(),
    enabled: open
  });

  useEffect(() => {
    if (fair) {
      setFormData({
        name: fair.name || '',
        organizer: fair.organizer || '',
        start_date: fair.start_date || '',
        end_date: fair.end_date || '',
        location: fair.location || '',
        cost_per_person: fair.cost_per_person || '',
        includes: fair.includes || {
          flights: false,
          accommodation: false,
          meals: false,
          registration: false,
          transportation: false
        },
        includes_description: fair.includes_description || '',
        assigned_agents: fair.assigned_agents || [],
        website: fair.website || '',
        notes: fair.notes || ''
      });
    } else {
      setFormData({
        name: '',
        organizer: '',
        start_date: '',
        end_date: '',
        location: '',
        cost_per_person: '',
        includes: {
          flights: false,
          accommodation: false,
          meals: false,
          registration: false,
          transportation: false
        },
        includes_description: '',
        assigned_agents: [],
        website: '',
        notes: ''
      });
    }
  }, [fair, open]);

  const addAgent = (user) => {
    if (formData.assigned_agents.length >= 4) {
      return;
    }
    if (!formData.assigned_agents.find(a => a.agent_email === user.email)) {
      setFormData({
        ...formData,
        assigned_agents: [...formData.assigned_agents, {
          agent_name: user.full_name,
          agent_email: user.email
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
    const dataToSave = {
      ...formData,
      cost_per_person: formData.cost_per_person ? parseFloat(formData.cost_per_person) : null
    };
    onSave(dataToSave);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fair ? 'Editar Feria' : 'Nueva Feria'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre de la Feria *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Organizador *</Label>
            <Input
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ubicación</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ciudad, país"
              />
            </div>

            <div>
              <Label>Costo por Persona (USD)</Label>
              <Input
                type="number"
                value={formData.cost_per_person}
                onChange={(e) => setFormData({ ...formData, cost_per_person: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* What's Included */}
          <div>
            <Label className="mb-3 block">¿Qué Incluye?</Label>
            <div className="space-y-2 bg-stone-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.includes.flights}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    includes: { ...formData.includes, flights: checked } 
                  })}
                  id="flights"
                />
                <label htmlFor="flights" className="text-sm cursor-pointer">Vuelos</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.includes.accommodation}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    includes: { ...formData.includes, accommodation: checked } 
                  })}
                  id="accommodation"
                />
                <label htmlFor="accommodation" className="text-sm cursor-pointer">Hospedaje</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.includes.meals}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    includes: { ...formData.includes, meals: checked } 
                  })}
                  id="meals"
                />
                <label htmlFor="meals" className="text-sm cursor-pointer">Comidas</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.includes.registration}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    includes: { ...formData.includes, registration: checked } 
                  })}
                  id="registration"
                />
                <label htmlFor="registration" className="text-sm cursor-pointer">Registro</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.includes.transportation}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    includes: { ...formData.includes, transportation: checked } 
                  })}
                  id="transportation"
                />
                <label htmlFor="transportation" className="text-sm cursor-pointer">Transporte Local</label>
              </div>
            </div>
          </div>

          <div>
            <Label>Descripción Detallada de lo que Incluye</Label>
            <Textarea
              value={formData.includes_description}
              onChange={(e) => setFormData({ ...formData, includes_description: e.target.value })}
              rows={3}
              placeholder="Detalles sobre vuelos, hospedaje, comidas, etc..."
            />
          </div>

          {/* Assigned Agents */}
          <div>
            <Label className="mb-2 block">Agentes Asignados (máx 4)</Label>
            {formData.assigned_agents.length < 4 && (
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
            )}

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
              {fair ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}