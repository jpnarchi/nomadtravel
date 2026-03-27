import React, { useMemo } from 'react';
import { format, getMonth, getYear, parseISO } from 'date-fns';
import { parseLocalDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { TrendingUp, Users, Plane, DollarSign, Calendar, Hotel } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2E442A', '#3d5a37', '#4a7c59', '#5d9b6f', '#78b086', '#94c69e', '#b1dbb7', '#cff0d1'];

export default function GeneralStats({ soldTrips, services, clients, allSoldTrips, clientPayments = [] }) {
  // Total trips sold
  const totalTrips = soldTrips.length;

  // Total sold - computed from services (same as SoldTrips.jsx)
  const totalSold = useMemo(() => {
    const tripIds = new Set(soldTrips.map(t => t.id));
    return services
      .filter(s => tripIds.has(s.sold_trip_id))
      .reduce((sum, s) => sum + (s.price || 0), 0);
  }, [soldTrips, services]);

  // Total commission - computed from services
  const totalCommission = useMemo(() => {
    const tripIds = new Set(soldTrips.map(t => t.id));
    return services
      .filter(s => tripIds.has(s.sold_trip_id))
      .reduce((sum, s) => sum + (s.commission || 0), 0);
  }, [soldTrips, services]);

  // Average ticket
  const avgTicket = totalTrips > 0 ? totalSold / totalTrips : 0;

  // Sales by month - using start_date (travel date) and services total
  const salesByMonth = useMemo(() => {
    const months = {};
    soldTrips.forEach(t => {
      if (t.start_date) {
        const date = parseLocalDate(t.start_date);
        if (!date) return;
        const key = format(date, 'MMM yy', { locale: es });
        const monthNum = getMonth(date) + getYear(date) * 12;
        if (!months[key]) {
          months[key] = { name: key, total: 0, trips: 0, monthNum };
        }
        const tripServices = services.filter(s => s.sold_trip_id === t.id);
        const tripTotal = tripServices.reduce((sum, s) => sum + (s.price || 0), 0);
        months[key].total += tripTotal;
        months[key].trips += 1;
      }
    });
    return Object.values(months).sort((a, b) => a.monthNum - b.monthNum);
  }, [soldTrips, services]);

  // New clients by month
  const clientsByMonth = useMemo(() => {
    const months = {};
    clients.forEach(c => {
      if (c.created_date) {
        const date = parseISO(c.created_date);
        const key = format(date, 'MMM yy', { locale: es });
        const monthNum = getMonth(date) + getYear(date) * 12;
        if (!months[key]) {
          months[key] = { name: key, count: 0, monthNum };
        }
        months[key].count += 1;
      }
    });
    return Object.values(months).sort((a, b) => a.monthNum - b.monthNum);
  }, [clients]);

  // Sales by year - using start_date (travel date) and services total
  const salesByYear = useMemo(() => {
    const years = {};
    allSoldTrips.forEach(t => {
      if (t.start_date) {
        const date = parseLocalDate(t.start_date);
        if (!date) return;
        const year = getYear(date);
        if (!years[year]) {
          years[year] = { name: year.toString(), total: 0, trips: 0 };
        }
        const tripServices = services.filter(s => s.sold_trip_id === t.id);
        const tripTotal = tripServices.reduce((sum, s) => sum + (s.price || 0), 0);
        years[year].total += tripTotal;
        years[year].trips += 1;
      }
    });
    return Object.values(years).sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [allSoldTrips, services]);

  // Hotel chains most sold
  const hotelChainCounts = useMemo(() => {
    const counts = {};
    services.filter(s => s.service_type === 'hotel' && s.hotel_chain).forEach(s => {
      const chain = s.hotel_chain;
      if (!counts[chain]) counts[chain] = { name: chain, count: 0, total: 0 };
      counts[chain].count += 1;
      counts[chain].total += s.price || 0;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [services]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
              <Plane className="w-5 h-5" style={{ color: '#2E442A' }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">{totalTrips}</p>
          <p className="text-xs text-stone-500">Viajes vendidos</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
              <DollarSign className="w-5 h-5" style={{ color: '#2E442A' }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">${totalSold.toLocaleString()}</p>
          <p className="text-xs text-stone-500">Total vendido (USD)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#2E442A' }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">${totalCommission.toLocaleString()}</p>
          <p className="text-xs text-stone-500">Comisiones (USD)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
              <Calendar className="w-5 h-5" style={{ color: '#2E442A' }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">${avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-stone-500">Ticket promedio (USD)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
              <Users className="w-5 h-5" style={{ color: '#2E442A' }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800">{clients.length}</p>
          <p className="text-xs text-stone-500">Total clientes</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Month */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Ventas por Mes (USD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="total" fill="#2E442A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Year */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Ventas por Año (USD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
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

        {/* Trips by Month */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Viajes Vendidos por Mes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value) => [value, 'Viajes']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Line type="monotone" dataKey="trips" stroke="#2E442A" strokeWidth={2} dot={{ fill: '#2E442A' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Clients by Month */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Clientes Nuevos por Mes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [value, 'Clientes']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="count" fill="#4a7c59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hotel Chains */}
      {hotelChainCounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="w-4 h-4 text-stone-500" />
              <h3 className="font-semibold text-stone-800">Cadenas de Hotel Más Vendidas</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hotelChainCounts.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip
                    formatter={(value) => [value, 'Reservas']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                  />
                  <Bar dataKey="count" fill="#2E442A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="w-4 h-4 text-stone-500" />
              <h3 className="font-semibold text-stone-800">Distribución por Cadena</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hotelChainCounts.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    label={({ name, percent }) => `${name.substring(0, 15)} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {hotelChainCounts.slice(0, 8).map((entry, index) => (
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
      )}
    </div>
  );
}