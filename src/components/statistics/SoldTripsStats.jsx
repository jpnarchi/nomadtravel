import React from 'react';
import { formatDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { 
  CheckCircle, DollarSign, Users, MapPin, Calendar, 
  Hotel, Plane, Ship, Car, Compass
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  completado: { label: 'Completado', color: 'bg-purple-100 text-purple-800' }
};

export default function SoldTripsStats({ soldTrips, services }) {
  // Calculate stats
  const totalRevenue = soldTrips.reduce((sum, t) => sum + (t.total_price || 0), 0);
  const totalCommission = soldTrips.reduce((sum, t) => sum + (t.total_commission || 0), 0);
  const totalCollected = soldTrips.reduce((sum, t) => sum + (t.total_paid_by_client || 0), 0);
  const totalTravelers = soldTrips.reduce((sum, t) => sum + (t.travelers || 0), 0);

  // Count services by type
  const servicesByType = services.reduce((acc, s) => {
    acc[s.service_type] = (acc[s.service_type] || 0) + 1;
    return acc;
  }, {});

  const serviceIcons = {
    hotel: Hotel,
    vuelo: Plane,
    crucero: Ship,
    traslado: Car,
    tour: Compass
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">{soldTrips.length}</p>
          <p className="text-xs text-stone-500">Viajes vendidos</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
              <DollarSign className="w-5 h-5" style={{ color: '#2E442A' }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-stone-500">Ingresos totales</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">${totalCommission.toLocaleString()}</p>
          <p className="text-xs text-stone-500">Comisiones totales</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">{totalTravelers}</p>
          <p className="text-xs text-stone-500">Viajeros totales</p>
        </div>
      </div>

      {/* Services Summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-4">Servicios Vendidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(servicesByType).map(([type, count]) => {
            const Icon = serviceIcons[type] || Compass;
            return (
              <div key={type} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <Icon className="w-5 h-5" style={{ color: '#2E442A' }} />
                <div>
                  <p className="text-lg font-bold text-stone-800">{count}</p>
                  <p className="text-xs text-stone-500 capitalize">{type === 'vuelo' ? 'Vuelos' : type === 'hotel' ? 'Hoteles' : type === 'crucero' ? 'Cruceros' : type === 'traslado' ? 'Traslados' : type === 'tour' ? 'Tours' : type}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trips List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">Detalle de Viajes Vendidos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Cliente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Destino</th>
                <th className="text-left p-3 font-semibold text-stone-600">Fechas</th>
                <th className="text-center p-3 font-semibold text-stone-600">Viajeros</th>
                <th className="text-right p-3 font-semibold text-stone-600">Total</th>
                <th className="text-right p-3 font-semibold text-stone-600">Comisión</th>
                <th className="text-center p-3 font-semibold text-stone-600">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {soldTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3">
                    <span className="font-medium text-stone-800">{trip.client_name || '-'}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-stone-400" />
                      <span className="text-stone-700">{trip.destination || '-'}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-stone-600 text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDate(trip.start_date, 'd MMM', { locale: es })}
                      {trip.end_date && ` - ${formatDate(trip.end_date, 'd MMM yy', { locale: es })}`}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-stone-700">{trip.travelers || '-'}</span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-semibold" style={{ color: '#2E442A' }}>
                      ${(trip.total_price || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-purple-600 font-medium">
                      ${(trip.total_commission || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className={STATUS_CONFIG[trip.status]?.color || 'bg-gray-100'}>
                      {STATUS_CONFIG[trip.status]?.label || trip.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {soldTrips.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p>No hay viajes vendidos aún</p>
          </div>
        )}
      </div>
    </div>
  );
}