import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { SERVICE_ICONS } from '../constants/serviceConstants';
import { getServiceDetails } from '../utils/serviceUtils';

export default function PaymentAlerts({ alerts }) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-md border border-red-200/50">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <div className="w-7 h-7 md:w-8 md:h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-600" />
        </div>
        <h3 className="font-bold text-xs md:text-sm text-red-800">
          Pagos Pendientes ({alerts.length})
        </h3>
      </div>

      <div className="space-y-1.5 md:space-y-2">
        {alerts.map((service) => {
          const Icon = SERVICE_ICONS[service.service_type] || Package;
          const details = getServiceDetails(service);

          return (
            <div
              key={service.id}
              className={`p-2 md:p-3 rounded-lg md:rounded-xl border-2 text-xs transition-all hover:shadow-md ${
                service.isOverdue
                  ? 'bg-red-100/80 border-red-300 hover:bg-red-100'
                  : service.daysUntilDue <= 7
                    ? 'bg-orange-100/80 border-orange-300 hover:bg-orange-100'
                    : 'bg-yellow-100/80 border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    service.isOverdue
                      ? 'bg-red-200'
                      : service.daysUntilDue <= 7
                        ? 'bg-orange-200'
                        : 'bg-yellow-200'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                      service.isOverdue
                        ? 'text-red-700'
                        : service.daysUntilDue <= 7
                          ? 'text-orange-700'
                          : 'text-yellow-700'
                    }`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs md:text-sm text-stone-900 truncate">{details.title}</p>
                    <p className="text-stone-600 text-xs mt-0.5 hidden sm:block">{details.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                  <span className="font-bold text-xs md:text-sm" style={{ color: '#2E442A' }}>
                    ${(service.total_price || 0).toLocaleString()}
                  </span>
                  <Badge className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 font-bold ${
                    service.isOverdue
                      ? 'bg-red-600 text-white'
                      : service.daysUntilDue <= 7
                        ? 'bg-orange-500 text-white'
                        : 'bg-yellow-500 text-white'
                  }`}>
                    {service.isOverdue
                      ? `${Math.abs(service.daysUntilDue)}d vencido`
                      : service.daysUntilDue === 0
                        ? '¡Hoy!'
                        : `${service.daysUntilDue}d`}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
