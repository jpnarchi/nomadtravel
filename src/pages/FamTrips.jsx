import React, { useState } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { Plus, Calendar, MapPin, Building2, Loader2, Edit2, Trash2, CheckCircle, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import FamTripForm from '@/components/control/FamTripForm';
import { toast } from 'sonner';

export default function FamTrips() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['famTrips'],
    queryFn: () => supabaseAPI.entities.FamTrip.list('-start_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => supabaseAPI.entities.FamTrip.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famTrips'] });
      setFormOpen(false);
      toast.success('FAM Trip registrado');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.FamTrip.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famTrips'] });
      setFormOpen(false);
      setEditingTrip(null);
      toast.success('FAM Trip actualizado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseAPI.entities.FamTrip.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famTrips'] });
      setDeleteConfirm(null);
      toast.success('FAM Trip eliminado');
    }
  });

  const toggleReviewMutation = useMutation({
    mutationFn: ({ tripId, agentIndex, value }) => {
      const trip = trips.find(t => t.id === tripId);
      const updatedAgents = [...trip.assigned_agents];
      updatedAgents[agentIndex] = { ...updatedAgents[agentIndex], review_submitted: value };
      return supabaseAPI.entities.FamTrip.update(tripId, { assigned_agents: updatedAgents });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famTrips'] });
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
          <h1 className="text-2xl font-bold text-stone-800">FAM Trips</h1>
          <p className="text-stone-500 text-sm">Gestión de viajes FAM y reviews</p>
        </div>
        <Button
          onClick={() => { setEditingTrip(null); setFormOpen(true); }}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo FAM Trip
        </Button>
      </div>

      {/* Trips List */}
      <div className="grid grid-cols-1 gap-4">
        {trips.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-stone-100">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-stone-500">No hay FAM Trips registrados</p>
            <Button
              onClick={() => setFormOpen(true)}
              variant="link"
              style={{ color: '#2E442A' }}
            >
              Crear primer FAM Trip
            </Button>
          </div>
        ) : (
          trips.map((trip, index) => {
            const reviewsCompleted = trip.assigned_agents?.filter(a => a.review_submitted).length || 0;
            const totalAgents = trip.assigned_agents?.length || 0;

            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-stone-800 mb-2">{trip.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.destinations}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(trip.start_date, 'd MMM', { locale: es })}
                          {trip.end_date && ` - ${formatDate(trip.end_date, 'd MMM yyyy', { locale: es })}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{trip.provider}</span>
                      </div>
                      {totalAgents > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {reviewsCompleted}/{totalAgents} reviews
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingTrip(trip); setFormOpen(true); }}
                      className="rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(trip)}
                      className="rounded-xl text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Info Sections */}
                {(trip.provider_info || trip.places_info || trip.relevant_info) && (
                  <div className="space-y-3 mb-4">
                    {trip.provider_info && (
                      <div className="bg-stone-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-stone-500 mb-1">PROVEEDOR</p>
                        <p className="text-sm text-stone-700">{trip.provider_info}</p>
                      </div>
                    )}
                    {trip.places_info && (
                      <div className="bg-stone-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-stone-500 mb-1">LUGARES</p>
                        <p className="text-sm text-stone-700">{trip.places_info}</p>
                      </div>
                    )}
                    {trip.relevant_info && (
                      <div className="bg-stone-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-stone-500 mb-1">INFORMACIÓN RELEVANTE</p>
                        <p className="text-sm text-stone-700">{trip.relevant_info}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Assigned Agents */}
                {trip.assigned_agents && trip.assigned_agents.length > 0 && (
                  <div className="border-t border-stone-100 pt-4">
                    <p className="text-xs font-semibold text-stone-500 mb-3">AGENTES ASIGNADOS</p>
                    <div className="space-y-2">
                      {trip.assigned_agents.map((agent, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-stone-400" />
                            <span className="font-medium text-stone-700">{agent.agent_name}</span>
                            <span className="text-xs text-stone-400">{agent.agent_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={agent.review_submitted}
                              onCheckedChange={(checked) => 
                                toggleReviewMutation.mutate({ 
                                  tripId: trip.id, 
                                  agentIndex: idx, 
                                  value: checked 
                                })
                              }
                              id={`review-${trip.id}-${idx}`}
                            />
                            <label 
                              htmlFor={`review-${trip.id}-${idx}`}
                              className="text-sm text-stone-600 cursor-pointer"
                            >
                              Review entregado
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trip.notes && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs text-stone-500">{trip.notes}</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Form Dialog */}
      <FamTripForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTrip(null); }}
        trip={editingTrip}
        onSave={(data) => {
          if (editingTrip) {
            updateMutation.mutate({ id: editingTrip.id, data });
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
            <AlertDialogTitle>¿Eliminar este FAM Trip?</AlertDialogTitle>
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