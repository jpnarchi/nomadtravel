import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Clock, DollarSign, Hotel, Plane as PlaneIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { parseLocalDate } from '@/components/utils/dateHelpers';

export default function UpcomingPayments({ services, soldTrips }) {
  const getTripInfo = (tripId) => {
    return soldTrips.find(t => t.id === tripId);
  };

  const upcomingPayments = services
    .filter(service => service.payment_due_date && service.reservation_status !== 'pagado')
    .map(service => {
      const dueDateParsed = parseLocalDate(service.payment_due_date);
      const days = dueDateParsed && !isNaN(dueDateParsed.getTime())
        ? differenceInDays(dueDateParsed, new Date())
        : 999;
      const trip = getTripInfo(service.sold_trip_id);
      return { ...service, daysUntilDue: days, tripInfo: trip };
    })
    .filter(service => service.daysUntilDue <= 30)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  if (upcomingPayments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
        <div className="p-4 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Pagos por Vencer</h3>
        </div>
        <div className="p-8 text-center">
          <DollarSign className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          <p className="text-sm text-stone-400">Sin pagos próximos a vencer</p>
        </div>
      </div>
    );
  }

  const getServiceIcon = (type) => {
    if (type === 'hotel') return Hotel;
    if (type === 'vuelo') return PlaneIcon;
    return DollarSign;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
      <div className="p-4 border-b border-stone-100">
        <h3 className="text-sm font-semibold text-stone-800">Pagos por Vencer</h3>
      </div>
      
      <div className="p-3 max-h-64 overflow-y-auto space-y-2">
        {upcomingPayments.map((service) => {
          const Icon = getServiceIcon(service.service_type);
          const isOverdue = service.daysUntilDue < 0;
          const isUrgent = service.daysUntilDue <= 7;

          return (
            <Link 
              key={service.id} 
              to={createPageUrl(`SoldTripDetail?id=${service.sold_trip_id}`)}
              className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg transition-colors"
            >
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isOverdue ? 'bg-red-100' : isUrgent ? 'bg-orange-100' : 'bg-yellow-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${
                  isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-yellow-600'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-stone-800 truncate">
                  {service.tripInfo?.client_name || 'Cliente'}
                </p>
                <p className="text-xs text-stone-500 truncate">
                  {service.hotel_name || service.airline || service.service_type} - ${service.total_price?.toLocaleString() || 0}
                </p>
              </div>

              <Badge className={`text-xs whitespace-nowrap ${
                isOverdue ? 'bg-red-100 text-red-700' : 
                isUrgent ? 'bg-orange-100 text-orange-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {isOverdue ? (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Vencido
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    {service.daysUntilDue}d
                  </>
                )}
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}