import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const CLIENT_PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'wise', label: 'Wise' },
  { value: 'otro', label: 'Otro' }
];

const SUPPLIER_PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_ms_beyond', label: 'Tarjeta MS Beyond' },
  { value: 'tarjeta_spark_blue', label: 'Tarjeta Spark Blue' },
  { value: 'tarjeta_spark_green', label: 'Tarjeta Spark Green' },
  { value: 'tarjeta_amex_business', label: 'Tarjeta Amex Business' },
  { value: 'otro', label: 'Otro' }
];

export default function PaymentForm({ open, onClose, payment, soldTripId, type, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    method: 'transferencia',
    notes: '',
    supplier: ''
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        date: payment.date || '',
        amount: payment.amount || '',
        method: payment.method || 'transferencia',
        notes: payment.notes || '',
        supplier: payment.supplier || ''
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        method: 'transferencia',
        notes: '',
        supplier: ''
      });
    }
  }, [payment, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, sold_trip_id: soldTripId });
  };

  const isSupplier = type === 'supplier';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {payment ? 'Editar Pago' : (isSupplier ? 'Nuevo Pago a Proveedor' : 'Nuevo Pago de Cliente')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {isSupplier && (
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                required
                className="rounded-xl"
                placeholder="Nombre del proveedor"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                required
                className="rounded-xl"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de Pago *</Label>
            <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-xl text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {payment ? 'Actualizar' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}