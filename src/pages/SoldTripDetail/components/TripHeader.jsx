import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, MapPin, Calendar, Users, Edit2, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from '@/utils';
import { parseLocalDate } from '@/components/utils/dateHelpers';
import { STATUS_CONFIG } from '../constants/serviceConstants';

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

  return (
    <div className="bg-gradient-to-br from-white via-stone-50 to-stone-100 rounded-xl md:rounded-2xl shadow-md border border-stone-200/50">
      <div className="p-3 md:p-5">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Mobile: Compact header */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to={createPageUrl('SoldTrips')}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-white/80 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-stone-900 truncate">{soldTrip.client_name}</h1>
            </div>
            <Badge className={`${statusConfig.color} text-xs px-2 py-0.5 font-medium flex-shrink-0`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Desktop: Full header */}
          <div className="hidden md:flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Link to={createPageUrl('SoldTrips')}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{soldTrip.client_name}</h1>
                  <Badge className={`${statusConfig.color} text-xs px-3 py-1 font-medium shadow-sm`}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-sm text-stone-600">
                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-4 h-4" style={{ color: '#2E442A' }} />
                    <span className="font-semibold">{soldTrip.destination}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-4 h-4 text-stone-500" />
                    <span>{format(parseLocalDate(soldTrip.start_date), 'd MMM yyyy', { locale: es })}</span>
                  </div>

                  {soldTrip.travelers && (
                    <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg">
                      <Users className="w-4 h-4 text-stone-500" />
                      <span>{soldTrip.travelers} viajeros</span>
                    </div>
                  )}

                  {!isTripPast && daysUntilTrip >= 0 && (
                    <Badge
                      variant="outline"
                      className={`${
                        daysUntilTrip <= 7
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : daysUntilTrip <= 30
                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                            : 'border-blue-300 bg-blue-50 text-blue-700'
                      } text-xs px-3 py-1 font-medium shadow-sm`}
                    >
                      {daysUntilTrip === 0 ? '¡Hoy!' : `En ${daysUntilTrip} días`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={onEditTrip}
                className="h-9 px-4 text-xs rounded-xl border-stone-300 hover:border-stone-400 hover:bg-white transition-all shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>

              {paymentPlan.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCreatePaymentPlan}
                  className="h-9 px-4 text-xs rounded-xl border-stone-300 hover:border-stone-400 hover:bg-white transition-all shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Plan
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={onOpenInvoice}
                className="h-9 px-4 text-xs rounded-xl border-stone-300 hover:border-stone-400 hover:bg-white transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Invoice
              </Button>

              <Select value={soldTrip.status} onValueChange={onUpdateStatus}>
                <SelectTrigger className="h-9 w-36 text-xs rounded-xl border-stone-300 shadow-sm">
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

          {/* Mobile: Info pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs md:hidden">
            <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-lg">
              <MapPin className="w-3 h-3" style={{ color: '#2E442A' }} />
              <span className="font-medium">{soldTrip.destination}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-lg">
              <Calendar className="w-3 h-3 text-stone-500" />
              <span>{format(parseLocalDate(soldTrip.start_date), 'd MMM', { locale: es })}</span>
            </div>

            {soldTrip.travelers && (
              <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-lg">
                <Users className="w-3 h-3 text-stone-500" />
                <span>{soldTrip.travelers}p</span>
              </div>
            )}

            {!isTripPast && daysUntilTrip >= 0 && (
              <Badge
                variant="outline"
                className={`${
                  daysUntilTrip <= 7
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : daysUntilTrip <= 30
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-blue-300 bg-blue-50 text-blue-700'
                } text-xs px-2 py-0.5 font-medium`}
              >
                {daysUntilTrip === 0 ? '¡Hoy!' : `${daysUntilTrip}d`}
              </Badge>
            )}
          </div>

          {/* Mobile: Action buttons */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <Button
              size="sm"
              variant="outline"
              onClick={onEditTrip}
              className="h-8 text-xs rounded-lg border-stone-300"
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Editar
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenInvoice}
              className="h-8 text-xs rounded-lg border-stone-300"
            >
              <FileText className="w-3 h-3 mr-1" />
              Invoice
            </Button>

            {paymentPlan.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCreatePaymentPlan}
                className="h-8 text-xs rounded-lg border-stone-300"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Plan
              </Button>
            )}

            <Select value={soldTrip.status} onValueChange={onUpdateStatus}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-stone-300">
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
    </div>
  );
}
