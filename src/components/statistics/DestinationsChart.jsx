import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2E442A', '#3d5a37', '#4a7c59', '#5d9b6f', '#78b086', '#94c69e', '#b1dbb7', '#cff0d1'];

export default function DestinationsChart({ soldTrips, services }) {
  // Count destinations (regions)
  const destinationCounts = useMemo(() => {
    const counts = {};
    soldTrips.forEach(t => {
      if (t.destination) {
        t.destination.split(', ').forEach(d => {
          counts[d] = (counts[d] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [soldTrips]);

  // Count cities from hotels
  const cityCounts = useMemo(() => {
    const counts = {};
    services.forEach(s => {
      if (s.hotel_city) {
        counts[s.hotel_city] = (counts[s.hotel_city] || 0) + 1;
      }
      if (s.tour_city) {
        counts[s.tour_city] = (counts[s.tour_city] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [services]);

  // Revenue by destination
  const revenueByDestination = useMemo(() => {
    const revenue = {};
    soldTrips.forEach(t => {
      if (t.destination && t.total_price) {
        t.destination.split(', ').forEach(d => {
          revenue[d] = (revenue[d] || 0) + t.total_price;
        });
      }
    });
    return Object.entries(revenue)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [soldTrips]);

  if (destinationCounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-stone-300" />
        <p className="text-stone-500">No hay datos de destinos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regions Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Regiones Más Vendidas</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={destinationCounts.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#2E442A"
                  dataKey="count"
                  label={({ name, percent }) => `${name.substring(0, 15)} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {destinationCounts.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Revenue by Destination */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Ventas por Destino (USD)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDestination} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="total" fill="#2E442A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Destinations Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-4">Todas las Regiones</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Región</th>
                <th className="text-right p-3 font-semibold text-stone-600">Viajes</th>
                <th className="text-right p-3 font-semibold text-stone-600">% del Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {destinationCounts.map((dest, i) => (
                <tr key={dest.name} className="hover:bg-stone-50">
                  <td className="p-3 font-medium text-stone-800">{dest.name}</td>
                  <td className="p-3 text-right text-stone-600">{dest.count}</td>
                  <td className="p-3 text-right text-stone-500">
                    {((dest.count / soldTrips.length) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cities */}
      {cityCounts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Ciudades Más Reservadas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value) => [value, 'Reservas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="count" fill="#4a7c59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}