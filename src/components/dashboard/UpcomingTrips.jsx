import React from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Calendar, Users, Plane } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function UpcomingTrips({ soldTrips }) {
  const today = new Date();
  
  const upcoming = soldTrips
    .filter(trip => new Date(trip.start_date) >= today)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-lg font-semibold text-stone-800">Próximos Viajes</h3>
        </div>
        <EmptyState
          icon={Plane}
          title="Sin viajes próximos"
          description="Los viajes vendidos con fechas futuras aparecerán aquí"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
      <div className="p-6 border-b border-stone-100">
        <h3 className="text-lg font-semibold text-stone-800">Próximos Viajes</h3>
      </div>
      
      <div className="divide-y divide-stone-100">
        {upcoming.map((trip, index) => {
          const daysUntil = differenceInDays(new Date(trip.start_date), today);
          
          return (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-stone-800 text-sm">{trip.client_name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#2E442A' }} />
                    <span className="text-sm text-stone-600">{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(trip.start_date), 'd MMM', { locale: es })}</span>
                    </div>
                    {trip.travelers && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{trip.travelers}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: daysUntil <= 7 ? '#fef2f2' : '#2E442A15',
                    color: daysUntil <= 7 ? '#dc2626' : '#2E442A'
                  }}
                >
                  {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `${daysUntil} días`}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}