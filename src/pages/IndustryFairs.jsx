import React, { useState } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { Plus, Calendar, MapPin, DollarSign, Loader2, Edit2, Trash2, Users, ExternalLink, Check } from 'lucide-react';
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
import IndustryFairForm from '@/components/control/IndustryFairForm';
import { toast } from 'sonner';
import { useUser } from '@clerk/clerk-react';

export default function IndustryFairs() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingFair, setEditingFair] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();
  const { user: clerkUser } = useUser();

  // Convert Clerk user to app user format
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress
  } : null;

  const { data: fairs = [], isLoading } = useQuery({
    queryKey: ['industryFairs'],
    queryFn: () => supabaseAPI.entities.IndustryFair.list('-start_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => supabaseAPI.entities.IndustryFair.create({
      ...data,
      created_by: user?.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industryFairs'] });
      setFormOpen(false);
      toast.success('Feria registrada');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseAPI.entities.IndustryFair.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industryFairs'] });
      setFormOpen(false);
      setEditingFair(null);
      toast.success('Feria actualizada');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseAPI.entities.IndustryFair.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industryFairs'] });
      setDeleteConfirm(null);
      toast.success('Feria eliminada');
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
          <h1 className="text-2xl font-bold text-stone-800">Ferias de la Industria</h1>
          <p className="text-stone-500 text-sm">Gestión de ferias y eventos de la industria</p>
        </div>
        <Button
          onClick={() => { setEditingFair(null); setFormOpen(true); }}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Feria
        </Button>
      </div>

      {/* Fairs List */}
      <div className="grid grid-cols-1 gap-4">
        {fairs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-stone-100">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-stone-500">No hay ferias registradas</p>
            <Button
              onClick={() => setFormOpen(true)}
              variant="link"
              style={{ color: '#2E442A' }}
            >
              Crear primera feria
            </Button>
          </div>
        ) : (
          fairs.map((fair, index) => {
            const includesArray = Object.entries(fair.includes || {})
              .filter(([_, value]) => value)
              .map(([key]) => {
                const labels = {
                  flights: 'Vuelos',
                  accommodation: 'Hospedaje',
                  meals: 'Comidas',
                  registration: 'Registro',
                  transportation: 'Transporte'
                };
                return labels[key] || key;
              });

            return (
              <motion.div
                key={fair.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-stone-800">{fair.name}</h3>
                      {fair.website && (
                        <a
                          href={fair.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {fair.created_by === user?.id && (
                        <Badge variant="outline" className="text-xs" style={{ color: '#2E442A' }}>
                          Mi Feria
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(parseLocalDate(fair.start_date), 'd MMM', { locale: es })}
                          {fair.end_date && ` - ${format(parseLocalDate(fair.end_date), 'd MMM yyyy', { locale: es })}`}
                        </span>
                      </div>
                      {fair.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{fair.location}</span>
                        </div>
                      )}
                      {fair.cost_per_person && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${fair.cost_per_person.toLocaleString()} USD/persona</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 mb-2">Organiza: <span className="font-medium">{fair.organizer}</span></p>
                    
                    {/* What's Included */}
                    {includesArray.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {includesArray.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {item}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {fair.created_by === user?.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingFair(fair); setFormOpen(true); }}
                        className="rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(fair)}
                        className="rounded-xl text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Description */}
                {fair.includes_description && (
                  <div className="bg-stone-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-stone-500 mb-1">DETALLES DE LO QUE INCLUYE</p>
                    <p className="text-sm text-stone-700">{fair.includes_description}</p>
                  </div>
                )}

                {/* Assigned Agents */}
                {fair.assigned_agents && fair.assigned_agents.length > 0 && (
                  <div className="border-t border-stone-100 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-stone-500" />
                      <p className="text-xs font-semibold text-stone-500">AGENTES QUE VAN ({fair.assigned_agents.length}/4)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {fair.assigned_agents.map((agent, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: '#2E442A' }}
                          >
                            {agent.agent_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-700 truncate">{agent.agent_name}</p>
                            <p className="text-xs text-stone-400 truncate">{agent.agent_email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fair.notes && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs text-stone-500">{fair.notes}</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Form Dialog */}
      <IndustryFairForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingFair(null); }}
        fair={editingFair}
        onSave={(data) => {
          if (editingFair) {
            updateMutation.mutate({ id: editingFair.id, data });
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
            <AlertDialogTitle>¿Eliminar esta feria?</AlertDialogTitle>
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