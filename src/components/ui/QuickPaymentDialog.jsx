import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Building2 } from 'lucide-react';
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' }
];

export default function QuickPaymentDialog({ open, onClose, type }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    sold_trip_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'transferencia',
    supplier: '',
    notes: ''
  });

  const { data: soldTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => base44.entities.SoldTrip.list('-created_date')
  });

  useEffect(() => {
    if (open) {
      setFormData({
        sold_trip_id: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        method: 'transferencia',
        supplier: '',
        notes: ''
      });
    }
  }, [open]);

  const clientPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const payment = await base44.entities.ClientPayment.create(data);
      
      // Update sold trip totals
      const trip = soldTrips.find(t => t.id === data.sold_trip_id);
      if (trip) {
        const newTotal = (trip.total_paid_by_client || 0) + data.amount;
        await base44.entities.SoldTrip.update(trip.id, {
          total_paid_by_client: newTotal,
          status: newTotal >= (trip.total_price || 0) ? 'pagado' : 'parcial'
        });
      }
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
      queryClient.invalidateQueries({ queryKey: ['clientPayments'] });
      toast.success('Pago de cliente registrado');
      onClose();
    }
  });

  const supplierPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const payment = await base44.entities.SupplierPayment.create(data);
      
      // Update sold trip totals
      const trip = soldTrips.find(t => t.id === data.sold_trip_id);
      if (trip) {
        const newTotal = (trip.total_paid_to_suppliers || 0) + data.amount;
        await base44.entities.SoldTrip.update(trip.id, {
          total_paid_to_suppliers: newTotal
        });
      }
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
      queryClient.invalidateQueries({ queryKey: ['supplierPayments'] });
      toast.success('Pago a proveedor registrado');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.sold_trip_id || !formData.amount) {
      toast.error('Selecciona un viaje y monto');
      return;
    }

    const paymentData = {
      sold_trip_id: formData.sold_trip_id,
      date: formData.date,
      amount: parseFloat(formData.amount),
      method: formData.method,
      notes: formData.notes
    };

    if (type === 'client') {
      clientPaymentMutation.mutate(paymentData);
    } else {
      supplierPaymentMutation.mutate({
        ...paymentData,
        supplier: formData.supplier
      });
    }
  };

  const isLoading = clientPaymentMutation.isPending || supplierPaymentMutation.isPending;
  const selectedTrip = soldTrips.find(t => t.id === formData.sold_trip_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#2E442A' }}>
            {type === 'client' ? (
              <><User className="w-5 h-5" /> Pago de Cliente</>
            ) : (
              <><Building2 className="w-5 h-5" /> Pago a Proveedor</>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trip Selection */}
          <div className="space-y-2">
            <Label>Viaje Vendido *</Label>
            <Select 
              value={formData.sold_trip_id} 
              onValueChange={(v) => setFormData({ ...formData, sold_trip_id: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={tripsLoading ? "Cargando..." : "Seleccionar viaje"} />
              </SelectTrigger>
              <SelectContent>
                {soldTrips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.client_name} - {trip.destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTrip && (
              <p className="text-xs text-stone-500">
                Total: ${selectedTrip.total_price?.toLocaleString() || 0} | 
                Pagado: ${selectedTrip.total_paid_by_client?.toLocaleString() || 0}
              </p>
            )}
          </div>

          {/* Supplier (only for supplier payments) */}
          {type === 'supplier' && (
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nombre del proveedor"
                className="rounded-xl"
                required
              />
            </div>
          )}

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <Select 
              value={formData.method} 
              onValueChange={(v) => setFormData({ ...formData, method: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
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
              Registrar Pago
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}