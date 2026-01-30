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

  const reservationNumber = service.reservation_number || service.flight_reservation_number || service.tour_reservation_number || service.cruise_reservation_number || service.dmc_reservation_number || service.train_reservation_number;
  const provider = service.reserved_by || service.flight_consolidator || service.cruise_provider || service.train_provider || 'preferred_partner';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="bg-white p-2 rounded-lg border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-2">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-bold text-sm text-stone-900 truncate">{details.title}</h4>
            <Select
              value={service.reservation_status || 'reservado'}
              onValueChange={(value) => onUpdateStatus(service.id, value)}
            >
              <SelectTrigger className={`h-5 w-auto text-xs rounded border-0 px-1.5 font-medium ${
                service.reservation_status === 'pagado'
                  ? 'bg-green-100 text-green-700'
                  : service.reservation_status === 'cancelado'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
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

          <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
            <span className="truncate">{details.subtitle}</span>
            <span className="text-stone-300">•</span>
            <span className="font-medium">
              Bookeado: <span className="text-stone-700">{service.booked_by === 'montecito' ? 'Montecito' : 'Nomad'}</span>
            </span>
            {provider !== 'preferred_partner' && (
              <>
                <span className="text-stone-300">•</span>
                <span>Proveedor: <span className="text-purple-700 font-medium">{provider}</span></span>
              </>
            )}
            {reservationNumber && (
              <>
                <span className="text-stone-300">•</span>
                <span>N° Reserva: <span className="font-mono text-blue-700">{reservationNumber}</span></span>
              </>
            )}
          </div>
        </div>

        {/* Financial Info */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-stone-500">Total</p>
            <p className="text-sm font-bold" style={{ color: '#2E442A' }}>
              ${(service.total_price || 0).toLocaleString()}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-stone-500">Comisión</p>
            <p className="text-sm font-bold text-green-600">
              ${(service.commission || 0).toLocaleString()}
            </p>
          </div>

          {paidToSupplier > 0 && (
            <div className="text-right">
              <p className="text-xs text-stone-500">Pagado</p>
              <p className="text-sm font-bold text-orange-600">
                ${paidToSupplier.toLocaleString()}
              </p>
            </div>
          )}

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-stone-100 flex-shrink-0 rounded-lg"
              >
                <MoreVertical className="w-4 h-4" />
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
      </div>

      {/* Notes - Solo si existen */}
      {service.notes && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
          {service.notes}
        </div>
      )}

      {/* Exchange Alert - Solo si existe y es significativo */}
      {exchangeAlert && Math.abs(exchangeAlert.percentage) > 5 && (
        <div className={`mt-2 p-2 rounded border text-xs ${
          exchangeAlert.isGain
            ? 'bg-green-50 border-green-300 text-green-900'
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {exchangeAlert.isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="font-medium">
              Tipo de cambio {exchangeAlert.isGain ? 'favorable' : 'desfavorable'} ({exchangeAlert.percentage}%) -
              {exchangeAlert.isGain ? ' Ahorras' : ' Pagas'} ${exchangeAlert.usdDifference} USD
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
