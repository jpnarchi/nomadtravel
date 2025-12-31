import React from 'react';
import { Plus, CreditCard, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from '@/components/ui/EmptyState';
import { parseLocalDate } from '@/components/utils/dateHelpers';

export default function ClientPaymentsTab({
  clientPayments,
  totalClientPaid,
  totalServices,
  onAddPayment,
  onEditPayment,
  onDeletePayment
}) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-stone-100">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-stone-100 bg-gradient-to-r from-green-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base md:text-lg font-bold text-stone-900">Pagos del Cliente</h3>
            <p className="text-xs md:text-sm text-stone-600 mt-1">
              Total cobrado: <span className="font-bold text-green-600">${totalClientPaid.toLocaleString()}</span> de ${totalServices.toLocaleString()}
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
          Aquí se registran todos los pagos del cliente. Si el pago es en MXN, captura el tipo de cambio del día.
          Si es en USD, ingrésalo directamente en dólares.
        </p>
      </div>

      {/* Content */}
      {clientPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin pagos registrados"
          description="Registra los pagos recibidos del cliente"
          actionLabel="Registrar Pago"
          onAction={onAddPayment}
        />
      ) : (
        <div className="divide-y divide-stone-100">
          {clientPayments.sort((a, b) => new Date(b.date) - new Date(a.date)).map((payment, index) => {
            const currency = payment.currency || 'USD';
            const amountOriginal = payment.amount_original || payment.amount || 0;
            const amountUSD = payment.amount_usd_fixed || payment.amount || 0;
            const fxRate = payment.fx_rate;

            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 md:p-5 hover:bg-stone-50 transition-all flex items-center gap-3 md:gap-4 group"
              >
                {/* Icon */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 shadow-md group-hover:shadow-lg transition-all flex-shrink-0">
                  <DollarSign className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-lg md:text-xl font-bold text-green-600">
                      +${amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                    {currency === 'MXN' && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 font-medium">
                        MXN
                      </Badge>
                    )}
                  </div>

                  {currency === 'MXN' && (
                    <p className="text-sm text-stone-600 mb-1.5">
                      ${amountOriginal.toLocaleString()} MXN {fxRate && `(TC ${fxRate.toFixed(4)})`}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <span>{format(parseLocalDate(payment.date), 'd MMMM yyyy', { locale: es })}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs capitalize font-medium">
                      {payment.method}
                    </Badge>
                  </div>

                  {payment.notes && (
                    <p className="text-xs text-stone-500 mt-2 p-2 bg-stone-100 rounded-lg">{payment.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 md:gap-2 flex-shrink-0">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
