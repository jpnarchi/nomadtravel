import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Award, TrendingUp, Users, Plane, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AgentComparisonStats({ soldTrips, allUsers }) {
  const agents = allUsers.filter(u => u.role === 'user');

  const agentStats = useMemo(() => {
    return agents.map(agent => {
      const agentTrips = soldTrips.filter(t => t.created_by === agent.email);
      const totalSales = agentTrips.reduce((sum, t) => sum + (t.total_price || 0), 0);
      const totalCommission = agentTrips.reduce((sum, t) => sum + (t.total_commission || 0), 0);
      const avgTicket = agentTrips.length > 0 ? totalSales / agentTrips.length : 0;

      return {
        name: agent.full_name,
        email: agent.email,
        trips: agentTrips.length,
        sales: totalSales,
        commission: totalCommission,
        avgTicket: avgTicket
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [agents, soldTrips]);

  const topPerformers = agentStats.slice(0, 5);
  const chartData = agentStats.map(a => ({
    name: a.name.split(' ')[0],
    Ventas: a.sales,
    Comisión: a.commission,
    Viajes: a.trips * 1000
  }));

  return (
    <div className="space-y-6">
      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {topPerformers.slice(0, 3).map((agent, index) => (
          <Card key={agent.email} className="p-6 relative overflow-hidden">
            <div 
              className="absolute top-0 right-0 w-24 h-24 opacity-10"
              style={{
                background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
              }}
            />
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl"
                style={{ 
                  backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' 
                }}
              >
                {index + 1}
              </div>
              <div>
                <h3 className="font-bold text-stone-800">{agent.name}</h3>
                <p className="text-xs text-stone-500">{agent.trips} viajes vendidos</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-stone-500">Total Ventas</p>
                <p className="text-2xl font-bold" style={{ color: '#2E442A' }}>
                  ${agent.sales.toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <p className="text-xs text-stone-500">Comisión</p>
                  <p className="text-sm font-semibold text-green-600">
                    ${agent.commission.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Ticket Prom.</p>
                  <p className="text-sm font-semibold text-stone-800">
                    ${agent.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* All Agents Table */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" style={{ color: '#2E442A' }} />
          Estadísticas por Agente
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Ranking</th>
                <th className="text-left p-3 font-semibold text-stone-600">Agente</th>
                <th className="text-right p-3 font-semibold text-stone-600">Viajes</th>
                <th className="text-right p-3 font-semibold text-stone-600">Total Ventas</th>
                <th className="text-right p-3 font-semibold text-stone-600">Comisión</th>
                <th className="text-right p-3 font-semibold text-stone-600">Ticket Prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {agentStats.map((agent, index) => (
                <tr key={agent.email} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ 
                        backgroundColor: index < 3 
                          ? (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32')
                          : '#2E442A'
                      }}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-stone-800">{agent.name}</p>
                    <p className="text-xs text-stone-500">{agent.email}</p>
                  </td>
                  <td className="p-3 text-right font-semibold text-stone-800">
                    {agent.trips}
                  </td>
                  <td className="p-3 text-right font-semibold" style={{ color: '#2E442A' }}>
                    ${agent.sales.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-semibold text-green-600">
                    ${agent.commission.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-stone-600">
                    ${agent.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comparison Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#2E442A' }} />
          Comparación de Desempeño
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#78716c" style={{ fontSize: '12px' }} />
            <YAxis stroke="#78716c" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="Ventas" fill="#2E442A" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Comisión" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-stone-500 mt-2 text-center">
          * Eje Y representa valores en USD. Los viajes se multiplican por 1000 para visualización.
        </p>
      </Card>
    </div>
  );
}