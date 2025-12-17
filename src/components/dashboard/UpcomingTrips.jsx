import React from 'react';
import { format, addMonths, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plane } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { parseLocalDate } from '@/components/utils/dateHelpers';

export default function UpcomingTrips({ soldTrips }) {
  const now = new Date();
  const threeMonthsFromNow = addMonths(now, 3);
  
  const sortedTrips = [...soldTrips]
    .filter(trip => {
      if (!trip.start_date) return false;
      const tripDate = parseLocalDate(trip.start_date);
      return isAfter(tripDate, now) && isBefore(tripDate, threeMonthsFromNow);
    })
    .sort((a, b) => parseLocalDate(a.start_date) - parseLocalDate(b.start_date));

  if (sortedTrips.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
        <div className="p-4 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Viajes Próximos</h3>
        </div>
        <EmptyState
          icon={Plane}
          title="Sin viajes próximos"
          description="Los viajes de los próximos 3 meses aparecerán aquí"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
      <div className="p-4 border-b border-stone-100">
        <h3 className="text-sm font-semibold text-stone-800">Viajes Próximos</h3>
      </div>
      
      <div className="p-3 max-h-64 overflow-y-auto">
        {sortedTrips.map((trip) => (
          <div
            key={trip.id}
            className="flex items-center justify-between py-1.5 px-2 hover:bg-stone-50 rounded text-xs"
          >
            <span className="text-stone-700 truncate flex-1 mr-2">
              {trip.client_name} - {trip.destination}
            </span>
            <span className="text-stone-400 whitespace-nowrap">
              {format(parseLocalDate(trip.start_date), 'd MMM yy', { locale: es })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}