import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';

export default function EditPaymentPlanItem({ open, onClose, planItem, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    due_date: '',
    amount_due: 0,
    notes: ''
  });

  useEffect(() => {
    if (planItem) {
      setFormData({
        due_date: planItem.due_date || '',
        amount_due: planItem.amount_due || 0,
        notes: planItem.notes || ''
      });
    }
  }, [planItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount_due: parseFloat(formData.amount_due)
    });
  };

  if (!planItem) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Pago #{planItem.payment_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Fecha de Vencimiento *</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Monto *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount_due}
              onChange={(e) => setFormData({ ...formData, amount_due: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}