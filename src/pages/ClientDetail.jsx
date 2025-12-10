import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeft, Mail, Phone, Calendar, Loader2, 
  Plane, Plus, Send, Copy, Check, ExternalLink
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TripForm from '@/components/trips/TripForm';
import TravelDocumentsList from '@/components/documents/TravelDocumentsList';

const SOURCE_LABELS = {
  referido: 'Referido',
  instagram: 'Instagram',
  facebook: 'Facebook',
  otro: 'Otro'
};

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');
  
  const [formOpen, setFormOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => base44.entities.Client.filter({ id: clientId }).then(res => res[0]),
    enabled: !!clientId
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['clientTrips', clientId],
    queryFn: () => base44.entities.Trip.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['clientDocuments', clientId],
    queryFn: () => base44.entities.TravelDocument.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!clientId
  });

  const createDocMutation = useMutation({
    mutationFn: (data) => base44.entities.TravelDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientDocuments', clientId] });
      toast.success('Documento guardado');
    }
  });

  const updateDocMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TravelDocument.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientDocuments', clientId] });
      toast.success('Documento actualizado');
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => base44.entities.TravelDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientDocuments', clientId] });
      toast.success('Documento eliminado');
    }
  });

  const createTripMutation = useMutation({
    mutationFn: async (tripData) => {
      // Create the trip with provided data
      const trip = await base44.entities.Trip.create(tripData);
      
      // Update client with trip request history
      const tripRequests = client.trip_requests || [];
      await base44.entities.Client.update(clientId, {
        trip_requests: [...tripRequests, {
          ...tripData,
          created_date: new Date().toISOString(),
          trip_id: trip.id
        }]
      });
      
      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientTrips', clientId] });
      setFormOpen(false);
      toast.success('Viaje creado exitosamente');
    }
  });

  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}${createPageUrl(`TripRequestPublic?clientId=${clientId}`)}`;
    navigator.clipboard.writeText(formUrl);
    setLinkCopied(true);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Cliente no encontrado</p>
        <Link to={createPageUrl('Clients')}>
          <Button variant="link" style={{ color: '#2E442A' }}>Volver a clientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Clients')}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-stone-800">
            {client.first_name} {client.last_name}
          </h1>
          <p className="text-stone-500 text-sm">Detalle del cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: '#2E442A' }}
              >
                {client.first_name?.[0]}{client.last_name?.[0]}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-stone-800">
                  {client.first_name} {client.last_name}
                </h2>
                {client.source && (
                  <Badge variant="outline" className="mt-1">
                    {SOURCE_LABELS[client.source] || client.source}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-stone-600">
                <Mail className="w-4 h-4 text-stone-400" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-3 text-stone-600">
                  <Phone className="w-4 h-4 text-stone-400" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.birth_date && (
                <div className="flex items-center gap-3 text-stone-600">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>{format(new Date(client.birth_date), 'd MMMM yyyy', { locale: es })}</span>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-1">Notas</p>
                <p className="text-sm text-stone-600">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Send Form Link */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-3">Enviar Formulario de Viaje</h3>
            <p className="text-sm text-stone-500 mb-4">
              Envía este link al cliente para que llene su solicitud de viaje desde su celular o computadora.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                {linkCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {linkCopied ? 'Copiado' : 'Copiar Link'}
              </Button>
              <Button 
                onClick={() => {
                  const baseUrl = window.location.origin;
                  const formUrl = `${baseUrl}${createPageUrl(`TripRequestPublic?clientId=${clientId}`)}`;
                  window.open(formUrl, '_blank');
                }}
                variant="outline"
                className="rounded-xl"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Travel Documents */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <TravelDocumentsList
              documents={documents}
              clientId={clientId}
              onCreate={(data) => createDocMutation.mutate(data)}
              onUpdate={(id, data) => updateDocMutation.mutate({ id, data })}
              onDelete={(id) => deleteDocMutation.mutate(id)}
              isCreating={createDocMutation.isPending}
              isUpdating={updateDocMutation.isPending}
            />
          </div>
        </div>

        {/* Trips & Requests */}
        <div className="lg:col-span-2 space-y-4">
          {/* New Trip Button */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-stone-800">Viajes del Cliente</h3>
            <Button 
              onClick={() => setFormOpen(true)}
              className="text-white rounded-xl"
              style={{ backgroundColor: '#2E442A' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Viaje
            </Button>
          </div>

          {/* Trips List */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            {trips.length === 0 ? (
              <div className="p-8 text-center">
                <Plane className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p className="text-stone-500">No hay viajes registrados</p>
                <Button 
                  onClick={() => setFormOpen(true)}
                  variant="link"
                  style={{ color: '#2E442A' }}
                >
                  Crear primer viaje
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {trips.map(trip => (
                  <div key={trip.id} className="p-4 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-stone-800">
                          {trip.trip_name || trip.destination}
                        </h4>
                        <p className="text-sm text-stone-500">
                          {trip.start_date && format(new Date(trip.start_date), 'd MMM', { locale: es })}
                          {trip.end_date && ` - ${format(new Date(trip.end_date), 'd MMM yyyy', { locale: es })}`}
                        </p>
                      </div>
                      <Badge 
                        variant="outline"
                        className="capitalize"
                      >
                        {trip.stage?.replace('_', ' ')}
                      </Badge>
                    </div>
                    {trip.mood && (
                      <p className="text-xs text-stone-400 mt-1">{trip.mood}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trip Requests History */}
          {client.trip_requests && client.trip_requests.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="p-4 border-b border-stone-100">
                <h3 className="font-semibold text-stone-800">Historial de Solicitudes</h3>
              </div>
              <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                {client.trip_requests.map((req, idx) => (
                  <div key={idx} className="p-4 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-stone-700">{req.destination}</p>
                        <p className="text-stone-500 text-xs">
                          {req.start_date && format(new Date(req.start_date), 'd MMM', { locale: es })}
                          {req.end_date && ` - ${format(new Date(req.end_date), 'd MMM yyyy', { locale: es })}`}
                        </p>
                      </div>
                      <span className="text-xs text-stone-400">
                        {req.created_date && format(new Date(req.created_date), 'd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trip Form */}
      <TripForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        trip={null}
        clients={clients}
        onSave={(data) => createTripMutation.mutate(data)}
        isLoading={createTripMutation.isPending}
      />
    </div>
  );
}