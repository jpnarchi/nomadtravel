import React, { useState, useEffect, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewModeContext } from '@/Layout';
import { AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Plane } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
import TripForm from '@/components/trips/TripForm';
import TripCard from '@/components/trips/TripCard';
import EmptyState from '@/components/ui/EmptyState';

const STAGES = [
  { key: 'nuevo', label: 'Nuevo', color: '#3b82f6' },
  { key: 'cotizando', label: 'Cotizando', color: '#eab308' },
  { key: 'propuesta_enviada', label: 'Propuesta Enviada', color: '#a855f7' },
  { key: 'aceptado', label: 'Aceptado', color: '#22c55e' },
  { key: 'vendido', label: 'Vendido', color: '#2E442A' },
  { key: 'perdido', label: 'Perdido', color: '#ef4444' }
];

const STAGE_ORDER = ['nuevo', 'cotizando', 'propuesta_enviada', 'aceptado', 'vendido'];

export default function Trips() {
  const { viewMode } = useContext(ViewModeContext);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin' && viewMode === 'admin';

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.Trip.list('-created_date');
      return base44.entities.Trip.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.Client.list();
      return base44.entities.Client.filter({ created_by: user.email });
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Trip.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setFormOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Trip.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
      setFormOpen(false);
      setEditingTrip(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Trip.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setDeleteConfirm(null);
    }
  });

  const createSoldTripMutation = useMutation({
    mutationFn: (data) => base44.entities.SoldTrip.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
    }
  });

  const handleSave = async (data) => {
    if (editingTrip) {
      // Check if moving to "vendido" stage
      if (data.stage === 'vendido' && editingTrip.stage !== 'vendido') {
        // Create sold trip record
        await createSoldTripMutation.mutateAsync({
          trip_id: editingTrip.id,
          client_id: data.client_id,
          client_name: data.client_name,
          destination: data.destination,
          start_date: data.start_date,
          end_date: data.end_date,
          travelers: data.travelers,
          total_price: data.budget || 0,
          total_commission: 0,
          total_paid_by_client: 0,
          total_paid_to_suppliers: 0,
          status: 'pendiente'
        });
      }
      updateMutation.mutate({ id: editingTrip.id, data });
    } else {
      // Check if creating with "vendido" stage
      if (data.stage === 'vendido') {
        const trip = await createMutation.mutateAsync(data);
        // Create sold trip record immediately
        await createSoldTripMutation.mutateAsync({
          trip_id: trip.id,
          client_id: data.client_id,
          client_name: data.client_name,
          destination: data.destination,
          start_date: data.start_date,
          end_date: data.end_date,
          travelers: data.travelers,
          total_price: data.budget || 0,
          total_commission: 0,
          total_paid_by_client: 0,
          total_paid_to_suppliers: 0,
          status: 'pendiente'
        });
      } else {
        createMutation.mutate(data);
      }
    }
  };

  const handleMoveStage = async (trip) => {
    const currentIndex = STAGE_ORDER.indexOf(trip.stage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIndex + 1];
      
      if (nextStage === 'vendido') {
        // Create sold trip record
        await createSoldTripMutation.mutateAsync({
          trip_id: trip.id,
          client_id: trip.client_id,
          client_name: trip.client_name,
          destination: trip.destination,
          start_date: trip.start_date,
          end_date: trip.end_date,
          travelers: trip.travelers,
          total_price: trip.budget || 0,
          total_commission: 0,
          total_paid_by_client: 0,
          total_paid_to_suppliers: 0,
          status: 'pendiente'
        });
      }
      
      updateMutation.mutate({ id: trip.id, data: { stage: nextStage } });
    }
  };

  if (tripsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-800">Viajes</h1>
          <p className="text-stone-500 mt-1">{trips.length} viajes en proceso</p>
        </div>
        <Button 
          onClick={() => { setEditingTrip(null); setFormOpen(true); }}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Viaje
        </Button>
      </div>

      {trips.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="Sin viajes"
          description="Crea tu primer viaje para comenzar a gestionar tu embudo de ventas"
          actionLabel="Crear Viaje"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        /* Kanban Board */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => {
              const stageTrips = trips.filter(t => t.stage === stage.key);
              return (
                <div 
                  key={stage.key}
                  className="w-72 flex-shrink-0"
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-stone-700">{stage.label}</h3>
                    <span className="text-sm text-stone-400 ml-auto">
                      {stageTrips.length}
                    </span>
                  </div>

                  {/* Column Content */}
                  <div className="space-y-3 min-h-[200px] bg-stone-50 rounded-2xl p-3">
                    <AnimatePresence>
                      {stageTrips.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          onEdit={(t) => { setEditingTrip(t); setFormOpen(true); }}
                          onDelete={(t) => setDeleteConfirm(t)}
                          onMoveStage={handleMoveStage}
                        />
                      ))}
                    </AnimatePresence>
                    
                    {stageTrips.length === 0 && (
                      <div className="text-center py-8 text-sm text-stone-400">
                        Sin viajes
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <TripForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTrip(null); }}
        trip={editingTrip}
        clients={clients}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el viaje a{' '}
              <strong>{deleteConfirm?.destination}</strong> de {deleteConfirm?.client_name}.
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