import React from 'react';
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function GroupBalances({
  members = [],
  payments = [],
  totalAmount = 0,
  splitMethod = 'equal'
}) {
  // Calculate what each member owes based on split method
  const calculateMemberOwes = (member) => {
    const activeMembers = members.filter(m => m.status === 'activo');

    if (splitMethod === 'equal') {
      return totalAmount / activeMembers.length;
    } else if (splitMethod === 'percentage' && member.percentage) {
      return (totalAmount * member.percentage) / 100;
    } else if (splitMethod === 'fixed' && member.fixed_amount) {
      return member.fixed_amount;
    }

    return 0;
  };

  // Calculate what each member has paid
  const calculateMemberPaid = (memberId) => {
    return payments
      .filter(p => p.group_member_id === memberId || p.paid_for_member_id === memberId)
      .reduce((sum, p) => sum + (p.amount_usd_fixed || p.amount || 0), 0);
  };

  // Calculate balances for active members
  const balances = members
    .filter(m => m.status === 'activo')
    .map(member => {
      const owes = calculateMemberOwes(member);
      const paid = calculateMemberPaid(member.id);
      const balance = owes - paid;

      let status = 'pendiente';
      if (paid >= owes) {
        status = 'pagado';
      } else if (paid > 0) {
        status = 'parcial';
      }

      return {
        ...member,
        owes,
        paid,
        balance,
        status
      };
    });

  const totalOwed = balances.reduce((sum, b) => sum + b.owes, 0);
  const totalPaid = balances.reduce((sum, b) => sum + b.paid, 0);
  const totalPending = totalOwed - totalPaid;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pagado':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Pagado' };
      case 'parcial':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Parcial' };
      default:
        return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Pendiente' };
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-stone-800 flex items-center gap-2 mb-1">
          <DollarSign className="w-5 h-5" style={{ color: '#2E442A' }} />
          Balance por Persona
        </h3>
        <p className="text-sm text-stone-500">
          Método de división: <span className="font-medium">
            {splitMethod === 'equal' ? 'Igual entre todos' :
             splitMethod === 'percentage' ? 'Por porcentaje' :
             'Montos fijos'}
          </span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-stone-700 to-stone-800 rounded-xl p-3 text-white">
          <p className="text-xs opacity-80 mb-1">Total a Cobrar</p>
          <p className="text-xl font-bold">${totalOwed.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white">
          <p className="text-xs opacity-80 mb-1">Total Cobrado</p>
          <p className="text-xl font-bold">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 text-white">
          <p className="text-xs opacity-80 mb-1">Pendiente</p>
          <p className="text-xl font-bold">${totalPending.toLocaleString()}</p>
        </div>
      </div>

      {/* Individual Balances */}
      <div className="space-y-2">
        {balances.map((balance) => {
          const statusConfig = getStatusConfig(balance.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={balance.id}
              className="bg-white p-4 rounded-xl border border-stone-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${statusConfig.bg} flex items-center justify-center`}>
                    <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800">{balance.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                {balance.balance > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-stone-500">Falta</p>
                    <p className="text-lg font-bold text-orange-600">
                      ${balance.balance.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Debe</p>
                  <p className="font-semibold text-stone-800">
                    ${balance.owes.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Pagado</p>
                  <p className="font-semibold text-green-600">
                    ${balance.paid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Saldo</p>
                  <p className={`font-semibold ${balance.balance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    ${Math.abs(balance.balance).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {balances.length === 0 && (
        <div className="text-center py-8 text-stone-500">
          <p className="text-sm">No hay miembros activos para mostrar balances</p>
        </div>
      )}
    </div>
  );
}
