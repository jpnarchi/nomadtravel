import React, { useMemo } from 'react';
import { Hotel } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2E442A', '#3d5a37', '#4a7c59', '#5d9b6f', '#78b086', '#94c69e', '#b1dbb7', '#cff0d1', '#6b7280', '#9ca3af'];

const HOTEL_CHAIN_GROUPS = {
  'Four Seasons': ['four seasons'],
  'Aman': ['aman'],
  'Rosewood': ['rosewood'],
  'Belmond': ['belmond'],
  'Auberge': ['auberge'],
  'One&Only': ['one&only', 'one and only'],
  'SLH': ['slh', 'small luxury hotels'],
  'LHW': ['lhw', 'leading hotels'],
  'Fairmont': ['fairmont'],
  'Hilton': ['hilton', 'waldorf', 'conrad', 'lxr', 'curio', 'doubletree', 'embassy suites'],
  'Marriott': ['marriott', 'ritz-carlton', 'ritz carlton', 'st. regis', 'st regis', 'w hotels', 'edition', 'luxury collection', 'jw marriott', 'westin', 'sheraton'],
  'Hyatt': ['hyatt', 'park hyatt', 'andaz', 'alila', 'thompson'],
  'IHG': ['ihg', 'intercontinental', 'kimpton', 'regent', 'six senses'],
  'Accor': ['accor', 'raffles', 'sofitel', 'fairmont', 'banyan tree'],
};

export default function HotelChainsChart({ services }) {
  // Filter hotel services
  const hotelServices = services.filter(s => s.service_type === 'hotel');

  // Count by chain
  const chainCounts = useMemo(() => {
    const counts = {};
    
    hotelServices.forEach(s => {
      const chain = s.hotel_chain || 'Sin especificar';
      if (!counts[chain]) {
        counts[chain] = { name: chain, count: 0, total: 0, commission: 0 };
      }
      counts[chain].count += 1;
      counts[chain].total += s.total_price || 0;
      counts[chain].commission += s.commission || 0;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [hotelServices]);

  // Count by brand (sub-brands)
  const brandCounts = useMemo(() => {
    const counts = {};
    
    hotelServices.forEach(s => {
      const brand = s.hotel_brand || s.hotel_chain || 'Sin especificar';
      if (!counts[brand]) {
        counts[brand] = { name: brand, count: 0, total: 0 };
      }
      counts[brand].count += 1;
      counts[brand].total += s.total_price || 0;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [hotelServices]);

  // Count by hotel name
  const hotelCounts = useMemo(() => {
    const counts = {};
    
    hotelServices.forEach(s => {
      const name = s.hotel_name || 'Sin especificar';
      if (!counts[name]) {
        counts[name] = { name, count: 0, total: 0, chain: s.hotel_chain || '-' };
      }
      counts[name].count += 1;
      counts[name].total += s.total_price || 0;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [hotelServices]);

  if (hotelServices.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center">
        <Hotel className="w-12 h-12 mx-auto mb-3 text-stone-300" />
        <p className="text-stone-500">No hay datos de hoteles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-2xl font-bold text-stone-800">{hotelServices.length}</p>
          <p className="text-xs text-stone-500">Total reservas hotel</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-2xl font-bold text-stone-800">{chainCounts.length}</p>
          <p className="text-xs text-stone-500">Cadenas diferentes</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-2xl font-bold text-stone-800">
            ${hotelServices.reduce((sum, s) => sum + (s.total_price || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-stone-500">Total vendido (USD)</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <p className="text-2xl font-bold text-stone-800">
            ${hotelServices.reduce((sum, s) => sum + (s.commission || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-stone-500">Comisiones (USD)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chain Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Reservas por Cadena</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chainCounts.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
                <Tooltip 
                  formatter={(value) => [value, 'Reservas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="count" fill="#2E442A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chain Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Distribución por Cadena</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chainCounts.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={({ name, percent }) => `${name.substring(0, 12)} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {chainCounts.slice(0, 8).map((entry, index) => (
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
      </div>

      {/* Revenue by Chain */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-4">Ventas por Cadena (USD)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chainCounts.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
              />
              <Bar dataKey="total" fill="#4a7c59" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Brands Table */}
      {brandCounts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Sub-Marcas / Colecciones</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value) => [value, 'Reservas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="count" fill="#3d5a37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hotels Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-4">Todos los Hoteles</h3>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Hotel</th>
                <th className="text-left p-3 font-semibold text-stone-600">Cadena</th>
                <th className="text-right p-3 font-semibold text-stone-600">Reservas</th>
                <th className="text-right p-3 font-semibold text-stone-600">Total (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {hotelCounts.map((hotel, i) => (
                <tr key={i} className="hover:bg-stone-50">
                  <td className="p-3 font-medium text-stone-800">{hotel.name}</td>
                  <td className="p-3 text-stone-600">{hotel.chain}</td>
                  <td className="p-3 text-right text-stone-600">{hotel.count}</td>
                  <td className="p-3 text-right font-medium text-stone-800">
                    ${hotel.total.toLocaleString()}
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