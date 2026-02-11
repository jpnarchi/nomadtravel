import React, { memo } from 'react';
import { Plus, Package } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import EmptyState from '@/components/ui/EmptyState';
import ServiceCard from './ServiceCard';
import { SERVICE_ICONS, SERVICE_LABELS, SERVICE_COLORS } from '../constants/serviceConstants';

// Memoized Service Type Section
const ServiceTypeSection = memo(({ type, typeServices, supplierPayments, currentExchangeRates, onEditService, onDeleteService, onUpdateServiceStatus }) => {
  const Icon = SERVICE_ICONS[type] || Package;
  const colors = SERVICE_COLORS[type] || SERVICE_COLORS.otro;

  return (
    <div className="space-y-3">
      {/* Type Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-stone-100">
        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center ${colors.bg} shadow-md group-hover:shadow-lg transition-shadow`}>
          <Icon className={`w-5 h-5 md:w-5.5 md:h-5.5 ${colors.text}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-stone-900 text-base md:text-lg tracking-tight">{SERVICE_LABELS[type]}s</h4>
          <p className="text-xs text-stone-500">{typeServices.length} servicio{typeServices.length !== 1 ? 's' : ''}</p>
        </div>
        <Badge className={`${colors.bg} ${colors.text} border-0 text-xs px-2.5 py-1 font-bold shadow-sm`}>
          {typeServices.length}
        </Badge>
      </div>

      {/* Services List */}
      <div className="space-y-2 md:space-y-3">
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
});

ServiceTypeSection.displayName = 'ServiceTypeSection';

// Memoized Summary Card with Gradient
const SummaryCard = memo(({ totalServices, totalCommissions }) => (
  <div className="p-4 md:p-5 bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-t border-stone-200">
    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-6 md:gap-8">
      <div className="text-center sm:text-right">
        <p className="text-xs md:text-sm text-stone-600 mb-1 font-semibold uppercase tracking-wide">Total Servicios</p>
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center shadow-md">
            <Package className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-stone-900">
            ${totalServices.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="h-12 w-px bg-stone-200 hidden sm:block"></div>
      <div className="text-center sm:text-right">
        <p className="text-xs md:text-sm text-stone-600 mb-1 font-semibold uppercase tracking-wide">Total Comisiones</p>
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            ${totalCommissions.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  </div>
));

SummaryCard.displayName = 'SummaryCard';

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
    <Card className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-stone-200 overflow-hidden">
      {/* Header with Gradient */}
      <div className="p-4 md:p-5 border-b border-stone-200 bg-gradient-to-r from-stone-50 via-white to-stone-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-stone-900 tracking-tight">Servicios del Viaje</h3>
            <p className="text-xs md:text-sm text-stone-500 mt-1">
              {services.length} servicio{services.length !== 1 ? 's' : ''} •
              Total: <span className="font-bold text-stone-700">${totalServices.toLocaleString()}</span>
            </p>
          </div>
          <Button
            size="sm"
            onClick={onAddService}
            className="rounded-xl text-white text-xs md:text-sm h-9 md:h-10 px-4 md:px-5 w-full sm:w-auto shadow-md hover:shadow-lg transition-all font-semibold"
            style={{ backgroundColor: '#2E442A' }}
          >
            <Plus className="w-4 h-4 md:w-4.5 md:h-4.5 mr-2" /> Agregar Servicio
          </Button>
        </div>
      </div>

      {/* Content */}
      {services.length === 0 ? (
        <div className="py-12 md:py-16">
          <EmptyState
            icon={Package}
            title="Sin servicios agregados"
            description="Comienza agregando los servicios incluidos en este viaje"
            actionLabel="Agregar Primer Servicio"
            onAction={onAddService}
          />
        </div>
      ) : (
        <div className="p-4 md:p-5 space-y-6 md:space-y-8 bg-gradient-to-b from-white to-stone-50/30">
          {Object.entries(servicesByType).map(([type, typeServices]) => (
            <ServiceTypeSection
              key={type}
              type={type}
              typeServices={typeServices}
              supplierPayments={supplierPayments}
              currentExchangeRates={currentExchangeRates}
              onEditService={onEditService}
              onDeleteService={onDeleteService}
              onUpdateServiceStatus={onUpdateServiceStatus}
            />
          ))}
        </div>
      )}

      {/* Summary with Visual Impact */}
      {services.length > 0 && (
        <SummaryCard totalServices={totalServices} totalCommissions={totalCommissions} />
      )}
    </Card>
  );
}
