import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function ServiceProfitability({ service, supplierPayments }) {
  const precioVenta = service.total_price || 0;
  const costoReal = supplierPayments
    .filter(p => p.trip_service_id === service.id)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const profit = precioVenta - costoReal;
  const margen = precioVenta > 0 ? (profit / precioVenta) * 100 : 0;

  const getMargenColor = () => {
    if (margen >= 20) return 'text-green-600';
    if (margen >= 10) return 'text-yellow-600';
    if (margen >= 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMargenIcon = () => {
    if (margen > 0) return <TrendingUp className="w-3 h-3" />;
    if (margen < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
      <div>
        <p className="text-stone-400">Venta</p>
        <p className="font-semibold" style={{ color: '#2E442A' }}>${precioVenta.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-stone-400">Costo</p>
        <p className="font-semibold text-orange-600">${costoReal.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-stone-400">Profit</p>
        <p className={`font-semibold ${getMargenColor()}`}>${profit.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-stone-400">Margen</p>
        <div className="flex items-center gap-1">
          <span className={`font-semibold ${getMargenColor()}`}>{margen.toFixed(1)}%</span>
          <span className={getMargenColor()}>{getMargenIcon()}</span>
        </div>
      </div>
    </div>
  );
}