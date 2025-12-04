import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import TripRequestForm from '@/components/clients/TripRequestForm';

export default function TripRequestPublic() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');
  
  const [submitted, setSubmitted] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['publicClient', clientId],
    queryFn: () => base44.entities.Client.filter({ id: clientId }).then(res => res[0]),
    enabled: !!clientId
  });

  const submitMutation = useMutation({
    mutationFn: async (tripData) => {
      // Create the trip
      const trip = await base44.entities.Trip.create({
        ...tripData,
        client_id: clientId,
        client_name: `${client.first_name} ${client.last_name}`,
        stage: 'nuevo'
      });
      
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
      setSubmitted(true);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-stone-300" />
          <h1 className="text-xl font-semibold text-stone-800 mb-2">Formulario no disponible</h1>
          <p className="text-stone-500">El link del formulario no es válido o ha expirado.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
            * { font-family: 'Montserrat', sans-serif; }
          `}
        </style>
        <div className="text-center max-w-md">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#2E442A15' }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: '#2E442A' }} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-3">¡Solicitud Enviada!</h1>
          <p className="text-stone-500">
            Gracias {client.first_name}, hemos recibido tu solicitud de viaje. 
            Nos pondremos en contacto contigo pronto para planear tu aventura.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
          * { font-family: 'Montserrat', sans-serif; }
        `}
      </style>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: '#2E442A' }}
          >
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#2E442A' }}>
            Nomad Travel Society
          </h1>
          <p className="text-stone-500 mt-2">
            Hola {client.first_name}, cuéntanos sobre tu próximo viaje
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <TripRequestForm
            open={true}
            onSave={(data) => submitMutation.mutate(data)}
            isLoading={submitMutation.isPending}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 mt-6">
          © Nomad Travel Society - San Pedro Garza García, N.L.
        </p>
      </div>
    </div>
  );
}