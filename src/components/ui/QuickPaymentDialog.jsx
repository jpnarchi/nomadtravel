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
import { Loader2, User, Building2, Upload, FileText, X, Sparkles, CheckCircle, Hotel, Plane, Car, Compass, Package, Train } from 'lucide-react';
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

const SERVICE_ICONS = {
  hotel: Hotel,
  vuelo: Plane,
  traslado: Car,
  tour: Compass,
  crucero: Package,
  tren: Train,
  dmc: Building2,
  otro: Package
};

const SERVICE_LABELS = {
  hotel: 'Hotel',
  vuelo: 'Vuelo',
  traslado: 'Traslado',
  tour: 'Tour',
  crucero: 'Crucero',
  tren: 'Tren',
  dmc: 'DMC',
  otro: 'Otro'
};

// Helper to get service details for display
const getServiceDetails = (service) => {
  switch (service.service_type) {
    case 'hotel':
      return `${service.hotel_name || 'Hotel'} - ${service.hotel_city || ''}`;
    case 'vuelo':
      return `${service.airline || 'Vuelo'} ${service.flight_number || ''} - ${service.route || ''}`;
    case 'traslado':
      return `${service.transfer_origin || ''} → ${service.transfer_destination || ''}`;
    case 'tour':
      return `${service.tour_name || 'Tour'} - ${service.tour_city || ''}`;
    case 'crucero':
      return `${service.cruise_ship || service.cruise_line || 'Crucero'}`;
    case 'tren':
      return `${service.train_operator || 'Tren'} ${service.train_number || ''} - ${service.train_route || ''}`;
    case 'dmc':
      return `${service.dmc_name || 'DMC'} - ${service.dmc_destination || ''}`;
    case 'otro':
      return service.other_name || service.other_description?.substring(0, 50) || 'Servicio';
    default:
      return 'Servicio';
  }
};

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
    amount_original: '',
    currency: 'USD',
    fx_rate: '',
    method: 'transferencia',
    supplier_id: '',
    supplier_name: '',
    trip_service_id: '',
    client_id: '',
    notes: '',
    receipt_url: '',
    payment_type: 'neto'
  });
  const [uploading, setUploading] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: soldTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['soldTripsQuickPayment', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const filter = user.role === 'admin' 
        ? { status: { '$in': ['pendiente', 'parcial', 'pagado', 'completado'] } }
        : { created_by: user.email, status: { '$in': ['pendiente', 'parcial', 'pagado', 'completado'] } };
      return await base44.entities.SoldTrip.filter(filter, '-sale_date');
    },
    enabled: !!user
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliersQuickPayment'],
    queryFn: () => base44.entities.Supplier.list('name'),
  });

  // Fetch services for the selected trip
  const { data: tripServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['tripServicesQuickPayment', formData.sold_trip_id],
    queryFn: () => base44.entities.TripService.filter({ sold_trip_id: formData.sold_trip_id }),
    enabled: !!formData.sold_trip_id && type === 'supplier'
  });

  // Fetch clients for the selected trip
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clientsQuickPayment'],
    queryFn: () => base44.entities.Client.list('first_name'),
    enabled: type === 'client'
  });

  useEffect(() => {
    if (open) {
      setFormData({
        sold_trip_id: '',
        date: new Date().toISOString().split('T')[0],
        amount_original: '',
        currency: 'USD',
        fx_rate: '',
        method: 'transferencia',
        supplier_id: '',
        supplier_name: '',
        trip_service_id: '',
        client_id: '',
        notes: '',
        receipt_url: '',
        payment_type: 'neto'
      });
      setSmartFileUrls([]);
      setSmartTripId('');
      setActiveTab('manual');
    }
  }, [open, type]);

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
        queryClient.invalidateQueries({ queryKey: ['soldTripsQuickPayment'] });
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
    mutationFn: (data) => base44.entities.ClientPayment.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['soldTripsQuickPayment'] });
      queryClient.invalidateQueries({ queryKey: ['clientPayments'] });
      toast.success('Pago de cliente registrado');
      onClose();
    }
  });

  const supplierPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.SupplierPayment.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['soldTripsQuickPayment'] });
      queryClient.invalidateQueries({ queryKey: ['supplierPayments'] });
      queryClient.invalidateQueries({ queryKey: ['tripServices'] });
      toast.success('Pago a proveedor registrado');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount_original);
    if (!formData.sold_trip_id || !amount || amount <= 0) {
      toast.error('Selecciona un viaje e ingresa un monto válido');
      return;
    }

    if (type === 'client') {
      let amount_usd_fixed;
      let fx_rate = null;

      if (formData.currency === 'USD') {
        amount_usd_fixed = amount;
      } else {
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
      if (!formData.supplier_id || !formData.supplier_name) {
        toast.error('Selecciona un proveedor');
        return;
      }
      if (!formData.trip_service_id) {
        toast.error('Selecciona el servicio que estás pagando');
        return;
      }
      
      const paymentData = {
        sold_trip_id: formData.sold_trip_id,
        trip_service_id: formData.trip_service_id,
        date: formData.date,
        supplier_id: formData.supplier_id,
        supplier: formData.supplier_name,
        payment_type: formData.payment_type,
        amount: amount,
        method: formData.method,
        notes: formData.notes,
        receipt_url: formData.receipt_url || undefined
      };
      supplierPaymentMutation.mutate(paymentData);
    }
  };

  const isLoading = clientPaymentMutation.isPending || supplierPaymentMutation.isPending || uploading || userLoading || tripsLoading || suppliersLoading || servicesLoading || clientsLoading;
  const selectedTrip = soldTrips.find(t => t.id === formData.sold_trip_id);
  const selectedService = tripServices.find(s => s.id === formData.trip_service_id);

  // Filter clients that match the selected trip's client
  const filteredClients = selectedTrip 
    ? clients.filter(c => `${c.first_name} ${c.last_name}` === selectedTrip.client_name || c.id === selectedTrip.client_id)
    : clients;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#2E442A' }}>
            {type === 'client' ? (
              <><User className="w-5 h-5" /> Registrar Pago de Cliente</>
            ) : (
              <><Building2 className="w-5 h-5" /> Registrar Pago a Proveedor</>
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
                  onValueChange={(v) => setFormData({ 
                    ...formData, 
                    sold_trip_id: v, 
                    trip_service_id: '', 
                    client_id: '' 
                  })}
                  disabled={tripsLoading || !user}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={
                      userLoading ? "Cargando usuario..." :
                      tripsLoading ? "Cargando viajes..." :
                      soldTrips.length === 0 ? "No hay viajes disponibles" :
                      "Seleccionar viaje"
                    } />
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
                    Pagado Cliente: ${selectedTrip.total_paid_by_client?.toLocaleString() || 0}
                    {type === 'supplier' && ` | Pagado Proveedor: $${selectedTrip.total_paid_to_suppliers?.toLocaleString() || 0}`}
                  </p>
                )}
              </div>

              {/* Client Selection (only for client payments) */}
              {type === 'client' && selectedTrip && (
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <p className="text-sm font-medium text-stone-800">{selectedTrip.client_name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">Cliente del viaje seleccionado</p>
                  </div>
                </div>
              )}

              {/* Supplier and Service Selection (only for supplier payments) */}
              {type === 'supplier' && (
                <>
                  <div className="space-y-2">
                    <Label>Proveedor *</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(v) => {
                        const selectedSupplier = suppliers.find(s => s.id === v);
                        setFormData({ ...formData, supplier_id: v, supplier_name: selectedSupplier?.name || '' });
                      }}
                      disabled={suppliersLoading}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={suppliersLoading ? "Cargando..." : "Seleccionar proveedor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Selection */}
                  <div className="space-y-2">
                    <Label>Servicio a Pagar *</Label>
                    <Select
                      value={formData.trip_service_id}
                      onValueChange={(v) => setFormData({ ...formData, trip_service_id: v })}
                      disabled={!formData.sold_trip_id || servicesLoading || tripServices.length === 0}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={
                          !formData.sold_trip_id ? "Primero selecciona un viaje" :
                          servicesLoading ? "Cargando servicios..." :
                          tripServices.length === 0 ? "Sin servicios en este viaje" :
                          "Seleccionar servicio"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {tripServices.map(service => {
                          const Icon = SERVICE_ICONS[service.service_type] || Package;
                          const details = getServiceDetails(service);
                          return (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <div>
                                  <p className="font-medium">{SERVICE_LABELS[service.service_type]}</p>
                                  <p className="text-xs text-stone-500">{details}</p>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedService && (
                      <p className="text-xs text-stone-500">
                        Total servicio: ${selectedService.total_price?.toLocaleString() || 0} | 
                        Ya pagado: ${selectedService.amount_paid_to_supplier?.toLocaleString() || 0}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Pago</Label>
                    <Select 
                      value={formData.payment_type} 
                      onValueChange={(v) => setFormData({ ...formData, payment_type: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neto">Neto</SelectItem>
                        <SelectItem value="bruto">Bruto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Monto {type === 'client' && `(${formData.currency})`} *</Label>
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

              {/* Currency and FX Rate for Client Payments */}
              {type === 'client' && (
                <>
                  <div className="space-y-2">
                    <Label>Moneda *</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v, fx_rate: '' })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD (Dólares)</SelectItem>
                        <SelectItem value="MXN">MXN (Pesos Mexicanos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.currency === 'MXN' && (
                    <div className="space-y-2">
                      <Label>Tipo de Cambio (USD/MXN) *</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={formData.fx_rate}
                        onChange={(e) => setFormData({ ...formData, fx_rate: e.target.value })}
                        required
                        className="rounded-xl"
                        placeholder="20.50"
                      />
                      {parseFloat(formData.amount_original) > 0 && parseFloat(formData.fx_rate) > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          = ${(parseFloat(formData.amount_original) / parseFloat(formData.fx_rate)).toFixed(2)} USD
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Método de Pago *</Label>
                <Select 
                  value={formData.method} 
                  onValueChange={(v) => setFormData({ ...formData, method: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(type === 'supplier' ? SUPPLIER_PAYMENT_METHODS : CLIENT_PAYMENT_METHODS).map(m => (
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
                  disabled={tripsLoading || !user}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={
                      userLoading ? "Cargando usuario..." :
                      tripsLoading ? "Cargando viajes..." :
                      soldTrips.length === 0 ? "No hay viajes disponibles" :
                      "Seleccionar viaje"
                    } />
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