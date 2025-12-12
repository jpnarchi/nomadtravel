import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Sparkles, FileText, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

const CLIENT_PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'tarjeta_cliente', label: 'Tarjeta de Cliente' },
  { value: 'wise', label: 'Wise' },
  { value: 'otro', label: 'Otro' }
];

const SUPPLIER_PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'ms_beyond', label: 'MS Beyond' },
  { value: 'capital_one_blue', label: 'Capital One Blue' },
  { value: 'capital_one_green', label: 'Capital One Green' },
  { value: 'amex', label: 'Amex' }
];

export default function PaymentForm({ open, onClose, payment, soldTripId, type, onSave, isLoading }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [uploading, setUploading] = useState(false);
  const [fileUrls, setFileUrls] = useState([]);
  const [importing, setImporting] = useState(false);
  
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
      setActiveTab('manual');
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        method: 'transferencia',
        notes: '',
        supplier: ''
      });
      setFileUrls([]);
      setActiveTab('manual');
    }
  }, [payment, open]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(result.file_url);
      }
      setFileUrls(prev => [...prev, ...uploadedUrls]);
      toast.success(`${files.length} archivo(s) subido(s)`);
    } catch (error) {
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const handleSmartImport = async () => {
    if (fileUrls.length === 0) {
      toast.error('Sube al menos un archivo');
      return;
    }

    setImporting(true);
    try {
      const response = await base44.functions.invoke('importClientPaymentFromFiles', {
        file_urls: fileUrls,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, sold_trip_id: soldTripId });
  };

  const isSupplier = type === 'supplier';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {payment ? 'Editar Pago' : (isSupplier ? 'Nuevo Pago a Proveedor' : 'Nuevo Pago de Cliente')}
          </DialogTitle>
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
                {(isSupplier ? SUPPLIER_PAYMENT_METHODS : CLIENT_PAYMENT_METHODS).map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
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
                    Registrar Pago
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
                        Sube comprobantes de pago (PDFs o fotos) y la IA extraerá automáticamente los pagos
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
                      onChange={handleFileUpload}
                      disabled={uploading || importing}
                      className="flex-1 text-sm"
                    />
                    {uploading && <Loader2 className="w-5 h-5 animate-spin text-stone-400" />}
                    {fileUrls.length > 0 && !uploading && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  {fileUrls.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-stone-600">{fileUrls.length} archivo(s) subido(s):</p>
                      {fileUrls.map((url, index) => (
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
                  <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSmartImport}
                    disabled={fileUrls.length === 0 || importing}
                    className="rounded-xl text-white"
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
                  {(isSupplier ? SUPPLIER_PAYMENT_METHODS : CLIENT_PAYMENT_METHODS).map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
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
                Actualizar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}