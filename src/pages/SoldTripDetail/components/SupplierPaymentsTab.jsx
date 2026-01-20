import React from 'react';
import { Plus, Building2, Edit2, Trash2, FileText, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from '@/components/ui/EmptyState';
import { parseLocalDate } from '@/components/utils/dateHelpers';

export default function SupplierPaymentsTab({
  supplierPayments,
  totalSupplierPaid,
  onAddPayment,
  onEditPayment,
  onDeletePayment
}) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-stone-100">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-stone-100 bg-gradient-to-r from-amber-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base md:text-lg font-bold text-stone-900">Pagos a Proveedores</h3>
            <p className="text-xs md:text-sm text-stone-600 mt-1">
              Total pagado: <span className="font-bold text-amber-600">${totalSupplierPaid.toLocaleString()}</span>
            </p>
          </div>
          <Button
            size="sm"
            onClick={onAddPayment}
            className="rounded-xl text-white shadow-md hover:shadow-lg transition-all w-full md:w-auto"
            style={{ backgroundColor: '#2E442A' }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Registrar Pago
          </Button>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Aquí se registran los pagos realizados a proveedores. Indica si el pago fue bruto o neto para llevar un control correcto de costos y comisiones.
        </p>
      </div>

      {/* Content */}
      {supplierPayments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin pagos registrados"
          description="Registra los pagos realizados a proveedores"
          actionLabel="Registrar Pago"
          onAction={onAddPayment}
        />
      ) : (
        <div className="divide-y divide-stone-100">
          {supplierPayments.sort((a, b) => new Date(b.date) - new Date(a.date)).map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 md:p-5 hover:bg-stone-50 transition-all flex items-center gap-3 md:gap-4 group"
            >
              {/* Icon */}
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 shadow-md group-hover:shadow-lg transition-all flex-shrink-0">
                <Building2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-base md:text-lg font-bold text-stone-900 mb-1 truncate">{payment.supplier}</p>

                {payment.trip_service_id && (
                  <Badge className="mb-2 bg-blue-100 text-blue-700 text-xs font-medium">
                    Asociado a servicio
                  </Badge>
                )}

                <div className="flex items-center gap-2 text-sm text-stone-500 flex-wrap">
                  <span className="text-lg font-bold text-amber-600">
                    ${(payment.amount || 0).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>{format(parseLocalDate(payment.date), 'd MMM yyyy', { locale: es })}</span>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs capitalize font-medium">
                    {payment.method}
                  </Badge>
                  {payment.payment_type && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs capitalize font-medium bg-purple-50 text-purple-700 border-purple-300">
                        {payment.payment_type}
                      </Badge>
                    </>
                  )}
                </div>

                {payment.notes && (
                  <p className="text-xs text-stone-500 mt-2 p-2 bg-stone-100 rounded-lg">{payment.notes}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 md:gap-2 flex-shrink-0">
                {payment.receipt_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg md:rounded-xl transition-all"
                    onClick={() => window.open(payment.receipt_url, '_blank')}
                    title="Ver recibo/comprobante"
                  >
                    <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg md:rounded-xl transition-all"
                  onClick={() => onEditPayment(payment)}
                >
                  <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg md:rounded-xl transition-all"
                  onClick={() => onDeletePayment(payment)}
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
