import React, { useMemo } from 'react';
import { format, getMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Sun, Snowflake, Flower2, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Badge } from "@/components/ui/badge";

const SEASONS = [
  { value: 'semana_santa', label: 'Semana Santa', months: [2, 3], icon: Flower2, color: '#f59e0b' },
  { value: 'verano', label: 'Verano', months: [5, 6, 7], icon: Sun, color: '#ef4444' },
  { value: 'navidad', label: 'Navidad / Año Nuevo', months: [11, 0], icon: Snowflake, color: '#3b82f6' },
  { value: 'puentes', label: 'Puentes', months: [10, 1, 4], icon: Leaf, color: '#22c55e' },
];

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899'];

export default function SeasonalityChart({ soldTrips, allSoldTrips }) {
  // Sales by travel month
  const salesByTravelMonth = useMemo(() => {
    const months = Array(12).fill(null).map((_, i) => ({ 
      name: MONTH_NAMES[i], 
      month: i,
      trips: 0, 
      total: 0 
    }));
    
    soldTrips.forEach(t => {
      if (t.start_date) {
        const month = getMonth(parseISO(t.start_date));
        months[month].trips += 1;
        months[month].total += t.total_price || 0;
      }
    });
    
    return months;
  }, [soldTrips]);

  // Sales by sale month
  const salesBySaleMonth = useMemo(() => {
    const months = Array(12).fill(null).map((_, i) => ({ 
      name: MONTH_NAMES[i], 
      month: i,
      trips: 0, 
      total: 0 
    }));
    
    soldTrips.forEach(t => {
      if (t.created_date) {
        const month = getMonth(parseISO(t.created_date));
        months[month].trips += 1;
        months[month].total += t.total_price || 0;
      }
    });
    
    return months;
  }, [soldTrips]);

  // Season counts
  const seasonCounts = useMemo(() => {
    const counts = SEASONS.map(s => ({ ...s, trips: 0, total: 0 }));
    const otherCount = { value: 'otro', label: 'Otras fechas', trips: 0, total: 0, color: '#6b7280' };
    
    soldTrips.forEach(t => {
      if (t.start_date) {
        const month = getMonth(parseISO(t.start_date));
        let assigned = false;
        
        counts.forEach(season => {
          if (season.months.includes(month)) {
            season.trips += 1;
            season.total += t.total_price || 0;
            assigned = true;
          }
        });
        
        if (!assigned) {
          otherCount.trips += 1;
          otherCount.total += t.total_price || 0;
        }
      }
    });
    
    return [...counts, otherCount].filter(s => s.trips > 0);
  }, [soldTrips]);

  // Detailed trip list by season
  const tripsBySeason = useMemo(() => {
    const grouped = {};
    SEASONS.forEach(s => grouped[s.value] = []);
    grouped['otro'] = [];
    
    soldTrips.forEach(t => {
      if (t.start_date) {
        const month = getMonth(parseISO(t.start_date));
        let assigned = false;
        
        SEASONS.forEach(season => {
          if (season.months.includes(month)) {
            grouped[season.value].push(t);
            assigned = true;
          }
        });
        
        if (!assigned) {
          grouped['otro'].push(t);
        }
      }
    });
    
    return grouped;
  }, [soldTrips]);

  return (
    <div className="space-y-6">
      {/* Season Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {seasonCounts.map(season => {
          const Icon = season.icon || Calendar;
          return (
            <div key={season.value} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${season.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: season.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-stone-800">{season.trips}</p>
              <p className="text-xs text-stone-500">{season.label}</p>
              <p className="text-xs font-medium mt-1" style={{ color: season.color }}>
                ${season.total.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Travel Month Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Viajes por Mes de Viaje</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByTravelMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'trips' ? 'Viajes' : 'Ventas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="trips" fill="#2E442A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sale Month Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Viajes por Mes de Venta</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySaleMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'trips' ? 'Viajes' : 'Ventas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="trips" fill="#4a7c59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Season Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Distribución por Temporada</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={seasonCounts}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="trips"
                  label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {seasonCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Viajes']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Travel Month */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Ventas por Mes de Viaje (USD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByTravelMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Line type="monotone" dataKey="total" stroke="#2E442A" strokeWidth={2} dot={{ fill: '#2E442A' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-4">Detalle de Viajes por Temporada</h3>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Temporada</th>
                <th className="text-left p-3 font-semibold text-stone-600">Cliente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Destino</th>
                <th className="text-left p-3 font-semibold text-stone-600">Fecha Venta</th>
                <th className="text-left p-3 font-semibold text-stone-600">Fecha Viaje</th>
                <th className="text-right p-3 font-semibold text-stone-600">Precio (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {SEASONS.map(season => (
                tripsBySeason[season.value]?.map(trip => (
                  <tr key={trip.id} className="hover:bg-stone-50">
                    <td className="p-3">
                      <Badge style={{ backgroundColor: `${season.color}20`, color: season.color }}>
                        {season.label}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium text-stone-800">{trip.client_name}</td>
                    <td className="p-3 text-stone-600">{trip.destination}</td>
                    <td className="p-3 text-stone-500">
                      {trip.created_date ? format(parseISO(trip.created_date), 'd MMM yy', { locale: es }) : '-'}
                    </td>
                    <td className="p-3 text-stone-500">
                      {trip.start_date ? format(parseISO(trip.start_date), 'd MMM yy', { locale: es }) : '-'}
                    </td>
                    <td className="p-3 text-right font-medium text-stone-800">
                      ${(trip.total_price || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ))}
              {tripsBySeason['otro']?.map(trip => (
                <tr key={trip.id} className="hover:bg-stone-50">
                  <td className="p-3">
                    <Badge variant="outline">Otras fechas</Badge>
                  </td>
                  <td className="p-3 font-medium text-stone-800">{trip.client_name}</td>
                  <td className="p-3 text-stone-600">{trip.destination}</td>
                  <td className="p-3 text-stone-500">
                    {trip.created_date ? format(parseISO(trip.created_date), 'd MMM yy', { locale: es }) : '-'}
                  </td>
                  <td className="p-3 text-stone-500">
                    {trip.start_date ? format(parseISO(trip.start_date), 'd MMM yy', { locale: es }) : '-'}
                  </td>
                  <td className="p-3 text-right font-medium text-stone-800">
                    ${(trip.total_price || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}