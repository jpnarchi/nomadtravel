import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from "sonner";

export default function PaymentPlanForm({ open, onClose, soldTripId, totalAmount, onSave, isLoading }) {
  const [payments, setPayments] = useState([
    { payment_number: 1, due_date: '', amount_due: 0, notes: '' }
  ]);

  useEffect(() => {
    if (open && totalAmount > 0) {
      // Start with a single payment
      setPayments([
        { payment_number: 1, due_date: '', amount_due: totalAmount, notes: '' }
      ]);
    }
  }, [open, totalAmount]);

  const addPayment = () => {
    setPayments([
      ...payments,
      { payment_number: payments.length + 1, due_date: '', amount_due: 0, notes: '' }
    ]);
  };

  const removePayment = (index) => {
    if (payments.length === 1) {
      toast.error('Debe haber al menos un pago');
      return;
    }
    const newPayments = payments.filter((_, i) => i !== index);
    // Renumber payments
    newPayments.forEach((p, i) => p.payment_number = i + 1);
    setPayments(newPayments);
  };

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const totalPlanned = payments.reduce((sum, p) => sum + parseFloat(p.amount_due || 0), 0);
    
    if (Math.abs(totalPlanned - totalAmount) > 0.01) {
      toast.error(`La suma de pagos ($${totalPlanned.toFixed(2)}) debe ser igual al total del viaje ($${totalAmount.toFixed(2)})`);
      return;
    }

    for (const payment of payments) {
      if (!payment.due_date) {
        toast.error(`Falta fecha de vencimiento para el pago #${payment.payment_number}`);
        return;
      }
      if (payment.amount_due <= 0) {
        toast.error(`El monto del pago #${payment.payment_number} debe ser mayor a 0`);
        return;
      }
    }

    // Sort by due date
    const sortedPayments = [...payments].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    onSave(sortedPayments.map((p, i) => ({
      ...p,
      payment_number: i + 1,
      sold_trip_id: soldTripId,
      status: 'pendiente',
      amount_paid: 0
    })));
  };

  const totalPlanned = payments.reduce((sum, p) => sum + parseFloat(p.amount_due || 0), 0);
  const difference = totalAmount - totalPlanned;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Plan de Pagos</DialogTitle>
          <p className="text-sm text-stone-500 mt-2">
            Total del viaje: <span className="font-bold" style={{ color: '#2E442A' }}>${totalAmount.toLocaleString()}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payments List */}
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <div key={index} className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-stone-700">Pago #{payment.payment_number}</h4>
                  {payments.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePayment(index)}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha de Vencimiento *</Label>
                    <Input
                      type="date"
                      value={payment.due_date}
                      onChange={(e) => updatePayment(index, 'due_date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Monto *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={payment.amount_due}
                      onChange={(e) => updatePayment(index, 'amount_due', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label>Notas</Label>
                  <Textarea
                    value={payment.notes}
                    onChange={(e) => updatePayment(index, 'notes', e.target.value)}
                    placeholder="Descripción opcional de este pago..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Payment Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addPayment}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" /> Agregar Pago
          </Button>

          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-stone-700">Total Planeado:</span>
              <span className="text-lg font-bold" style={{ color: '#2E442A' }}>
                ${totalPlanned.toLocaleString()}
              </span>
            </div>
            {Math.abs(difference) > 0.01 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-stone-700">Diferencia:</span>
                <span className={`text-lg font-bold ${difference > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  ${Math.abs(difference).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || Math.abs(difference) > 0.01}
              className="text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Plan de Pagos
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}