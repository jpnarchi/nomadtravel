import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfitabilityPanel({ soldTrip, services, clientPayments, supplierPayments }) {
  // Calculate financial metrics
  const revenue = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const cogs = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const commissions = services.reduce((sum, s) => sum + (s.commission || 0), 0);
  const gananciaGruta = revenue - cogs;
  const gananciaNeta = revenue - cogs - commissions;
  const rentabilidad = revenue > 0 ? (gananciaNeta / revenue) * 100 : 0;

  // Profitability indicator
  const getRentabilidadConfig = () => {
    if (rentabilidad >= 15) return { color: 'bg-green-500', label: '🟢 Saludable', textColor: 'text-green-700' };
    if (rentabilidad >= 8) return { color: 'bg-yellow-500', label: '🟡 Medio', textColor: 'text-yellow-700' };
    return { color: 'bg-red-500', label: '🔴 Bajo', textColor: 'text-red-700' };
  };

  const rentabilidadConfig = getRentabilidadConfig();

  // If closed, show snapshot
  if (soldTrip.status_financiero === 'cerrado' && soldTrip.snapshot_financiero) {
    const snap = soldTrip.snapshot_financiero;
    const snapRentabilidad = getRentabilidadConfig();
    
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-stone-50 border-2 border-slate-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Rentabilidad Final del Viaje</h3>
              <p className="text-xs text-slate-500">Viaje cerrado - Solo lectura</p>
            </div>
          </div>
          <Badge className="bg-slate-600 text-white">Cerrado</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Revenue</p>
            <p className="text-lg font-bold text-slate-800">${snap.revenue_final?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">COGS</p>
            <p className="text-lg font-bold text-orange-600">${snap.cogs_final?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Comisiones</p>
            <p className="text-lg font-bold text-blue-600">${snap.comisiones_final?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Ganancia Bruta</p>
            <p className="text-lg font-bold text-emerald-600">${snap.ganancia_bruta?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Ganancia Neta</p>
            <p className="text-lg font-bold text-green-600">${snap.ganancia_neta?.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-300 mb-1">Rentabilidad</p>
            <p className="text-2xl font-bold text-white">{snap.rentabilidad_porcentaje?.toFixed(1)}%</p>
          </div>
        </div>

        {soldTrip.notas_cierre && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-amber-800 mb-1">Notas de Cierre:</p>
            <p className="text-amber-700">{soldTrip.notas_cierre}</p>
          </div>
        )}
      </Card>
    );
  }

  // Active trip - live calculations
  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A' }}>
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800">Rentabilidad del Viaje</h3>
            <p className="text-xs text-stone-500">Cálculo en tiempo real</p>
          </div>
        </div>
        <Badge className={soldTrip.status_financiero === 'en_conciliacion' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}>
          {soldTrip.status_financiero === 'abierto' ? 'Abierto' : 'En Conciliación'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-stone-500 mb-1">Revenue</p>
          <p className="text-lg font-bold text-stone-800">${revenue.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">Total cobrado</p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-stone-500 mb-1">COGS</p>
          <p className="text-lg font-bold text-orange-600">${cogs.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">Costos del viaje</p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-stone-500 mb-1">Comisiones</p>
          <p className="text-lg font-bold text-blue-600">${commissions.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">A agentes</p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-stone-500 mb-1">Ganancia Bruta</p>
          <p className="text-lg font-bold text-emerald-600">${gananciaGruta.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">Revenue - COGS</p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-stone-500 mb-1">Ganancia Neta</p>
          <p className="text-lg font-bold text-green-600">${gananciaNeta.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">Profit final</p>
        </div>
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-lg p-3">
          <p className="text-xs text-stone-300 mb-1">Rentabilidad</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">{rentabilidad.toFixed(1)}%</p>
            {rentabilidad > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <Badge className={`${rentabilidadConfig.color} text-white text-xs mt-1`}>
            {rentabilidadConfig.label}
          </Badge>
        </div>
      </div>

      {rentabilidad < 8 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">⚠️ Rentabilidad baja</p>
            <p className="text-xs mt-1">Este viaje tiene una rentabilidad menor al 8%. Revisa costos y comisiones.</p>
          </div>
        </div>
      )}
    </Card>
  );
}