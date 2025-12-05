import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Plane, Users, TrendingUp, Loader2, Award, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: allTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list()
  });

  const { data: allSoldTrips = [], isLoading: soldLoading } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => base44.entities.SoldTrip.list()
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  // Filter by agent
  const agents = allUsers.filter(u => u.role === 'user');
  const trips = selectedAgent === 'all' ? allTrips : allTrips.filter(t => t.created_by === selectedAgent);
  const soldTrips = selectedAgent === 'all' ? allSoldTrips : allSoldTrips.filter(t => t.created_by === selectedAgent);
  const clients = selectedAgent === 'all' ? allClients : allClients.filter(c => c.created_by === selectedAgent);

  // Calculate monthly stats
  const [year, month] = selectedMonth.split('-');
  const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthEnd = endOfMonth(monthStart);

  const monthlySales = soldTrips
    .filter(trip => {
      const created = new Date(trip.created_date);
      return isWithinInterval(created, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, trip) => sum + (trip.total_price || 0), 0);

  const monthlyCommission = soldTrips
    .filter(trip => {
      const created = new Date(trip.created_date);
      return isWithinInterval(created, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, trip) => sum + (trip.total_commission || 0), 0);

  // High-value trips in quotation
  const highValueTrips = allTrips.filter(trip => 
    trip.stage === 'cotizando' && 
    (trip.budget || 0) > 20000
  ).map(trip => {
    const agent = allUsers.find(u => u.email === trip.created_by);
    return {
      ...trip,
      agentName: agent?.full_name || 'Sin asignar'
    };
  });

  // Top performers
  const agentStats = agents.map(agent => {
    const agentSoldTrips = allSoldTrips.filter(t => t.created_by === agent.email);
    const totalSales = agentSoldTrips.reduce((sum, t) => sum + (t.total_price || 0), 0);
    return {
      name: agent.full_name,
      email: agent.email,
      sales: totalSales,
      trips: agentSoldTrips.length
    };
  }).sort((a, b) => b.sales - a.sales);

  const isLoading = tripsLoading || soldLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-800">Dashboard Global</h1>
          <p className="text-stone-500 mt-1">Vista consolidada de toda la agencia</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = format(date, 'yyyy-MM');
                const label = format(date, 'MMMM yyyy', { locale: es });
                return (
                  <SelectItem key={value} value={value}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los agentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los agentes</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.email} value={agent.email}>
                  {agent.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* High Value Trips Alert */}
      {highValueTrips.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-2">
                ⚡ Oportunidades de Alto Valor en Cotización
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                {highValueTrips.length} {highValueTrips.length === 1 ? 'viaje' : 'viajes'} con presupuesto mayor a $20,000 USD en etapa de cotización:
              </p>
              <div className="space-y-2">
                {highValueTrips.map(trip => (
                  <div key={trip.id} className="bg-white rounded-lg p-3 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-stone-800">{trip.client_name || 'Sin cliente'}</p>
                        <p className="text-sm text-stone-600">{trip.destination}</p>
                        <p className="text-xs text-stone-500 mt-1">Agente: {trip.agentName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">
                          ${(trip.budget || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-500">presupuesto</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas del Mes"
          value={`$${monthlySales.toLocaleString()}`}
          subtitle="USD"
          icon={DollarSign}
        />
        <StatsCard
          title="Comisiones del Mes"
          value={`$${monthlyCommission.toLocaleString()}`}
          subtitle="USD"
          icon={TrendingUp}
        />
        <StatsCard
          title="Viajes Activos"
          value={trips.length}
          subtitle="En proceso"
          icon={Plane}
        />
        <StatsCard
          title="Clientes Totales"
          value={clients.length}
          subtitle="Registrados"
          icon={Users}
        />
      </div>

      {/* Top Performers */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5" style={{ color: '#2E442A' }} />
          <h3 className="text-lg font-bold text-stone-800">Top Performers (Total Histórico)</h3>
        </div>
        <div className="space-y-3">
          {agentStats.slice(0, 5).map((agent, index) => (
            <div key={agent.email} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#2E442A' }}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{agent.name}</p>
                  <p className="text-xs text-stone-500">{agent.trips} viajes vendidos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg" style={{ color: '#2E442A' }}>
                  ${agent.sales.toLocaleString()}
                </p>
                <p className="text-xs text-stone-500">en ventas</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}