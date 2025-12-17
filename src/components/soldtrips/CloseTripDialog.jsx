import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function CloseTripDialog({ open, onClose, soldTrip, services, clientPayments, supplierPayments, onConfirm, isLoading }) {
  const [notasCierre, setNotasCierre] = useState('');

  // Validations
  const validations = [];

  // Check all services have commission marked as paid to agent
  const unpaidCommissions = services.filter(s => !s.paid_to_agent && s.commission > 0);
  if (unpaidCommissions.length > 0) {
    validations.push({
      type: 'error',
      message: `${unpaidCommissions.length} servicio(s) con comisiones sin pagar al agente`
    });
  }

  // Check client payments vs total price
  const totalPrice = soldTrip.total_price || 0;
  const totalPaidByClient = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  if (totalPaidByClient < totalPrice) {
    validations.push({
      type: 'warning',
      message: `Faltan $${(totalPrice - totalPaidByClient).toLocaleString()} por cobrar al cliente`
    });
  }

  // Check supplier payments vs service costs
  const totalServiceCost = services.reduce((sum, s) => sum + (s.total_price || 0) - (s.commission || 0), 0);
  const totalPaidToSuppliers = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  if (totalPaidToSuppliers < totalServiceCost) {
    validations.push({
      type: 'warning',
      message: `Faltan $${(totalServiceCost - totalPaidToSuppliers).toLocaleString()} por pagar a proveedores`
    });
  }

  const hasErrors = validations.some(v => v.type === 'error');
  const canClose = !hasErrors;

  // Calculate final snapshot
  const revenue = totalPaidByClient;
  const cogs = totalPaidToSuppliers;
  const commissions = services.reduce((sum, s) => sum + (s.commission || 0), 0);
  const gananciaGruta = revenue - cogs;
  const gananciaNeta = revenue - cogs - commissions;
  const rentabilidad = revenue > 0 ? (gananciaNeta / revenue) * 100 : 0;

  const handleConfirm = () => {
    const snapshot = {
      revenue_final: revenue,
      cogs_final: cogs,
      comisiones_final: commissions,
      ganancia_bruta: gananciaGruta,
      ganancia_neta: gananciaNeta,
      rentabilidad_porcentaje: rentabilidad,
      servicios: services.map(s => {
        const costoReal = supplierPayments
          .filter(p => p.trip_service_id === s.id)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const profit = (s.total_price || 0) - costoReal;
        const margen = s.total_price > 0 ? (profit / s.total_price) * 100 : 0;

        return {
          service_id: s.id,
          service_type: s.service_type,
          service_name: s.hotel_name || s.tour_name || s.airline || s.cruise_ship || s.dmc_name || 'Servicio',
          precio_venta: s.total_price || 0,
          costo_real: costoReal,
          profit,
          margen_porcentaje: margen
        };
      })
    };

    onConfirm(snapshot, notasCierre);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" style={{ color: '#2E442A' }} />
            Cerrar Viaje Financieramente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Validations */}
          {validations.length > 0 && (
            <div className="space-y-2">
              {validations.map((validation, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    validation.type === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    validation.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <p className={`text-sm ${
                    validation.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {validation.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-stone-50 rounded-lg p-4">
            <h4 className="font-semibold text-stone-800 mb-3">Resumen Financiero Final</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-stone-500">Revenue</p>
                <p className="font-bold text-stone-800">${revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-stone-500">COGS</p>
                <p className="font-bold text-orange-600">${cogs.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-stone-500">Comisiones</p>
                <p className="font-bold text-blue-600">${commissions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-stone-500">Ganancia Neta</p>
                <p className="font-bold text-green-600">${gananciaNeta.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-medium">Rentabilidad Final:</span>
                <Badge className={`text-lg ${
                  rentabilidad >= 15 ? 'bg-green-500' :
                  rentabilidad >= 8 ? 'bg-yellow-500' :
                  'bg-red-500'
                } text-white`}>
                  {rentabilidad.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas de Cierre (opcional)</Label>
            <Textarea
              value={notasCierre}
              onChange={(e) => setNotasCierre(e.target.value)}
              placeholder="Agrega cualquier comentario o nota sobre el cierre de este viaje..."
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">⚠️ Acción irreversible</p>
              <p className="text-xs mt-1">
                Al cerrar el viaje, se guardará un snapshot financiero que no cambiará aunque después se editen pagos o servicios.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canClose || isLoading}
            className="text-white"
            style={{ backgroundColor: '#2E442A' }}
          >
            {isLoading ? 'Cerrando...' : 'Cerrar Viaje'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}