import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = '#2E442A' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight" style={{ color }}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-stone-400 mt-2">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-3">
              <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-stone-400">vs mes anterior</span>
            </div>
          )}
        </div>
        {Icon && (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}