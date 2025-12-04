import React from 'react';
import { motion } from 'framer-motion';

const STAGES = [
  { key: 'nuevo', label: 'Nuevo', color: '#3b82f6' },
  { key: 'cotizando', label: 'Cotizando', color: '#eab308' },
  { key: 'propuesta_enviada', label: 'Propuesta', color: '#a855f7' },
  { key: 'aceptado', label: 'Aceptado', color: '#22c55e' },
  { key: 'vendido', label: 'Vendido', color: '#2E442A' },
  { key: 'perdido', label: 'Perdido', color: '#ef4444' }
];

export default function FunnelChart({ trips }) {
  const stageCounts = STAGES.map(stage => ({
    ...stage,
    count: trips.filter(t => t.stage === stage.key).length
  }));

  const maxCount = Math.max(...stageCounts.map(s => s.count), 1);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
      <h3 className="text-lg font-semibold text-stone-800 mb-6">Embudo de Ventas</h3>
      
      <div className="space-y-4">
        {stageCounts.map((stage, index) => (
          <div key={stage.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-600">{stage.label}</span>
              <span className="text-sm font-bold" style={{ color: stage.color }}>
                {stage.count}
              </span>
            </div>
            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stage.count / maxCount) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: stage.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Total viajes activos</span>
          <span className="font-bold" style={{ color: '#2E442A' }}>
            {trips.length}
          </span>
        </div>
      </div>
    </div>
  );
}