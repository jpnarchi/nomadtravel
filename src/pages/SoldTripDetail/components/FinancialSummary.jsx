import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Wallet, Users, CreditCard, TrendingDown, Sparkles } from 'lucide-react';

// Memoized Financial Card Component with dramatic styling
const FinancialCard = memo(({ card, index }) => {
  const Icon = card.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-3 md:p-4 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer`}
    >
      {/* Animated background decoration */}
      <div className="absolute -right-8 -top-8 w-28 h-28 md:w-32 md:h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500" />
      <div className="absolute -left-4 -bottom-4 w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <p className="text-xs md:text-sm font-bold text-white/95 uppercase tracking-wider">{card.label}</p>
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className={`w-9 h-9 md:w-10 md:h-10 ${card.iconBg} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300`}
          >
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${card.iconColor}`} />
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.08 + 0.2 }}
          className="text-lg md:text-xl lg:text-2xl font-black text-white tracking-tight drop-shadow-lg truncate"
        >
          {typeof card.value === 'number' && card.value !== card.progress
            ? card.value < 0
              ? `-$${Math.abs(card.value).toLocaleString()}`
              : `$${card.value.toLocaleString()}`
            : card.value}
        </motion.p>

        {card.showProgress && (
          <div className="mt-3 md:mt-4 space-y-1.5">
            <div className="h-2 md:h-2.5 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${card.progress}%` }}
                transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-lg relative overflow-hidden"
              >
                <motion.div
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </motion.div>
            </div>
            <p className="text-xs text-white/80 font-semibold">Progreso de pagos del cliente</p>
          </div>
        )}

        {/* Sparkle decoration for completed items */}
        {card.progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute top-2 right-2"
          >
            <Sparkles className="w-5 h-5 text-white/80" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

FinancialCard.displayName = 'FinancialCard';

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
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
      iconBg: 'bg-white/25 backdrop-blur-sm',
      iconColor: 'text-white'
    },
    {
      label: 'Comisión',
      value: totalCommissions,
      icon: TrendingUp,
      gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      iconBg: 'bg-white/25 backdrop-blur-sm',
      iconColor: 'text-white'
    },
    {
      label: 'Cobrado',
      value: totalClientPaid,
      icon: Wallet,
      gradient: 'from-green-500 via-green-600 to-emerald-600',
      iconBg: 'bg-white/25 backdrop-blur-sm',
      iconColor: 'text-white'
    },
    {
      label: 'Por Cobrar',
      value: clientBalance,
      icon: clientBalance > 0 ? TrendingDown : TrendingUp,
      gradient: clientBalance > 0
        ? 'from-orange-500 via-orange-600 to-red-500'
        : 'from-emerald-500 via-emerald-600 to-teal-600',
      iconBg: 'bg-white/25 backdrop-blur-sm',
      iconColor: 'text-white'
    },
    {
      label: 'A Proveedores',
      value: totalSupplierPaid,
      icon: Users,
      gradient: 'from-amber-500 via-orange-500 to-amber-600',
      iconBg: 'bg-white/25 backdrop-blur-sm',
      iconColor: 'text-white'
    },
    {
      label: 'Progreso',
      value: `${paymentProgress}%`,
      icon: CreditCard,
      gradient: 'from-blue-500 via-indigo-600 to-purple-600',
      iconBg: 'bg-white/25 backdrop-blur-sm',
      iconColor: 'text-white',
      showProgress: true,
      progress: paymentProgress
    }
  ];

  return (
    <div className="space-y-3">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <DollarSign className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg md:text-xl font-bold text-stone-900">Resumen Financiero</h3>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {cards.map((card, index) => (
          <FinancialCard key={card.label} card={card} index={index} />
        ))}
      </div>
    </div>
  );
}
