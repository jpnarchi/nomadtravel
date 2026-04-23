import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { SERVICE_ICONS } from '../constants/serviceConstants';
import { getServiceDetails } from '../utils/serviceUtils';

export default function PaymentAlerts({ alerts }) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
         style={{ border: '1px solid rgba(220,38,38,0.15)', boxShadow: '0 1px 3px rgba(220,38,38,0.06)' }}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3"
           style={{ background: '#FEF2F2', borderBottom: '1px solid rgba(220,38,38,0.1)' }}>
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
             style={{ background: '#FEE2E2' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        </div>
        <p className="text-xs font-semibold text-red-800">
          Pagos pendientes a proveedores
        </p>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ background: '#FEE2E2', color: '#991B1B' }}>
          {alerts.length}
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        {alerts.map((service) => {
          const Icon = SERVICE_ICONS[service.service_type] || Package;
          const details = getServiceDetails(service);
          const overdue = service.isOverdue;
          const soon = !overdue && service.daysUntilDue <= 7;

          return (
            <div key={service.id} className="flex items-center gap-3 px-4 py-3">
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: overdue ? '#FEE2E2' : soon ? '#FFF7ED' : '#FEFCE8' }}>
                <Icon className="w-4 h-4"
                      style={{ color: overdue ? '#DC2626' : soon ? '#EA580C' : '#CA8A04' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1C1C1E' }}>{details.title}</p>
                <p className="text-xs truncate" style={{ color: '#AEAEB2' }}>{details.subtitle}</p>
              </div>

              {/* Amount + days */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold" style={{ color: '#2D4629' }}>
                  ${(service.total_price || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md"
                      style={{
                        background: overdue ? '#FEE2E2' : soon ? '#FFF7ED' : '#FEFCE8',
                        color: overdue ? '#991B1B' : soon ? '#9A3412' : '#854D0E',
                      }}>
                  {overdue
                    ? `${Math.abs(service.daysUntilDue)}d vencido`
                    : service.daysUntilDue === 0
                      ? 'Hoy'
                      : `${service.daysUntilDue}d`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
