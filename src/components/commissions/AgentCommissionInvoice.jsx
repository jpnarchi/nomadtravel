import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, MapPin, CheckCircle } from 'lucide-react';

export default function AgentCommissionInvoice({ open, onClose, commissions, onMarkAsPaid }) {
  if (!commissions || commissions.length === 0) return null;

  // Group by agent
  const agentName = commissions[0]?.agent_name || 'Agente';
  const totalAgentCommission = commissions.reduce((sum, c) => sum + (c.agent_commission || 0), 0);
  const totalNomadCommission = commissions.reduce((sum, c) => sum + (c.nomad_commission || 0), 0);
  const totalCommission = commissions.reduce((sum, c) => sum + (c.estimated_amount || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between print:hidden">
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            Invoice de Comisiones
          </DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 print:mt-0" id="invoice-content">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#2E442A' }}
              >
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#2E442A' }}>Nomad Travel Society</h2>
                <p className="text-xs text-stone-500">San Pedro Garza García, N.L.</p>
                <p className="text-xs text-stone-500">contacto@nomadtravelsociety.com</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500">Fecha de Emisión</p>
              <p className="font-medium">{format(new Date(), 'd MMMM yyyy', { locale: es })}</p>
              <p className="text-xs text-stone-400 mt-1">Invoice #INV-{format(new Date(), 'yyyyMMdd')}</p>
            </div>
          </div>

          {/* Agent Info */}
          <div className="mb-8 p-4 bg-stone-50 rounded-xl">
            <h3 className="text-sm font-semibold text-stone-500 mb-2">Pago de Comisiones a:</h3>
            <p className="text-xl font-bold text-stone-800">{agentName}</p>
            <p className="text-sm text-stone-600 mt-1">Período: {format(new Date(), 'MMMM yyyy', { locale: es })}</p>
          </div>

          {/* Commissions Table */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-stone-500 mb-4">Detalle de Comisiones</h3>
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-100">
                  <tr>
                    <th className="text-left p-3 font-semibold text-stone-600">Viaje / Cliente</th>
                    <th className="text-left p-3 font-semibold text-stone-600">Proveedor</th>
                    <th className="text-right p-3 font-semibold text-stone-600">Comisión Total</th>
                    <th className="text-right p-3 font-semibold text-stone-600">Tu Parte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {commissions.map((commission, index) => (
                    <tr key={index} className="hover:bg-stone-50">
                      <td className="p-3">
                        <span className="font-medium text-stone-800">{commission.sold_trip_name || '-'}</span>
                        {commission.estimated_payment_date && (
                          <p className="text-xs text-stone-400">
                            {format(new Date(commission.estimated_payment_date), 'd MMM yy', { locale: es })}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-stone-600">{commission.service_provider || '-'}</td>
                      <td className="p-3 text-right text-stone-600">
                        ${(commission.estimated_amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-semibold" style={{ color: '#2E442A' }}>
                        ${(commission.agent_commission || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2 bg-stone-50 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Total Comisiones</span>
                <span className="font-medium">${totalCommission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Parte Nomad</span>
                <span className="font-medium text-purple-600">${totalNomadCommission.toLocaleString()}</span>
              </div>
              <div 
                className="flex justify-between pt-3 border-t-2"
                style={{ borderColor: '#2E442A' }}
              >
                <span className="font-bold" style={{ color: '#2E442A' }}>Total a Pagar</span>
                <span className="text-xl font-bold" style={{ color: '#2E442A' }}>
                  ${totalAgentCommission.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-stone-200 text-center print:mt-8">
            <p className="text-sm text-stone-500">
              Este documento es un comprobante de pago de comisiones
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Nomad Travel Society | San Pedro Garza García, N.L.
            </p>
          </div>
        </div>

        {/* Action Buttons - Print Hidden */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4 print:hidden">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cerrar
          </Button>
          <Button 
            onClick={onMarkAsPaid}
            className="text-white rounded-xl"
            style={{ backgroundColor: '#2E442A' }}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar como Pagadas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}