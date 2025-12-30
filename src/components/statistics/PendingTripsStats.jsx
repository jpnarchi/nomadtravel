import React from 'react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { 
  Clock, XCircle, Send, FileText, MessageSquare,
  MapPin, Calendar, Users, DollarSign, Heart
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const STAGE_CONFIG = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: FileText },
  cotizando: { label: 'Cotizando', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  propuesta_enviada: { label: 'Propuesta Enviada', color: 'bg-purple-100 text-purple-800', icon: Send },
  aceptado: { label: 'Aceptado', color: 'bg-green-100 text-green-800', icon: MessageSquare },
  perdido: { label: 'Perdido', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export default function PendingTripsStats({ trips }) {
  // Filter only non-sold trips (exclude 'vendido' stage)
  const pendingTrips = trips.filter(t => t.stage !== 'vendido');
  
  // Count by stage
  const byStage = pendingTrips.reduce((acc, t) => {
    acc[t.stage] = (acc[t.stage] || 0) + 1;
    return acc;
  }, {});

  // Lost trips
  const lostTrips = pendingTrips.filter(t => t.stage === 'perdido');
  const activeTrips = pendingTrips.filter(t => t.stage !== 'perdido');

  // Calculate potential revenue
  const potentialRevenue = activeTrips.reduce((sum, t) => sum + (t.budget || 0), 0);
  const lostRevenue = lostTrips.reduce((sum, t) => sum + (t.budget || 0), 0);

  // Count by mood
  const byMood = pendingTrips.reduce((acc, t) => {
    if (t.mood) {
      acc[t.mood] = (acc[t.mood] || 0) + 1;
    }
    return acc;
  }, {});

  // Count by destination
  const byDestination = pendingTrips.reduce((acc, t) => {
    if (t.destination) {
      acc[t.destination] = (acc[t.destination] || 0) + 1;
    }
    return acc;
  }, {});

  // Top destinations
  const topDestinations = Object.entries(byDestination)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">{activeTrips.length}</p>
          <p className="text-xs text-stone-500">Viajes en proceso</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">${potentialRevenue.toLocaleString()}</p>
          <p className="text-xs text-stone-500">Ingresos potenciales</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">{lostTrips.length}</p>
          <p className="text-xs text-stone-500">Viajes perdidos</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">${lostRevenue.toLocaleString()}</p>
          <p className="text-xs text-stone-500">Ingresos perdidos</p>
        </div>
      </div>

      {/* Pipeline by Stage */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-4">Pipeline por Etapa</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STAGE_CONFIG).filter(([key]) => key !== 'vendido').map(([stage, config]) => {
            const Icon = config.icon;
            const count = byStage[stage] || 0;
            return (
              <div key={stage} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color.split(' ')[0]}`}>
                  <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-stone-800">{count}</p>
                  <p className="text-xs text-stone-500">{config.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Top Destinations and Mood Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Destinations */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Top Destinos Solicitados</h3>
          {topDestinations.length > 0 ? (
            <div className="space-y-3">
              {topDestinations.map(([dest, count], idx) => (
                <div key={dest} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" 
                          style={{ backgroundColor: '#2E442A15', color: '#2E442A' }}>
                      {idx + 1}
                    </span>
                    <span className="text-stone-700">{dest}</span>
                  </div>
                  <Badge variant="outline">{count} viajes</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 text-sm">No hay datos aún</p>
          )}
        </div>

        {/* Mood Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Tipo de Viaje (Mood)</h3>
          {Object.keys(byMood).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(byMood).map(([mood, count]) => (
                <div key={mood} className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-stone-700 capitalize">{mood}</span>
                  <Badge className="bg-pink-100 text-pink-800">{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 text-sm">No hay datos de mood aún</p>
          )}
        </div>
      </div>

      {/* Trips List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">Detalle de Viajes en Proceso / Perdidos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Cliente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Destino</th>
                <th className="text-left p-3 font-semibold text-stone-600">Fechas</th>
                <th className="text-center p-3 font-semibold text-stone-600">Viajeros</th>
                <th className="text-right p-3 font-semibold text-stone-600">Presupuesto</th>
                <th className="text-center p-3 font-semibold text-stone-600">Mood</th>
                <th className="text-center p-3 font-semibold text-stone-600">Etapa</th>
                <th className="text-left p-3 font-semibold text-stone-600">Motivo Pérdida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pendingTrips.map((trip) => {
                const stageConfig = STAGE_CONFIG[trip.stage] || {};
                return (
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
                        {trip.start_date ? format(parseLocalDate(trip.start_date), 'd MMM', { locale: es }) : '-'}
                        {trip.end_date && ` - ${format(parseLocalDate(trip.end_date), 'd MMM yy', { locale: es })}`}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-stone-700">{trip.travelers || '-'}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-semibold" style={{ color: '#2E442A' }}>
                        ${(trip.budget || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {trip.mood ? (
                        <Badge variant="outline" className="capitalize">{trip.mood}</Badge>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={stageConfig.color || 'bg-gray-100'}>
                        {stageConfig.label || trip.stage}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {trip.stage === 'perdido' && trip.lost_reason ? (
                        <span className="text-red-600 text-xs">{trip.lost_reason}</span>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pendingTrips.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p>No hay viajes en proceso</p>
          </div>
        )}
      </div>
    </div>
  );
}