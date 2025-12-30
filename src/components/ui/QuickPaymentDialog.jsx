import React, { useState, useEffect, useMemo } from 'react';
import { supabaseAPI, supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Building2, Upload, FileText, X, Sparkles, CheckCircle, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [smartSearchQuery, setSmartSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    sold_trip_id: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'USD',
    amount_original: '',
    fx_rate: '',
    method: 'transferencia',
    supplier: '',
    trip_service_id: '',
    notes: '',
    receipt_url: ''
  });
  const [uploading, setUploading] = useState(false);

  // Fetch services for the selected trip (for supplier payments)
  const { data: tripServices = [] } = useQuery({
    queryKey: ['tripServices', formData.sold_trip_id],
    queryFn: () => supabaseAPI.entities.TripService.filter({ sold_trip_id: formData.sold_trip_id }),
    enabled: !!formData.sold_trip_id && type === 'supplier'
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await supabaseAPI.auth.getCurrentUser();
      // Obtener el perfil completo del usuario
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
      return profile || user;
    }
  });

  const { data: allSoldTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => supabaseAPI.entities.SoldTrip.list('-created_date')
  });

  // Filter trips by current user
  const soldTrips = useMemo(() => {
    if (!currentUser || !allSoldTrips.length) return [];
    return allSoldTrips.filter(trip => trip.created_by === currentUser.email);
  }, [allSoldTrips, currentUser]);

  // Filter trips by search query
  const filteredTrips = useMemo(() => {
    if (!searchQuery) return soldTrips;
    const query = searchQuery.toLowerCase();
    return soldTrips.filter(trip => 
      trip.client_name?.toLowerCase().includes(query) ||
      trip.destination?.toLowerCase().includes(query) ||
      trip.trip_name?.toLowerCase().includes(query) ||
      trip.id?.toLowerCase().includes(query)
    );
  }, [soldTrips, searchQuery]);

  const filteredSmartTrips = useMemo(() => {
    if (!smartSearchQuery) return soldTrips;
    const query = smartSearchQuery.toLowerCase();
    return soldTrips.filter(trip => 
      trip.client_name?.toLowerCase().includes(query) ||
      trip.destination?.toLowerCase().includes(query) ||
      trip.trip_name?.toLowerCase().includes(query) ||
      trip.id?.toLowerCase().includes(query)
    );
  }, [soldTrips, smartSearchQuery]);

  useEffect(() => {
    if (open) {
      setFormData({
        sold_trip_id: '',
        date: new Date().toISOString().split('T')[0],
        currency: 'USD',
        amount_original: '',
        fx_rate: '',
        method: 'transferencia',
        supplier: '',
        trip_service_id: '',
        notes: '',
        receipt_url: ''
      });
      setSmartFileUrls([]);
      setSmartTripId('');
      setActiveTab('manual');
      setSearchQuery('');
      setSmartSearchQuery('');
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
      const payment = await supabaseAPI.entities.ClientPayment.create(data);
      
      // Update sold trip totals
      const trip = soldTrips.find(t => t.id === data.sold_trip_id);
      if (trip) {
        const newTotal = (trip.total_paid_by_client || 0) + data.amount;
        await supabaseAPI.entities.SoldTrip.update(trip.id, {
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
      const payment = await supabaseAPI.entities.SupplierPayment.create(data);
      
      // Update sold trip totals
      const trip = soldTrips.find(t => t.id === data.sold_trip_id);
      if (trip) {
        const newTotal = (trip.total_paid_to_suppliers || 0) + data.amount;
        await supabaseAPI.entities.SoldTrip.update(trip.id, {
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
    
    if (!formData.sold_trip_id || !formData.amount_original) {
      toast.error('Selecciona un viaje y monto');
      return;
    }

    if (type === 'client') {
      // Validar monto
      const amount = parseFloat(formData.amount_original);
      if (!amount || amount <= 0) {
        toast.error('Debes ingresar un monto válido');
        return;
      }

      // Calculate amount_usd_fixed
      let amount_usd_fixed;
      let fx_rate = null;
      
      if (formData.currency === 'USD') {
        amount_usd_fixed = amount;
        fx_rate = null;
      } else {
        // MXN
        const rate = parseFloat(formData.fx_rate);
        if (!rate || rate <= 0) {
          toast.error('Debes ingresar un tipo de cambio válido para pagos en MXN');
          return;
        }
        fx_rate = rate;
        amount_usd_fixed = amount / rate;
      }
      
      const paymentData = {
        sold_trip_id: formData.sold_trip_id,
        date: formData.date,
        currency: formData.currency,
        amount_original: amount,
        fx_rate: fx_rate,
        amount_usd_fixed: amount_usd_fixed,
        amount: amount_usd_fixed,
        method: formData.method,
        notes: formData.notes,
        receipt_url: formData.receipt_url || undefined
      };

      clientPaymentMutation.mutate(paymentData);
    } else {
      // Supplier payment
      if (!formData.trip_service_id) {
        toast.error('Selecciona un servicio');
        return;
      }

      const selectedService = tripServices.find(s => s.id === formData.trip_service_id);
      
      const paymentData = {
        sold_trip_id: formData.sold_trip_id,
        trip_service_id: formData.trip_service_id,
        date: formData.date,
        amount: parseFloat(formData.amount_original),
        method: formData.method,
        notes: formData.notes,
        receipt_url: formData.receipt_url || undefined,
        supplier: formData.supplier || 'Proveedor'
      };
      supplierPaymentMutation.mutate(paymentData);
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 z-10" />
              <Input
                type="text"
                placeholder="Buscar por cliente, destino o viaje..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-10 mb-2"
              />
            </div>
            <Select 
              value={formData.sold_trip_id} 
              onValueChange={(v) => setFormData({ ...formData, sold_trip_id: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={tripsLoading ? "Cargando..." : "Seleccionar viaje"} />
              </SelectTrigger>
              <SelectContent>
                {filteredTrips.length === 0 ? (
                  <div className="p-4 text-center text-sm text-stone-500">
                    {searchQuery ? 'No se encontraron viajes' : 'No tienes viajes vendidos'}
                  </div>
                ) : (
                  filteredTrips.map(trip => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.client_name} - {trip.destination}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedTrip && (
              <p className="text-xs text-stone-500">
                Total: ${selectedTrip.total_price?.toLocaleString() || 0} | 
                Pagado: ${selectedTrip.total_paid_by_client?.toLocaleString() || 0}
              </p>
            )}
          </div>

          {/* Service Selection (only for supplier payments) */}
          {type === 'supplier' && formData.sold_trip_id && (
            <div className="space-y-2">
              <Label>Servicio *</Label>
              <Select 
                value={formData.trip_service_id} 
                onValueChange={(v) => {
                  const service = tripServices.find(s => s.id === v);
                  setFormData({ 
                    ...formData, 
                    trip_service_id: v,
                    supplier: service?.hotel_name || service?.airline || service?.cruise_ship || service?.train_operator || service?.dmc_name || service?.tour_name || service?.other_name || 'Proveedor'
                  });
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={tripServices.length === 0 ? "Selecciona un viaje primero" : "Seleccionar servicio"} />
                </SelectTrigger>
                <SelectContent>
                  {tripServices.length === 0 ? (
                    <div className="p-4 text-center text-sm text-stone-500">
                      Este viaje no tiene servicios registrados
                    </div>
                  ) : (
                    tripServices.map(service => {
                      const serviceName = service.hotel_name || service.airline || service.cruise_ship || service.train_operator || service.dmc_name || service.tour_name || service.other_name || 'Servicio';
                      const serviceType = service.service_type;
                      return (
                        <SelectItem key={service.id} value={service.id}>
                          [{serviceType}] {serviceName} - ${service.total_price?.toLocaleString() || 0}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {formData.trip_service_id && (
                <p className="text-xs text-stone-500">
                  Proveedor: {formData.supplier}
                </p>
              )}
            </div>
          )}

          {/* Currency selector (only for client payments) */}
          {type === 'client' && (
            <div className="space-y-2">
              <Label>Moneda del Pago *</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v, fx_rate: '' })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                  <SelectItem value="MXN">MXN (Pesos Mexicanos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monto ({type === 'client' ? formData.currency : 'USD'}) *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount_original}
                onChange={(e) => setFormData({ ...formData, amount_original: e.target.value })}
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

          {/* Exchange Rate (only for MXN client payments) */}
          {type === 'client' && formData.currency === 'MXN' && (
            <div className="space-y-2">
              <Label>Tipo de Cambio (USD/MXN) *</Label>
              <Input
                type="number"
                min="0.0001"
                step="0.0001"
                value={formData.fx_rate}
                onChange={(e) => setFormData({ ...formData, fx_rate: e.target.value })}
                placeholder="18.50"
                className="rounded-xl"
                required
              />
              {formData.amount_original && formData.fx_rate && parseFloat(formData.amount_original) > 0 && parseFloat(formData.fx_rate) > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  = ${(parseFloat(formData.amount_original) / parseFloat(formData.fx_rate)).toFixed(2)} USD
                </p>
              )}
            </div>
          )}

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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 z-10" />
                  <Input
                    type="text"
                    placeholder="Buscar por cliente, destino o viaje..."
                    value={smartSearchQuery}
                    onChange={(e) => setSmartSearchQuery(e.target.value)}
                    className="rounded-xl pl-10 mb-2"
                  />
                </div>
                <Select 
                  value={smartTripId} 
                  onValueChange={setSmartTripId}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={tripsLoading ? "Cargando..." : "Seleccionar viaje"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSmartTrips.length === 0 ? (
                      <div className="p-4 text-center text-sm text-stone-500">
                        {smartSearchQuery ? 'No se encontraron viajes' : 'No tienes viajes vendidos'}
                      </div>
                    ) : (
                      filteredSmartTrips.map(trip => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.client_name} - {trip.destination}
                        </SelectItem>
                      ))
                    )}
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