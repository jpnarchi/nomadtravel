import React, { useState } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { Plus, Calendar, MapPin, Users, Loader2, Edit2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
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
import AttendanceForm from '@/components/control/AttendanceForm';
import { toast } from 'sonner';

const EVENT_TYPE_LABELS = {
  evento: 'Evento',
  junta: 'Junta',
  capacitacion: 'Capacitación',
  otro: 'Otro'
};

const EVENT_TYPE_COLORS = {
  evento: 'bg-blue-100 text-blue-700',
  junta: 'bg-purple-100 text-purple-700',
  capacitacion: 'bg-green-100 text-green-700',
  otro: 'bg-stone-100 text-stone-700'
};

export default function Attendance() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => supabaseAPI.entities.Attendance.list('-event_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseAPI.entities.User.list()
  });

  // Calculate stats
  const totalEvents = events.length;
  const recentEvents = events.slice(0, 5);
  
  const attendanceStats = users.map(user => {
    const userAttendance = events.reduce((acc, event) => {
      const attendee = event.attendees?.find(a => a.agent_email === user.email);
      if (attendee) {
        if (attendee.attended || attendee.connected) acc.attended++;
        acc.total++;
      }
      return acc;
    }, { attended: 0, total: totalEvents });
    
    return {
      name: user.full_name,
      email: user.email,
      attended: userAttendance.attended,
      total: totalEvents,
      percentage: totalEvents > 0 ? Math.round((userAttendance.attended / totalEvents) * 100) : 0
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const createMutation = useMutation({
    mutationFn: (data) => supabaseAPI.entities.Attendance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setFormOpen(false);
      toast.success('Evento registrado');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.Attendance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setFormOpen(false);
      setEditingEvent(null);
      toast.success('Evento actualizado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseAPI.entities.Attendance.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setDeleteConfirm(null);
      toast.success('Evento eliminado');
    }
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Control de Asistencia</h1>
          <p className="text-stone-500 text-sm">Registro de eventos y juntas</p>
        </div>
        <Button
          onClick={() => { setEditingEvent(null); setFormOpen(true); }}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {/* Quick Stats */}
      {totalEvents > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs text-stone-500 mb-1">Total Eventos</p>
            <p className="text-2xl font-bold" style={{ color: '#2E442A' }}>{totalEvents}</p>
          </div>
          
          {attendanceStats.slice(0, 3).map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <p className="text-xs text-stone-500 mb-1 truncate">{stat.name}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold" style={{ color: '#2E442A' }}>{stat.percentage}%</p>
                <p className="text-xs text-stone-400">({stat.attended}/{stat.total})</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-stone-100">
            <Users className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-stone-500">No hay eventos registrados</p>
            <Button
              onClick={() => setFormOpen(true)}
              variant="link"
              style={{ color: '#2E442A' }}
            >
              Crear primer evento
            </Button>
          </div>
        ) : (
          events.map((event, index) => {
            const attendedCount = event.attendees?.filter(a => a.attended || a.connected).length || 0;
            const totalCount = event.attendees?.length || 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-stone-800">{event.event_name}</h3>
                      <Badge className={EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.otro}>
                        {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.event_date, 'd MMMM yyyy', { locale: es })}</span>
                        {event.event_time && <span>• {event.event_time}</span>}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{attendedCount} / {totalCount} asistieron</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingEvent(event); setFormOpen(true); }}
                      className="rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(event)}
                      className="rounded-xl text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Attendees List */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="border-t border-stone-100 pt-4">
                    <p className="text-xs font-semibold text-stone-500 mb-2">ASISTENCIA</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {event.attendees.map((attendee, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            attendee.attended ? 'bg-green-500' : 
                            attendee.connected ? 'bg-blue-500' : 
                            'bg-stone-300'
                          }`} />
                          <span className="text-stone-700">{attendee.agent_name}</span>
                          <span className="text-xs text-stone-400">
                            {attendee.attended ? '(Presencial)' : attendee.connected ? '(Virtual)' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.notes && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs text-stone-500">{event.notes}</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Form Dialog */}
      <AttendanceForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingEvent(null); }}
        event={editingEvent}
        onSave={(data) => {
          if (editingEvent) {
            updateMutation.mutate({ id: editingEvent.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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