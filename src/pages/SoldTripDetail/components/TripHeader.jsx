import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, MapPin, Calendar, Users, Edit2, FileText, Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from '@/utils';
import { parseLocalDate } from '@/components/utils/dateHelpers';
import { STATUS_CONFIG } from '../constants/serviceConstants';

// Memoized Info Pill Component with enhanced styling
const InfoPill = memo(({ icon: Icon, children, highlight = false, className = "" }) => (
  <div className={`flex items-center gap-1.5 md:gap-2 ${
    highlight
      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'
      : 'bg-white/80 border border-stone-200'
  } px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}>
    <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${highlight ? 'text-emerald-600' : 'text-stone-500'}`} />
    <span className={`text-xs md:text-sm font-semibold ${highlight ? 'text-emerald-900' : 'text-stone-700'}`}>{children}</span>
  </div>
));

InfoPill.displayName = 'InfoPill';

// Memoized Action Button with enhanced styling
const ActionButton = memo(({ icon: Icon, children, onClick, variant = "outline", className = "" }) => (
  <Button
    size="sm"
    variant={variant}
    onClick={onClick}
    className={`h-9 md:h-10 px-4 md:px-5 text-xs md:text-sm rounded-xl border-stone-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md font-semibold ${className}`}
  >
    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
    {children}
  </Button>
));

ActionButton.displayName = 'ActionButton';

export default function TripHeader({
  soldTrip,
  paymentPlan,
  daysUntilTrip,
  isTripPast,
  onEditTrip,
  onCreatePaymentPlan,
  onOpenInvoice,
  onUpdateStatus
}) {
  const statusConfig = STATUS_CONFIG[soldTrip.status] || STATUS_CONFIG.pendiente;

  const getDaysUntilBadgeColor = (days) => {
    if (days === 0) return 'border-purple-300 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800';
    if (days <= 7) return 'border-red-300 bg-gradient-to-r from-red-100 to-orange-100 text-red-700';
    if (days <= 30) return 'border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700';
    return 'border-blue-300 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700';
  };

  return (
    <Card className="bg-gradient-to-br from-white via-stone-50/50 to-emerald-50/30 rounded-2xl md:rounded-3xl shadow-xl border-2 border-stone-200/50 overflow-hidden backdrop-blur-sm">
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4 md:gap-5">
          {/* Mobile Header */}
          <div className="flex items-center gap-3 md:hidden">
            <Link to={createPageUrl('SoldTrips')}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-white/90 hover:shadow-md transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-stone-900 truncate">{soldTrip.client_name}</h1>
            </div>
            <Badge className={`${statusConfig.color} text-xs px-2.5 py-1 font-bold flex-shrink-0 shadow-sm border`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-start justify-between gap-5">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <Link to={createPageUrl('SoldTrips')}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-2xl hover:bg-white/90 transition-all duration-200 shadow-md hover:shadow-lg border border-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>

              <div className="flex-1 space-y-4 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight truncate">{soldTrip.client_name}</h1>
                  <Badge className={`${statusConfig.color} text-sm px-4 py-1.5 font-bold shadow-md flex-shrink-0 border`}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 md:gap-3 flex-wrap text-sm text-stone-600">
                  <InfoPill icon={MapPin} highlight>
                    {soldTrip.destination}
                  </InfoPill>

                  <InfoPill icon={Calendar}>
                    {format(parseLocalDate(soldTrip.start_date), 'd MMM yyyy', { locale: es })}
                  </InfoPill>

                  {soldTrip.travelers && (
                    <InfoPill icon={Users}>
                      {soldTrip.travelers} viajero{soldTrip.travelers !== 1 ? 's' : ''}
                    </InfoPill>
                  )}

                  {!isTripPast && daysUntilTrip >= 0 && (
                    <Badge
                      variant="outline"
                      className={`${getDaysUntilBadgeColor(daysUntilTrip)} text-xs md:text-sm px-3 md:px-4 py-1.5 font-bold shadow-md border-2 animate-pulse`}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {daysUntilTrip === 0 ? '¡Hoy!' : `En ${daysUntilTrip} día${daysUntilTrip !== 1 ? 's' : ''}`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              <ActionButton icon={Edit2} onClick={onEditTrip}>
                Editar
              </ActionButton>

              {paymentPlan.length === 0 && (
                <ActionButton icon={Calendar} onClick={onCreatePaymentPlan}>
                  Plan
                </ActionButton>
              )}

              <ActionButton icon={FileText} onClick={onOpenInvoice}>
                Invoice
              </ActionButton>

              <Select value={soldTrip.status} onValueChange={onUpdateStatus}>
                <SelectTrigger className="h-10 w-40 text-sm rounded-xl border-2 border-stone-300 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Info Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs md:hidden">
            <InfoPill icon={MapPin} highlight>
              {soldTrip.destination}
            </InfoPill>

            <InfoPill icon={Calendar}>
              {format(parseLocalDate(soldTrip.start_date), 'd MMM', { locale: es })}
            </InfoPill>

            {soldTrip.travelers && (
              <InfoPill icon={Users}>
                {soldTrip.travelers}p
              </InfoPill>
            )}

            {!isTripPast && daysUntilTrip >= 0 && (
              <Badge
                variant="outline"
                className={`${getDaysUntilBadgeColor(daysUntilTrip)} text-xs px-2.5 py-1 font-bold shadow-md border-2`}
              >
                <Clock className="w-3 h-3 mr-1" />
                {daysUntilTrip === 0 ? '¡Hoy!' : `${daysUntilTrip}d`}
              </Badge>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <ActionButton icon={Edit2} onClick={onEditTrip} className="w-full">
              Editar
            </ActionButton>

            <ActionButton icon={FileText} onClick={onOpenInvoice} className="w-full">
              Invoice
            </ActionButton>

            {paymentPlan.length === 0 && (
              <ActionButton icon={Calendar} onClick={onCreatePaymentPlan} className="w-full col-span-2">
                Crear Plan de Pagos
              </ActionButton>
            )}

            <Select value={soldTrip.status} onValueChange={onUpdateStatus}>
              <SelectTrigger className="h-9 text-xs rounded-xl border-2 border-stone-300 shadow-sm col-span-2 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
