import React, { useMemo } from 'react';
import { format, getMonth, getYear, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Users, Plane, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function GeneralStats({ soldTrips, services, clients, allSoldTrips }) {
  // Total trips sold
  const totalTrips = soldTrips.length;

  // Total sold
  const totalSold = soldTrips.reduce((sum, t) => sum + (t.total_price || 0), 0);

  // Total commission
  const totalCommission = soldTrips.reduce((sum, t) => sum + (t.total_commission || 0), 0);

  // Average ticket
  const avgTicket = totalTrips > 0 ? totalSold / totalTrips : 0;

  // Sales by month
  const salesByMonth = useMemo(() => {
    const months = {};
    soldTrips.forEach(t => {
      if (t.created_date) {
        const date = parseISO(t.created_date);
        const key = format(date, 'MMM yy', { locale: es });
        const monthNum = getMonth(date) + getYear(date) * 12;
        if (!months[key]) {
          months[key] = { name: key, total: 0, trips: 0, monthNum };
        }
        months[key].total += t.total_price || 0;
        months[key].trips += 1;
      }
    });
    return Object.values(months).sort((a, b) => a.monthNum - b.monthNum);
  }, [soldTrips]);

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

  // Sales by year
  const salesByYear = useMemo(() => {
    const years = {};
    allSoldTrips.forEach(t => {
      if (t.created_date) {
        const year = getYear(parseISO(t.created_date));
        if (!years[year]) {
          years[year] = { name: year.toString(), total: 0, trips: 0 };
        }
        years[year].total += t.total_price || 0;
        years[year].trips += 1;
      }
    });
    return Object.values(years).sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [allSoldTrips]);

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
    </div>
  );
}