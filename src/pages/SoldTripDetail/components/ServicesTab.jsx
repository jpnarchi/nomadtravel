import React from 'react';
import { Plus, Package } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from '@/components/ui/EmptyState';
import ServiceCard from './ServiceCard';
import { SERVICE_ICONS, SERVICE_LABELS, SERVICE_COLORS } from '../constants/serviceConstants';

export default function ServicesTab({
  services,
  servicesByType,
  supplierPayments,
  currentExchangeRates,
  totalServices,
  totalCommissions,
  onAddService,
  onEditService,
  onDeleteService,
  onUpdateServiceStatus
}) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-stone-100">
      {/* Header */}
      <div className="p-3 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <h3 className="text-sm md:text-base font-bold text-stone-900">Servicios del Viaje</h3>
          <Button
            size="sm"
            onClick={onAddService}
            className="rounded-lg text-white text-xs h-8 w-full md:w-auto"
            style={{ backgroundColor: '#2E442A' }}
          >
            <Plus className="w-3 h-3 mr-1" /> Agregar Servicio
          </Button>
        </div>
      </div>

      {/* Content */}
      {services.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin servicios"
          description="Agrega los servicios incluidos en este viaje"
          actionLabel="Agregar Servicio"
          onAction={onAddService}
        />
      ) : (
        <div className="p-4 space-y-6">
          {Object.entries(servicesByType).map(([type, typeServices]) => {
            const Icon = SERVICE_ICONS[type] || Package;
            const colors = SERVICE_COLORS[type] || SERVICE_COLORS.otro;

            return (
              <div key={type} className="space-y-2">
                {/* Type Header */}
                <div className="flex items-center gap-2 pb-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{SERVICE_LABELS[type]}s</h4>
                  <Badge className={`${colors.bg} ${colors.text} border-0 text-xs px-1.5 py-0.5 font-medium`}>
                    {typeServices.length}
                  </Badge>
                </div>

                {/* Services List */}
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {typeServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        supplierPayments={supplierPayments}
                        currentExchangeRates={currentExchangeRates}
                        onEdit={() => onEditService(service)}
                        onDelete={() => onDeleteService(service)}
                        onUpdateStatus={onUpdateServiceStatus}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {services.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-stone-50 to-white border-t border-stone-100">
          <div className="flex justify-end gap-8">
            <div className="text-right">
              <p className="text-xs text-stone-500 mb-0.5">Total Servicios</p>
              <p className="text-lg font-bold" style={{ color: '#2E442A' }}>
                ${totalServices.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500 mb-0.5">Total Comisiones</p>
              <p className="text-lg font-bold text-emerald-600">
                ${totalCommissions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
