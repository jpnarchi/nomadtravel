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
      <div className="p-4 md:p-6 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <h3 className="text-base md:text-lg font-bold text-stone-900">Servicios del Viaje</h3>
          <Button
            size="sm"
            onClick={onAddService}
            className="rounded-xl text-white shadow-md hover:shadow-lg transition-all w-full md:w-auto"
            style={{ backgroundColor: '#2E442A' }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Agregar Servicio
          </Button>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Aquí se agregan todos los servicios del viaje tal como se le venderán al cliente, en precio bruto.
          Incluye la comisión de cada servicio y la fecha estimada en la que se espera recibir esa comisión.
          Si el pago es neto, la comisión se libera al terminar el viaje. Si es por Montecito, la comisión se paga
          aproximadamente 3 meses después de que finaliza el viaje.
        </p>
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
        <div className="p-6 space-y-8">
          {Object.entries(servicesByType).map(([type, typeServices]) => {
            const Icon = SERVICE_ICONS[type] || Package;
            const colors = SERVICE_COLORS[type] || SERVICE_COLORS.otro;

            return (
              <div key={type} className="space-y-3">
                {/* Type Header */}
                <div className="flex items-center gap-3 pb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} shadow-sm`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <h4 className="font-bold text-stone-900 text-base">{SERVICE_LABELS[type]}s</h4>
                  <Badge className={`${colors.bg} ${colors.text} border-0 text-xs px-2 py-1 font-medium`}>
                    {typeServices.length}
                  </Badge>
                </div>

                {/* Services List */}
                <div className="space-y-3">
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
        <div className="p-6 bg-gradient-to-r from-stone-50 to-white border-t border-stone-100">
          <div className="flex justify-end gap-12">
            <div className="text-right">
              <p className="text-xs text-stone-500 mb-1">Total Servicios</p>
              <p className="text-2xl font-bold" style={{ color: '#2E442A' }}>
                ${totalServices.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500 mb-1">Total Comisiones</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${totalCommissions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
