import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Sparkles, FileText, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export default function SupplierPaymentForm({ open, onClose, soldTripId, services, payment, onSave, isLoading }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [smartFileUrls, setSmartFileUrls] = useState([]);
  const [smartUploading, setSmartUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  
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
    if (open) {
      if (payment) {
        setFormData({
          supplier: payment.supplier || '',
          date: payment.date || new Date().toISOString().split('T')[0],
          amount: payment.amount || 0,
          payment_type: payment.payment_type || 'neto',
          method: payment.method || 'transferencia',
          trip_service_id: payment.trip_service_id || '',
          receipt_url: payment.receipt_url || '',
          notes: payment.notes || '',
          confirmed: payment.confirmed || false
        });
        setActiveTab('manual');
      } else {
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
        setSmartFileUrls([]);
        setActiveTab('manual');
      }
    }
  }, [open, payment]);

  const handleSmartFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSmartUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(result.file_url);
      }
      setSmartFileUrls(prev => [...prev, ...uploadedUrls]);
      toast.success(`${files.length} archivo(s) subido(s)`);
    } catch (error) {
      toast.error('Error al subir archivos');
    } finally {
      setSmartUploading(false);
    }
  };

  const handleSmartImport = async () => {
    if (smartFileUrls.length === 0) {
      toast.error('Sube al menos un archivo');
      return;
    }

    setImporting(true);
    try {
      const response = await base44.functions.invoke('importSupplierPaymentFromFiles', {
        file_urls: smartFileUrls,
        sold_trip_id: soldTripId
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onClose();
        window.location.reload();
      } else {
        toast.error(response.data.error || 'Error al importar');
      }
    } catch (error) {
      toast.error('Error al importar pagos');
    } finally {
      setImporting(false);
    }
  };

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
        case 'crucero':
          supplierName = selectedService.cruise_line || '';
          break;
        case 'tren':
          supplierName = selectedService.train_operator || '';
          break;
        case 'dmc':
          supplierName = selectedService.dmc_name || selectedService.name || selectedService.provider_name || '';
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
      case 'tren':
        return `Tren: ${service.train_operator || service.train_route || 'Sin nombre'}`;
      case 'dmc':
        return `DMC: ${service.dmc_name || service.name || service.provider_name || service.supplier_name || service.description || 'Sin nombre'}`;
      default:
        return `Otro: ${service.other_name || 'Sin nombre'}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{payment ? 'Editar Pago a Proveedor' : 'Registrar Pago a Proveedor'}</DialogTitle>
        </DialogHeader>

        {!payment && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="smart">
                <Sparkles className="w-4 h-4 mr-2" />
                Smart Import
              </TabsTrigger>
            </TabsList>

          <TabsContent value="manual">
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
                  {payment ? 'Actualizar Pago' : 'Registrar Pago'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="smart">
            <div className="space-y-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Smart Import con IA</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Sube comprobantes de pago a proveedores (PDFs o fotos) y la IA extraerá automáticamente los pagos
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Subir Comprobantes (PDFs o Imágenes)</Label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    multiple
                    onChange={handleSmartFileUpload}
                    disabled={smartUploading || importing}
                    className="flex-1 text-sm"
                  />
                  {smartUploading && <Loader2 className="w-5 h-5 animate-spin text-stone-400" />}
                  {smartFileUrls.length > 0 && !smartUploading && <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
                {smartFileUrls.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-stone-600">{smartFileUrls.length} archivo(s) subido(s):</p>
                    {smartFileUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Archivo {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSmartImport}
                  disabled={smartFileUrls.length === 0 || importing}
                  className="text-white"
                  style={{ backgroundColor: '#2E442A' }}
                >
                  {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Sparkles className="w-4 h-4 mr-2" />
                  Importar Pagos
                </Button>
              </div>
            </div>
          </TabsContent>
          </Tabs>
        )}

        {payment && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                Actualizar Pago
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}