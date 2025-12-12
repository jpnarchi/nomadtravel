import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Building2, Upload, FileText, X, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' }
];

export default function QuickPaymentDialog({ open, onClose, type }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('manual');
  const [smartFileUrls, setSmartFileUrls] = useState([]);
  const [smartUploading, setSmartUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [smartTripId, setSmartTripId] = useState('');
  
  const [formData, setFormData] = useState({
    sold_trip_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'transferencia',
    supplier: '',
    notes: '',
    receipt_url: ''
  });
  const [uploading, setUploading] = useState(false);

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
        notes: '',
        receipt_url: ''
      });
      setSmartFileUrls([]);
      setSmartTripId('');
      setActiveTab('manual');
    }
  }, [open]);

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
    if (!smartTripId) {
      toast.error('Selecciona un viaje');
      return;
    }

    setImporting(true);
    try {
      const functionName = type === 'client' ? 'importClientPaymentFromFiles' : 'importSupplierPaymentFromFiles';
      const response = await base44.functions.invoke(functionName, {
        file_urls: smartFileUrls,
        sold_trip_id: smartTripId
      });

      if (response.data.success) {
        toast.success(response.data.message);
        queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
        queryClient.invalidateQueries({ queryKey: ['clientPayments'] });
        queryClient.invalidateQueries({ queryKey: ['supplierPayments'] });
        onClose();
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
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, receipt_url: file_url });
      toast.success('Comprobante subido');
    } catch (error) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

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
      notes: formData.notes,
      receipt_url: formData.receipt_url || undefined
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

  const isLoading = clientPaymentMutation.isPending || supplierPaymentMutation.isPending || uploading;
  const selectedTrip = soldTrips.find(t => t.id === formData.sold_trip_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#2E442A' }}>
            {type === 'client' ? (
              <><User className="w-5 h-5" /> Pago de Cliente</>
            ) : (
              <><Building2 className="w-5 h-5" /> Pago a Proveedor</>
            )}
          </DialogTitle>
        </DialogHeader>

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

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Comprobante de Pago</Label>
            {formData.receipt_url ? (
              <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border">
                <FileText className="w-4 h-4 text-stone-500" />
                <a 
                  href={formData.receipt_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex-1 truncate"
                >
                  Ver comprobante
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setFormData({ ...formData, receipt_url: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-stone-200 rounded-xl hover:border-stone-300 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-stone-400" />
                  )}
                  <span className="text-sm text-stone-500">
                    {uploading ? 'Subiendo...' : 'Subir PDF o imagen'}
                  </span>
                </div>
              </div>
            )}
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

              {/* Trip Selection */}
              <div className="space-y-2">
                <Label>Viaje Vendido *</Label>
                <Select 
                  value={smartTripId} 
                  onValueChange={setSmartTripId}
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
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSmartImport}
                  disabled={smartFileUrls.length === 0 || !smartTripId || importing}
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
      </DialogContent>
    </Dialog>
  );
}