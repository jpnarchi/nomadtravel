import React from 'react';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = '#2D4629' }) {
  return (
    <div className="bg-white rounded-2xl p-5 transition-all duration-200"
         style={{ border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wide"
           style={{ color: '#AEAEB2', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>
          {title}
        </p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: `${color}18` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold leading-tight"
         style={{ color: '#1C1C1E', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: '#AEAEB2' }}>{subtitle}</p>
      )}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs font-semibold" style={{ color: trend >= 0 ? '#16A34A' : '#DC2626' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-xs" style={{ color: '#AEAEB2' }}>vs mes anterior</span>
        </div>
      )}
    </div>
  );
}
