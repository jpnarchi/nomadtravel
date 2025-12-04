import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, X, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SUPPLIER_TYPES = [
  { value: 'dmc', label: 'DMC' },
  { value: 'hotel_directo', label: 'Hotel Directo' },
  { value: 'cadena_hotelera', label: 'Cadena Hotelera' },
  { value: 'aerolinea', label: 'Aerolínea' },
  { value: 'plataforma', label: 'Plataforma (TBO, RateHawk, etc.)' },
  { value: 'transporte', label: 'Transporte / Traslados' },
  { value: 'tours', label: 'Tours / Actividades' },
  { value: 'otro', label: 'Otro' }
];

const DESTINATIONS = [
  'Sudeste Asiático', 'Asia Oriental', 'Asia del Sur', 'Medio Oriente',
  'Europa Occidental', 'Europa del Este', 'Europa del Norte', 'Europa del Sur',
  'África del Norte', 'África del Este', 'África del Sur', 'África Occidental',
  'Oceanía / Pacífico', 'Norteamérica', 'Caribe', 'Centroamérica', 'Sudamérica',
  'Islas del Índico', 'Islas del Mediterráneo'
];

const SERVICES = [
  'Hoteles', 'Vuelos', 'Traslados', 'Tours', 'Cruceros', 'Seguros', 'Renta de Autos', 'Experiencias'
];

const PAYMENT_METHODS = [
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'link_pago', label: 'Link de pago' },
  { value: 'pago_destino', label: 'Pago en destino' }
];

const CURRENCIES = [
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - Libra' },
  { value: 'otro', label: 'Otro' }
];

export default function SupplierForm({ open, onClose, supplier, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    destinations: [],
    services: [],
    commission: '',
    currency: 'USD',
    response_time: '',
    website: '',
    agent_portal: '',
    agent_id: '',
    documents_folder: '',
    payment_methods: [],
    policies: '',
    business_hours: '',
    confirmation_time: '',
    internal_notes: '',
    rating: 0,
    team_comments: '',
    issues: ''
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        type: supplier.type || '',
        destinations: supplier.destinations || [],
        services: supplier.services || [],
        commission: supplier.commission || '',
        currency: supplier.currency || 'USD',
        response_time: supplier.response_time || '',
        website: supplier.website || '',
        agent_portal: supplier.agent_portal || '',
        agent_id: supplier.agent_id || '',
        documents_folder: supplier.documents_folder || '',
        payment_methods: supplier.payment_methods || [],
        policies: supplier.policies || '',
        business_hours: supplier.business_hours || '',
        confirmation_time: supplier.confirmation_time || '',
        internal_notes: supplier.internal_notes || '',
        rating: supplier.rating || 0,
        team_comments: supplier.team_comments || '',
        issues: supplier.issues || ''
      });
    } else {
      setFormData({
        name: '',
        type: '',
        destinations: [],
        services: [],
        commission: '',
        currency: 'USD',
        response_time: '',
        website: '',
        agent_portal: '',
        agent_id: '',
        documents_folder: '',
        payment_methods: [],
        policies: '',
        business_hours: '',
        confirmation_time: '',
        internal_notes: '',
        rating: 0,
        team_comments: '',
        issues: ''
      });
    }
  }, [supplier, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleArrayItem = (field, item) => {
    const current = formData[field] || [];
    if (current.includes(item)) {
      setFormData({ ...formData, [field]: current.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...current, item] });
    }
  };

  const MultiSelectField = ({ label, field, options }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start rounded-xl font-normal h-auto min-h-10 py-2">
            {formData[field]?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {formData[field].map((item) => (
                  <Badge key={item} variant="secondary" className="text-xs">
                    {item}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleArrayItem(field, item); }} />
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-stone-400">Seleccionar</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  id={`${field}-${opt}`}
                  checked={formData[field]?.includes(opt)}
                  onCheckedChange={() => toggleArrayItem(field, opt)}
                />
                <label htmlFor={`${field}-${opt}`} className="text-sm cursor-pointer">{opt}</label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="operativo">Operativo</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Proveedor *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Proveedor *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <MultiSelectField label="Destinos en los que opera" field="destinations" options={DESTINATIONS} />
              <MultiSelectField label="Servicios que ofrece" field="services" options={SERVICES} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Comisiones aproximadas</Label>
                  <Input
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    className="rounded-xl"
                    placeholder="Ej: 10-15%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tiempos de respuesta / SLA</Label>
                <Input
                  value={formData.response_time}
                  onChange={(e) => setFormData({ ...formData, response_time: e.target.value })}
                  className="rounded-xl"
                  placeholder="Ej: 24-48 horas"
                />
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="rounded-xl"
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label>Portal de agentes</Label>
                <Input
                  value={formData.agent_portal}
                  onChange={(e) => setFormData({ ...formData, agent_portal: e.target.value })}
                  className="rounded-xl"
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label>Login / Número de ID</Label>
                <Input
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Carpeta de documentos (Drive/Dropbox)</Label>
                <Input
                  value={formData.documents_folder}
                  onChange={(e) => setFormData({ ...formData, documents_folder: e.target.value })}
                  className="rounded-xl"
                  placeholder="https://"
                />
              </div>
            </TabsContent>

            <TabsContent value="operativo" className="space-y-4">
              <div className="space-y-2">
                <Label>Formas de pago</Label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <Badge 
                      key={pm.value}
                      variant={formData.payment_methods?.includes(pm.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('payment_methods', pm.value)}
                    >
                      {pm.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Políticas relevantes</Label>
                <Textarea
                  value={formData.policies}
                  onChange={(e) => setFormData({ ...formData, policies: e.target.value })}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horarios de respuesta</Label>
                  <Input
                    value={formData.business_hours}
                    onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                    className="rounded-xl"
                    placeholder="Ej: L-V 9am-6pm CST"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tiempo de confirmación</Label>
                  <Input
                    value={formData.confirmation_time}
                    onChange={(e) => setFormData({ ...formData, confirmation_time: e.target.value })}
                    className="rounded-xl"
                    placeholder="Ej: 24-48 hrs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas internas del equipo</Label>
                <Textarea
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="historial" className="space-y-4">
              <div className="space-y-2">
                <Label>Puntaje interno</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1"
                    >
                      <Star className={`w-6 h-6 ${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comentarios del equipo</Label>
                <Textarea
                  value={formData.team_comments}
                  onChange={(e) => setFormData({ ...formData, team_comments: e.target.value })}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Problemas o retrasos previos</Label>
                <Textarea
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl text-white" style={{ backgroundColor: '#2E442A' }}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {supplier ? 'Actualizar' : 'Crear Proveedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}