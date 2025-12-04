import React, { useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PROVIDER_LABELS = {
  virtuoso: 'Virtuoso',
  preferred_partner: 'Preferred Partner',
  tbo: 'TBO',
  expedia_taap: 'Expedia TAAP',
  ratehawk: 'RateHawk',
  tablet_hotels: 'Tablet Hotels',
  dmc: 'DMC',
  otro: 'Otro',
};

const CONSOLIDATOR_LABELS = {
  ytc: 'YTC',
  directo: 'Directo',
  ez_travel: 'EZ Travel',
  lozano_travel: 'Lozano Travel',
  consofly: 'Consofly',
};

const COLORS = ['#2E442A', '#3d5a37', '#4a7c59', '#5d9b6f', '#78b086', '#94c69e', '#b1dbb7', '#cff0d1'];

export default function ProvidersChart({ services }) {
  // Count by reserved_by (for hotels)
  const providerCounts = useMemo(() => {
    const counts = {};
    
    services.filter(s => s.reserved_by).forEach(s => {
      const provider = s.reserved_by;
      if (!counts[provider]) {
        counts[provider] = { 
          name: PROVIDER_LABELS[provider] || provider, 
          value: provider,
          count: 0, 
          total: 0, 
          commission: 0 
        };
      }
      counts[provider].count += 1;
      counts[provider].total += s.total_price || 0;
      counts[provider].commission += s.commission || 0;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [services]);

  // Count by flight_consolidator
  const consolidatorCounts = useMemo(() => {
    const counts = {};
    
    services.filter(s => s.flight_consolidator).forEach(s => {
      const consolidator = s.flight_consolidator;
      if (!counts[consolidator]) {
        counts[consolidator] = { 
          name: CONSOLIDATOR_LABELS[consolidator] || consolidator, 
          value: consolidator,
          count: 0, 
          total: 0 
        };
      }
      counts[consolidator].count += 1;
      counts[consolidator].total += s.total_price || 0;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [services]);

  // Count by booked_by
  const bookedByCounts = useMemo(() => {
    const counts = {};
    
    services.filter(s => s.booked_by).forEach(s => {
      const bookedBy = s.booked_by;
      if (!counts[bookedBy]) {
        counts[bookedBy] = { 
          name: bookedBy === 'montecito' ? 'Montecito' : 'IATA Nomad', 
          value: bookedBy,
          count: 0, 
          total: 0 
        };
      }
      counts[bookedBy].count += 1;
      counts[bookedBy].total += s.total_price || 0;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [services]);

  if (providerCounts.length === 0 && consolidatorCounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-stone-300" />
        <p className="text-stone-500">No hay datos de proveedores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-2xl font-bold text-stone-800">{providerCounts.length}</p>
          <p className="text-xs text-stone-500">Proveedores hotel</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-2xl font-bold text-stone-800">{consolidatorCounts.length}</p>
          <p className="text-xs text-stone-500">Consolidadores vuelo</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-2xl font-bold text-stone-800">
            ${services.reduce((sum, s) => sum + (s.total_price || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-stone-500">Total servicios (USD)</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-2xl font-bold text-stone-800">
            ${services.reduce((sum, s) => sum + (s.commission || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-stone-500">Comisiones (USD)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotel Providers */}
        {providerCounts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-4">Proveedores de Hotel</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerCounts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip 
                    formatter={(value) => [value, 'Reservas']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                  />
                  <Bar dataKey="count" fill="#2E442A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Provider Pie */}
        {providerCounts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-4">Distribución Proveedores Hotel</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerCounts}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {providerCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Reservas']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Flight Consolidators */}
        {consolidatorCounts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-4">Consolidadores de Vuelo</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consolidatorCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
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

        {/* Booked By */}
        {bookedByCounts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-4">Bookeado Por</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookedByCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {bookedByCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Reservas']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Provider Revenue */}
      {providerCounts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Ventas por Proveedor (USD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="total" fill="#3d5a37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-4">Resumen por Proveedor</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Proveedor</th>
                <th className="text-right p-3 font-semibold text-stone-600">Reservas</th>
                <th className="text-right p-3 font-semibold text-stone-600">Total (USD)</th>
                <th className="text-right p-3 font-semibold text-stone-600">Comisión (USD)</th>
                <th className="text-right p-3 font-semibold text-stone-600">% Comisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {providerCounts.map((provider, i) => (
                <tr key={i} className="hover:bg-stone-50">
                  <td className="p-3 font-medium text-stone-800">{provider.name}</td>
                  <td className="p-3 text-right text-stone-600">{provider.count}</td>
                  <td className="p-3 text-right text-stone-600">${provider.total.toLocaleString()}</td>
                  <td className="p-3 text-right font-medium" style={{ color: '#2E442A' }}>
                    ${provider.commission.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-stone-500">
                    {provider.total > 0 ? ((provider.commission / provider.total) * 100).toFixed(1) : 0}%
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