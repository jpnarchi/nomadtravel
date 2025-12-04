import React, { useMemo } from 'react';
import { Heart, Users, Compass, Utensils, Briefcase, Camera, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TRIP_TYPES = [
  { value: 'honeymoon', label: 'Honeymoon', keywords: ['luna de miel', 'honeymoon', 'luna', 'boda'], icon: Heart, color: '#ec4899' },
  { value: 'anniversary', label: 'Aniversario', keywords: ['aniversario', 'anniversary'], icon: Sparkles, color: '#f59e0b' },
  { value: 'family', label: 'Vacaciones Familiares', keywords: ['familiar', 'familia', 'niños', 'kids', 'family'], icon: Users, color: '#3b82f6' },
  { value: 'friends', label: 'Viaje de Amigas', keywords: ['amigas', 'amigos', 'friends', 'girls trip'], icon: Users, color: '#8b5cf6' },
  { value: 'adventure', label: 'Aventura', keywords: ['aventura', 'adventure', 'extremo', 'safari'], icon: Compass, color: '#22c55e' },
  { value: 'foodie', label: 'Foodie', keywords: ['foodie', 'gastronómico', 'gastronomia', 'culinary'], icon: Utensils, color: '#f97316' },
  { value: 'culture', label: 'Cultura', keywords: ['cultura', 'cultural', 'history', 'historia', 'arte'], icon: Camera, color: '#6366f1' },
  { value: 'business', label: 'Negocio', keywords: ['negocio', 'business', 'trabajo', 'corporate'], icon: Briefcase, color: '#64748b' },
  { value: 'romantic', label: 'Romántico', keywords: ['romántico', 'romantic', 'pareja', 'couple'], icon: Heart, color: '#e11d48' },
  { value: 'relax', label: 'Relax / Wellness', keywords: ['relax', 'wellness', 'spa', 'descanso'], icon: Sparkles, color: '#14b8a6' },
];

const COLORS = ['#ec4899', '#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#6366f1', '#64748b', '#e11d48', '#14b8a6'];

export default function TripTypesChart({ soldTrips, trips }) {
  // Classify trips by type based on mood/name
  const tripTypeCounts = useMemo(() => {
    const counts = {};
    TRIP_TYPES.forEach(t => counts[t.value] = { ...t, count: 0, total: 0 });
    counts['other'] = { value: 'other', label: 'Otros', count: 0, total: 0, color: '#9ca3af' };

    // Create a map of trip_id to mood from trips
    const tripMoods = {};
    trips.forEach(t => {
      if (t.id && t.mood) {
        tripMoods[t.id] = t.mood.toLowerCase();
      }
      if (t.id && t.trip_name) {
        tripMoods[t.id] = (tripMoods[t.id] || '') + ' ' + t.trip_name.toLowerCase();
      }
    });

    soldTrips.forEach(st => {
      const mood = tripMoods[st.trip_id] || '';
      let classified = false;

      for (const type of TRIP_TYPES) {
        if (type.keywords.some(k => mood.includes(k))) {
          counts[type.value].count += 1;
          counts[type.value].total += st.total_price || 0;
          classified = true;
          break;
        }
      }

      if (!classified) {
        counts['other'].count += 1;
        counts['other'].total += st.total_price || 0;
      }
    });

    return Object.values(counts).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
  }, [soldTrips, trips]);

  if (tripTypeCounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center">
        <Heart className="w-12 h-12 mx-auto mb-3 text-stone-300" />
        <p className="text-stone-500">No hay datos de tipos de viaje</p>
        <p className="text-xs text-stone-400 mt-2">Agrega el "mood" a tus viajes para clasificarlos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {tripTypeCounts.slice(0, 10).map(type => {
          const Icon = type.icon || Sparkles;
          return (
            <div key={type.value} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: type.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-stone-800">{type.count}</p>
              <p className="text-xs text-stone-500 truncate">{type.label}</p>
              <p className="text-xs font-medium mt-1" style={{ color: type.color }}>
                ${type.total.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Viajes por Tipo</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripTypeCounts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={120} />
                <Tooltip 
                  formatter={(value) => [value, 'Viajes']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {tripTypeCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Distribución por Tipo</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tripTypeCounts}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {tripTypeCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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
      </div>

      {/* Revenue by Type */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-4">Ventas por Tipo de Viaje (USD)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tripTypeCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {tripTypeCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}