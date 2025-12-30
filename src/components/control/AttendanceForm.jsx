import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';

export default function AttendanceForm({ open, onClose, event, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    event_name: '',
    event_type: 'junta',
    event_date: '',
    event_time: '',
    location: '',
    attendees: [],
    notes: ''
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseAPI.entities.User.list(),
    enabled: open
  });

  useEffect(() => {
    // Always populate all users
    const allAttendees = users.map(user => {
      // If editing, check if user already has attendance data
      const existingAttendee = event?.attendees?.find(a => a.agent_email === user.email);
      return {
        agent_name: user.full_name,
        agent_email: user.email,
        attended: existingAttendee?.attended || false,
        connected: existingAttendee?.connected || false
      };
    });

    if (event) {
      setFormData({
        event_name: event.event_name || '',
        event_type: event.event_type || 'junta',
        event_date: event.event_date || '',
        event_time: event.event_time || '',
        location: event.location || '',
        attendees: allAttendees,
        notes: event.notes || ''
      });
    } else {
      setFormData({
        event_name: '',
        event_type: 'junta',
        event_date: '',
        event_time: '',
        location: '',
        attendees: allAttendees,
        notes: ''
      });
    }
  }, [event, open, users]);

  const updateAttendee = (index, field, value) => {
    const newAttendees = [...formData.attendees];
    newAttendees[index] = { ...newAttendees[index], [field]: value };
    setFormData({ ...formData, attendees: newAttendees });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre del Evento *</Label>
            <Input
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Evento *</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="junta">Junta</SelectItem>
                  <SelectItem value="capacitacion">Capacitación</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora</Label>
              <Input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              />
            </div>

            <div>
              <Label>Ubicación / Plataforma</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Oficina, Zoom, etc."
              />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <Label className="mb-2 block">Asistentes</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.attendees.map((attendee, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-700">{attendee.agent_name}</p>
                    <p className="text-xs text-stone-400">{attendee.agent_email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={attendee.attended}
                        onCheckedChange={(checked) => updateAttendee(index, 'attended', checked)}
                        id={`attended-${index}`}
                      />
                      <label htmlFor={`attended-${index}`} className="text-xs text-stone-600 cursor-pointer">
                        Asistió
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!attendee.attended && !attendee.connected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateAttendee(index, 'attended', false);
                            updateAttendee(index, 'connected', false);
                          }
                        }}
                        id={`absent-${index}`}
                      />
                      <label htmlFor={`absent-${index}`} className="text-xs text-stone-600 cursor-pointer">
                        Ausente
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
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
              {event ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}