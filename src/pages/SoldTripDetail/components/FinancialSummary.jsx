import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Wallet, Users, CreditCard, TrendingDown } from 'lucide-react';

export default function FinancialSummary({ metrics }) {
  const {
    totalServices,
    totalCommissions,
    totalClientPaid,
    clientBalance,
    totalSupplierPaid,
    paymentProgress
  } = metrics;

  const cards = [
    {
      label: 'Total',
      value: totalServices,
      icon: DollarSign,
      gradient: 'from-stone-800 via-stone-700 to-stone-900',
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    },
    {
      label: 'Comisión',
      value: totalCommissions,
      icon: TrendingUp,
      gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    },
    {
      label: 'Cobrado',
      value: totalClientPaid,
      icon: Wallet,
      gradient: 'from-green-500 via-green-600 to-green-700',
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    },
    {
      label: 'Por Cobrar',
      value: clientBalance,
      icon: clientBalance > 0 ? TrendingDown : TrendingUp,
      gradient: clientBalance > 0
        ? 'from-orange-500 via-orange-600 to-orange-700'
        : 'from-emerald-500 via-emerald-600 to-emerald-700',
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    },
    {
      label: 'A Proveedores',
      value: totalSupplierPaid,
      icon: Users,
      gradient: 'from-amber-500 via-amber-600 to-amber-700',
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    },
    {
      label: 'Progreso',
      value: `${paymentProgress}%`,
      icon: CreditCard,
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      showProgress: true,
      progress: paymentProgress
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className={`bg-gradient-to-br ${card.gradient} rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}
        >
          {/* Background decoration */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-300" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1.5 md:mb-2">
              <p className="text-xs font-medium text-white/80">{card.label}</p>
              <div className={`w-7 h-7 md:w-8 md:h-8 ${card.iconBg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${card.iconColor}`} />
              </div>
            </div>

            <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {typeof card.value === 'number' && card.value !== paymentProgress
                ? `$${card.value.toLocaleString()}`
                : card.value}
            </p>

            {card.showProgress && (
              <div className="mt-2 md:mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${card.progress}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-white rounded-full shadow-lg"
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
