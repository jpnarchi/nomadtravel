import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export default function SupplierPaymentForm({ open, onClose, soldTripId, services, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_type: 'neto',
    method: 'transferencia',
    trip_service_id: '',
    receipt_url: '',
    notes: '',
    confirmed: false
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData({
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_type: 'neto',
        method: 'transferencia',
        trip_service_id: '',
        receipt_url: '',
        notes: '',
        confirmed: false
      });
    }
  }, [open]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, receipt_url: result.file_url });
      toast.success('Comprobante subido');
    } catch (error) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      sold_trip_id: soldTripId,
      amount: parseFloat(formData.amount)
    });
  };

  // Get supplier name from selected service
  const selectedService = services.find(s => s.id === formData.trip_service_id);
  
  useEffect(() => {
    if (selectedService) {
      // Auto-fill supplier name based on service
      let supplierName = '';
      switch (selectedService.service_type) {
        case 'hotel':
          supplierName = selectedService.hotel_name || selectedService.hotel_chain || '';
          break;
        case 'vuelo':
          supplierName = selectedService.airline || '';
          break;
        case 'tour':
          supplierName = selectedService.tour_name || '';
          break;
        default:
          supplierName = selectedService.other_name || '';
      }
      setFormData(prev => ({ ...prev, supplier: supplierName }));
    }
  }, [selectedService]);

  const getServiceLabel = (service) => {
    switch (service.service_type) {
      case 'hotel':
        return `Hotel: ${service.hotel_name || service.hotel_chain || 'Sin nombre'}`;
      case 'vuelo':
        return `Vuelo: ${service.airline || ''} ${service.route || ''}`;
      case 'traslado':
        return `Traslado: ${service.transfer_origin || ''} - ${service.transfer_destination || ''}`;
      case 'tour':
        return `Tour: ${service.tour_name || 'Sin nombre'}`;
      case 'crucero':
        return `Crucero: ${service.cruise_line || 'Sin nombre'}`;
      default:
        return `Otro: ${service.other_name || 'Sin nombre'}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Pago a Proveedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Asociar a Servicio (Opcional)</Label>
            <Select 
              value={formData.trip_service_id} 
              onValueChange={(value) => setFormData({ ...formData, trip_service_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un servicio..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Sin asociar</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {getServiceLabel(service)} - ${service.total_price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-stone-500 mt-1">
              Asocia este pago a un servicio específico para llevar control detallado
            </p>
          </div>

          <div>
            <Label>Proveedor *</Label>
            <Input
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Nombre del proveedor"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Pago *</Label>
              <Select value={formData.payment_type} onValueChange={(value) => setFormData({ ...formData, payment_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neto">Neto</SelectItem>
                  <SelectItem value="bruto">Bruto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método de Pago *</Label>
              <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="ms_beyond">MS Beyond</SelectItem>
                  <SelectItem value="capital_one_blue">Capital One Blue</SelectItem>
                  <SelectItem value="capital_one_green">Capital One Green</SelectItem>
                  <SelectItem value="amex">American Express</SelectItem>
                  <SelectItem value="tarjeta_cliente">Tarjeta de Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Comprobante de Pago</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="flex-1"
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
            </div>
            {formData.receipt_url && (
              <a
                href={formData.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
              >
                Ver comprobante subido
              </a>
            )}
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
              Registrar Pago
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}