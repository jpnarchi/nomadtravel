import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, MoreVertical, TrendingUp, TrendingDown, DollarSign, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const statusColors = {
    reservado: 'bg-amber-100 text-amber-700 border-amber-200',
    pagado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelado: 'bg-red-100 text-red-700 border-red-200'
  };

  const currentStatus = service.reservation_status || service.metadata?.reservation_status || 'reservado';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group bg-white hover:bg-gradient-to-br hover:from-white hover:via-stone-50 hover:to-white p-3 md:p-4 rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-300"
    >
      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-stone-900 truncate mb-1">{details.title}</h4>
            <p className="text-xs text-stone-600 truncate">{details.subtitle}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-stone-100 flex-shrink-0 rounded-lg"
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

        {/* Status Badge */}
        <Select
          value={currentStatus}
          onValueChange={(value) => onUpdateStatus(service.id, value)}
        >
          <SelectTrigger className={`h-7 w-full text-xs rounded-lg border ${statusColors[currentStatus]} font-semibold`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reservado">Reservado</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {/* Info Pills */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs font-medium bg-stone-50">
            {service.booked_by === 'montecito' ? 'Montecito' : 'Nomad'}
          </Badge>
          {provider !== 'preferred_partner' && (
            <Badge variant="outline" className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-200">
              {provider}
            </Badge>
          )}
          {reservationNumber && (
            <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
              #{reservationNumber}
            </Badge>
          )}
        </div>

        {/* Financial Info Grid */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-gradient-to-br from-stone-50 to-transparent rounded-lg border border-stone-100">
          <div className="text-center">
            <p className="text-xs text-stone-500 mb-0.5">Total</p>
            <p className="text-sm font-bold text-stone-900">
              ${(service.total_price || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-500 mb-0.5">Comisión</p>
            <p className="text-sm font-bold text-emerald-600">
              ${(service.commission || 0).toLocaleString()}
            </p>
          </div>
          {paidToSupplier > 0 && (
            <div className="text-center">
              <p className="text-xs text-stone-500 mb-0.5">Pagado</p>
              <p className="text-sm font-bold text-orange-600">
                ${paidToSupplier.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg} shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-bold text-base text-stone-900 truncate">{details.title}</h4>
            <Select
              value={currentStatus}
              onValueChange={(value) => onUpdateStatus(service.id, value)}
            >
              <SelectTrigger className={`h-6 w-auto text-xs rounded-lg border ${statusColors[currentStatus]} font-semibold px-2`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap mb-2">
            <span className="truncate font-medium">{details.subtitle}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-medium bg-stone-50">
              {service.booked_by === 'montecito' ? 'Montecito' : 'Nomad'}
            </Badge>
            {provider !== 'preferred_partner' && (
              <Badge variant="outline" className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-200">
                {provider}
              </Badge>
            )}
            {reservationNumber && (
              <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
                #{reservationNumber}
              </Badge>
            )}
          </div>
        </div>

        {/* Financial Info */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-stone-500 font-medium mb-0.5">Total</p>
            <p className="text-base font-bold text-stone-900">
              ${(service.total_price || 0).toLocaleString()}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-stone-500 font-medium mb-0.5">Comisión</p>
            <p className="text-base font-bold text-emerald-600">
              ${(service.commission || 0).toLocaleString()}
            </p>
          </div>

          {paidToSupplier > 0 && (
            <div className="text-right">
              <p className="text-xs text-stone-500 font-medium mb-0.5">Pagado</p>
              <p className="text-base font-bold text-orange-600">
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
                className="h-8 w-8 hover:bg-stone-100 flex-shrink-0 rounded-lg"
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

      {/* Notes */}
      {service.notes && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{service.notes}</span>
        </div>
      )}

      {/* Exchange Alert */}
      {exchangeAlert && Math.abs(exchangeAlert.percentage) > 5 && (
        <div className={`mt-3 p-2.5 rounded-lg border text-xs font-medium ${
          exchangeAlert.isGain
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {exchangeAlert.isGain ? (
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 flex-shrink-0" />
            )}
            <span>
              Tipo de cambio {exchangeAlert.isGain ? 'favorable' : 'desfavorable'} ({exchangeAlert.percentage}%) -
              {exchangeAlert.isGain ? ' Ahorras' : ' Pagas'} <strong>${exchangeAlert.usdDifference} USD</strong>
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
