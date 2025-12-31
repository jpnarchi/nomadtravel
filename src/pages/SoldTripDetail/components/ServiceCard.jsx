import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SERVICE_ICONS, SERVICE_COLORS } from '../constants/serviceConstants';
import { getServiceDetails, calculateExchangeAlert } from '../utils/serviceUtils';

export default function ServiceCard({
  service,
  supplierPayments,
  currentExchangeRates,
  onEdit,
  onDelete,
  onUpdateStatus
}) {
  const Icon = SERVICE_ICONS[service.service_type] || SERVICE_ICONS.otro;
  const colors = SERVICE_COLORS[service.service_type] || SERVICE_COLORS.otro;
  const details = getServiceDetails(service);
  const exchangeAlert = calculateExchangeAlert(service, currentExchangeRates);

  const servicePayments = supplierPayments.filter(p => p.trip_service_id === service.id);
  const paidToSupplier = servicePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const hasNetoPayments = servicePayments.some(p => p.payment_type === 'neto');
  const costToPay = hasNetoPayments
    ? (service.total_price || 0) - (service.commission || 0)
    : (service.total_price || 0);
  const outstanding = Math.max(0, costToPay - paidToSupplier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-stone-200/80 hover:border-stone-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start gap-2 md:gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center ${colors.bg} flex-shrink-0 shadow-sm`}>
          <Icon className={`w-4 h-4 md:w-5 md:h-5 ${colors.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 md:gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-bold text-sm md:text-base text-stone-900 truncate">{details.title}</h4>
                <Select
                  value={service.reservation_status || 'reservado'}
                  onValueChange={(value) => onUpdateStatus(service.id, value)}
                >
                  <SelectTrigger className={`h-6 w-auto text-xs rounded-lg border-0 px-2 font-medium shadow-sm ${
                    service.reservation_status === 'pagado'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : service.reservation_status === 'cancelado'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reservado">Reservado</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs md:text-sm text-stone-600">
                {details.subtitle} {details.extra && `• ${details.extra}`}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 md:h-8 md:w-8 hover:bg-stone-100 flex-shrink-0 rounded-lg"
                >
                  <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Provider Info */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap text-xs mb-2 md:mb-3">
            <span className="text-stone-400 font-medium">Bookeado:</span>
            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md font-medium">
              {service.booked_by === 'montecito' ? 'Montecito' : 'IATA Nomad'}
            </span>

            {(service.reserved_by || service.flight_consolidator || service.cruise_provider || service.train_provider) && (
              <>
                <span className="text-stone-300">•</span>
                <span className="text-stone-400 font-medium">Proveedor:</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-medium">
                  {service.reserved_by || service.flight_consolidator || service.cruise_provider || service.train_provider}
                </span>
              </>
            )}

            {(service.reservation_number || service.flight_reservation_number || service.tour_reservation_number || service.cruise_reservation_number || service.dmc_reservation_number || service.train_reservation_number) && (
              <>
                <span className="text-stone-300">•</span>
                <span className="text-stone-400 font-medium">N° Reserva:</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-mono text-xs">
                  {service.reservation_number || service.flight_reservation_number || service.tour_reservation_number || service.cruise_reservation_number || service.dmc_reservation_number || service.train_reservation_number}
                </span>
              </>
            )}
          </div>

          {/* Notes */}
          {service.notes && (
            <div className="mb-2 md:mb-3 p-2 md:p-3 bg-amber-50 border border-amber-200 rounded-lg md:rounded-xl text-xs text-amber-900">
              {service.notes}
            </div>
          )}

          {/* Exchange Rate Alert */}
          {exchangeAlert && (
            <div className={`mb-2 md:mb-3 p-2 md:p-3 rounded-lg md:rounded-xl border-2 text-xs ${
              exchangeAlert.isGain
                ? 'bg-green-50 border-green-300 text-green-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}>
              <div className="flex items-start gap-2">
                {exchangeAlert.isGain ? (
                  <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <TrendingDown className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold mb-1">
                    {exchangeAlert.isGain ? '¡Tipo de cambio favorable!' : 'Alerta: Tipo de cambio desfavorable'}
                  </p>
                  <p className="mb-1">
                    El tipo de cambio {exchangeAlert.isGain ? 'subió' : 'bajó'} {exchangeAlert.percentage}% desde la cotización.
                  </p>
                  <p className="mb-1">
                    {exchangeAlert.isGain ? 'Ahorrarías' : 'Pagarías'} aprox. <span className="font-bold">${exchangeAlert.usdDifference} USD</span> más si pagas hoy.
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    Cotizado: ${exchangeAlert.originalRate.toFixed(4)} • Actual: ${exchangeAlert.currentRate.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-2 md:gap-3 p-2 md:p-3 bg-stone-50 rounded-lg md:rounded-xl border border-stone-200">
            <div className="text-center">
              <p className="text-xs text-stone-500 mb-0.5 md:mb-1">Total</p>
              <p className="text-sm md:text-base font-bold" style={{ color: '#2E442A' }}>
                ${(service.total_price || 0).toLocaleString()}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-stone-500 mb-0.5 md:mb-1">Comisión</p>
              <p className="text-sm md:text-base font-bold text-emerald-600">
                ${(service.commission || 0).toLocaleString()}
              </p>
            </div>

            {paidToSupplier > 0 && (
              <div className="text-center">
                <p className="text-xs text-stone-500 mb-0.5 md:mb-1">Pagado</p>
                <p className="text-sm md:text-base font-bold text-amber-600">
                  ${paidToSupplier.toLocaleString()}
                </p>
              </div>
            )}

            {outstanding > 0 && (
              <div className="text-center">
                <p className="text-xs text-stone-500 mb-0.5 md:mb-1">Falta</p>
                <p className="text-sm md:text-base font-bold text-orange-600">
                  ${outstanding.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
