import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const SERVICE_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'vuelo', label: 'Vuelo' },
  { value: 'traslado', label: 'Traslado' },
  { value: 'tour', label: 'Tour' },
  { value: 'otro', label: 'Otro' }
];

const MEAL_PLANS = [
  { value: 'solo_habitacion', label: 'Solo Habitación' },
  { value: 'desayuno', label: 'Desayuno Incluido' },
  { value: 'all_inclusive', label: 'All Inclusive' }
];

const BOOKED_BY = [
  { value: 'montecito', label: 'Montecito' },
  { value: 'iata_nomad', label: 'IATA Nomad' }
];

const RESERVED_BY = [
  { value: 'virtuoso', label: 'Virtuoso' },
  { value: 'preferred_partner', label: 'Preferred Partner' },
  { value: 'tbo', label: 'TBO' },
  { value: 'expedia_taap', label: 'Expedia TAAP' },
  { value: 'ratehawk', label: 'RateHawk' },
  { value: 'tablet_hotels', label: 'Tablet Hotels' },
  { value: 'dmc', label: 'DMC' },
  { value: 'otro', label: 'Otro' }
];

const HOTEL_CHAINS = [
  { value: 'hilton', label: 'Hilton' },
  { value: 'marriott', label: 'Marriott Bonvoy' },
  { value: 'hyatt', label: 'Hyatt' },
  { value: 'ihg', label: 'IHG' },
  { value: 'accor', label: 'Accor' },
  { value: 'kerzner', label: 'Kerzner International' },
  { value: 'four_seasons', label: 'Four Seasons' },
  { value: 'rosewood', label: 'Rosewood Hotel Group' },
  { value: 'aman', label: 'Aman' },
  { value: 'belmond', label: 'Belmond' },
  { value: 'auberge', label: 'Auberge Resorts Collection' },
  { value: 'slh', label: 'SLH – Small Luxury Hotels of the World' },
  { value: 'design_hotels', label: 'Design Hotels' },
  { value: 'lhw', label: 'The Leading Hotels of the World (LHW)' }
];

const HOTEL_BRANDS = {
  hilton: [
    { value: 'waldorf_astoria', label: 'Waldorf Astoria' },
    { value: 'conrad', label: 'Conrad' },
    { value: 'lxr', label: 'LXR' },
    { value: 'curio', label: 'Curio Collection' },
    { value: 'tapestry', label: 'Tapestry Collection' },
    { value: 'hilton_hotels', label: 'Hilton Hotels & Resorts' },
    { value: 'doubletree', label: 'DoubleTree' }
  ],
  marriott: [
    { value: 'ritz_carlton', label: 'Ritz-Carlton' },
    { value: 'st_regis', label: 'St. Regis' },
    { value: 'jw_marriott', label: 'JW Marriott' },
    { value: 'w_hotels', label: 'W Hotels' },
    { value: 'edition', label: 'Edition' },
    { value: 'luxury_collection', label: 'Luxury Collection' },
    { value: 'autograph', label: 'Autograph Collection' },
    { value: 'westin', label: 'Westin' },
    { value: 'sheraton', label: 'Sheraton' },
    { value: 'delta', label: 'Delta' }
  ],
  hyatt: [
    { value: 'park_hyatt', label: 'Park Hyatt' },
    { value: 'grand_hyatt', label: 'Grand Hyatt' },
    { value: 'hyatt_regency', label: 'Hyatt Regency' },
    { value: 'andaz', label: 'Andaz' },
    { value: 'thompson', label: 'Thompson Hotels' },
    { value: 'alila', label: 'Alila' },
    { value: 'unbound', label: 'Unbound Collection' }
  ],
  ihg: [
    { value: 'intercontinental', label: 'InterContinental' },
    { value: 'six_senses', label: 'Six Senses' },
    { value: 'regent', label: 'Regent' },
    { value: 'kimpton', label: 'Kimpton' },
    { value: 'vignette', label: 'Vignette Collection' },
    { value: 'hotel_indigo', label: 'Hotel Indigo' }
  ],
  accor: [
    { value: 'fairmont', label: 'Fairmont' },
    { value: 'raffles', label: 'Raffles' },
    { value: 'sofitel', label: 'Sofitel' },
    { value: 'mgallery', label: 'MGallery' },
    { value: 'mondrian', label: 'Mondrian' },
    { value: 'ennismore', label: 'Ennismore Collection' },
    { value: 'banyan_tree', label: 'Banyan Tree' }
  ],
  kerzner: [
    { value: 'one_and_only', label: 'One&Only' },
    { value: 'siro', label: 'SIRO' },
    { value: 'atlantis', label: 'Atlantis' }
  ],
  four_seasons: [
    { value: 'four_seasons', label: 'Four Seasons' }
  ],
  rosewood: [
    { value: 'rosewood_hotels', label: 'Rosewood Hotels' },
    { value: 'khos', label: 'KHOS' },
    { value: 'new_world', label: 'New World Hotels' }
  ],
  aman: [
    { value: 'aman_resorts', label: 'Aman Resorts' }
  ],
  belmond: [
    { value: 'belmond_hotels', label: 'Belmond Hotels & Trains' }
  ],
  auberge: [
    { value: 'auberge', label: 'Auberge' }
  ],
  slh: [
    { value: 'slh', label: 'SLH' }
  ],
  design_hotels: [
    { value: 'design_hotels', label: 'Design Hotels' }
  ],
  lhw: [
    { value: 'lhw', label: 'LHW' }
  ]
};

export default function ServiceForm({ open, onClose, service, soldTripId, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    service_type: 'hotel',
    total_price: 0,
    commission: 0,
    booked_by: 'montecito',
    notes: ''
  });

  useEffect(() => {
    if (service) {
      setFormData({ ...service });
    } else {
      setFormData({
        service_type: 'hotel',
        total_price: 0,
        commission: 0,
        booked_by: 'montecito',
        notes: ''
      });
    }
  }, [service, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, sold_trip_id: soldTripId });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChainChange = (chain) => {
    setFormData(prev => ({ 
      ...prev, 
      hotel_chain: chain,
      hotel_brand: '' // Reset brand when chain changes
    }));
  };

  const availableBrands = formData.hotel_chain ? HOTEL_BRANDS[formData.hotel_chain] || [] : [];

  const renderHotelFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cadena Hotelera</Label>
          <Select value={formData.hotel_chain || ''} onValueChange={handleChainChange}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar cadena" /></SelectTrigger>
            <SelectContent>
              {HOTEL_CHAINS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sub-marca / Colección</Label>
          <Select 
            value={formData.hotel_brand || ''} 
            onValueChange={(v) => updateField('hotel_brand', v)}
            disabled={!formData.hotel_chain}
          >
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={formData.hotel_chain ? "Seleccionar sub-marca" : "Primero selecciona cadena"} /></SelectTrigger>
            <SelectContent>
              {availableBrands.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre del Hotel</Label>
          <Input
            value={formData.hotel_name || ''}
            onChange={(e) => updateField('hotel_name', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <Input
            value={formData.hotel_city || ''}
            onChange={(e) => updateField('hotel_city', e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Check-in</Label>
          <Input
            type="date"
            value={formData.check_in || ''}
            onChange={(e) => updateField('check_in', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Check-out</Label>
          <Input
            type="date"
            value={formData.check_out || ''}
            onChange={(e) => updateField('check_out', e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tipo Habitación</Label>
          <Input
            value={formData.room_type || ''}
            onChange={(e) => updateField('room_type', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Num. Habitaciones</Label>
          <Input
            type="number"
            value={formData.num_rooms || ''}
            onChange={(e) => updateField('num_rooms', parseInt(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Plan</Label>
          <Select value={formData.meal_plan || ''} onValueChange={(v) => updateField('meal_plan', v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEAL_PLANS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Precio por Noche</Label>
          <Input
            type="number"
            value={formData.price_per_night || ''}
            onChange={(e) => updateField('price_per_night', parseFloat(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Noches</Label>
          <Input
            type="number"
            value={formData.nights || ''}
            onChange={(e) => updateField('nights', parseInt(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
      </div>
    </>
  );

  const renderVueloFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Aerolínea</Label>
          <Input
            value={formData.airline || ''}
            onChange={(e) => updateField('airline', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Ruta (Origen → Destino)</Label>
          <Input
            value={formData.route || ''}
            onChange={(e) => updateField('route', e.target.value)}
            placeholder="MEX → CDG"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Número de Vuelo</Label>
          <Input
            value={formData.flight_number || ''}
            onChange={(e) => updateField('flight_number', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={formData.flight_date || ''}
            onChange={(e) => updateField('flight_date', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Clase</Label>
          <Input
            value={formData.flight_class || ''}
            onChange={(e) => updateField('flight_class', e.target.value)}
            placeholder="Económica"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Hora Salida</Label>
          <Input
            type="time"
            value={formData.departure_time || ''}
            onChange={(e) => updateField('departure_time', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Hora Llegada</Label>
          <Input
            type="time"
            value={formData.arrival_time || ''}
            onChange={(e) => updateField('arrival_time', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Equipaje</Label>
          <Input
            value={formData.baggage_included || ''}
            onChange={(e) => updateField('baggage_included', e.target.value)}
            placeholder="23kg"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Precio por Pasajero</Label>
          <Input
            type="number"
            value={formData.price_per_passenger || ''}
            onChange={(e) => updateField('price_per_passenger', parseFloat(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Pasajeros</Label>
          <Input
            type="number"
            value={formData.passengers || ''}
            onChange={(e) => updateField('passengers', parseInt(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
      </div>
    </>
  );

  const renderTrasladoFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={formData.transfer_type || 'privado'} onValueChange={(v) => updateField('transfer_type', v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="privado">Privado</SelectItem>
              <SelectItem value="compartido">Compartido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Vehículo</Label>
          <Input
            value={formData.vehicle || ''}
            onChange={(e) => updateField('vehicle', e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Origen</Label>
          <Input
            value={formData.transfer_origin || ''}
            onChange={(e) => updateField('transfer_origin', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Destino</Label>
          <Input
            value={formData.transfer_destination || ''}
            onChange={(e) => updateField('transfer_destination', e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha y Hora</Label>
          <Input
            type="datetime-local"
            value={formData.transfer_datetime || ''}
            onChange={(e) => updateField('transfer_datetime', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Pasajeros</Label>
          <Input
            type="number"
            value={formData.transfer_passengers || ''}
            onChange={(e) => updateField('transfer_passengers', parseInt(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
      </div>
    </>
  );

  const renderTourFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre del Tour</Label>
          <Input
            value={formData.tour_name || ''}
            onChange={(e) => updateField('tour_name', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <Input
            value={formData.tour_city || ''}
            onChange={(e) => updateField('tour_city', e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={formData.tour_date || ''}
            onChange={(e) => updateField('tour_date', e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Duración</Label>
          <Input
            value={formData.tour_duration || ''}
            onChange={(e) => updateField('tour_duration', e.target.value)}
            placeholder="4 horas"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Incluye</Label>
        <Textarea
          value={formData.tour_includes || ''}
          onChange={(e) => updateField('tour_includes', e.target.value)}
          className="rounded-xl resize-none"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Personas</Label>
          <Input
            type="number"
            value={formData.tour_people || ''}
            onChange={(e) => updateField('tour_people', parseInt(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Precio por Persona</Label>
          <Input
            type="number"
            value={formData.price_per_person || ''}
            onChange={(e) => updateField('price_per_person', parseFloat(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
      </div>
    </>
  );

  const renderOtroFields = () => (
    <>
      <div className="space-y-2">
        <Label>Nombre del Servicio</Label>
        <Input
          value={formData.other_name || ''}
          onChange={(e) => updateField('other_name', e.target.value)}
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={formData.other_description || ''}
          onChange={(e) => updateField('other_description', e.target.value)}
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Fecha</Label>
        <Input
          type="date"
          value={formData.other_date || ''}
          onChange={(e) => updateField('other_date', e.target.value)}
          className="rounded-xl"
        />
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {service ? 'Editar Servicio' : 'Nuevo Servicio'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Service Type */}
          <div className="space-y-2">
            <Label>Tipo de Servicio *</Label>
            <Select value={formData.service_type} onValueChange={(v) => updateField('service_type', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields */}
          {formData.service_type === 'hotel' && renderHotelFields()}
          {formData.service_type === 'vuelo' && renderVueloFields()}
          {formData.service_type === 'traslado' && renderTrasladoFields()}
          {formData.service_type === 'tour' && renderTourFields()}
          {formData.service_type === 'otro' && renderOtroFields()}

          {/* Common Fields */}
          <div className="border-t border-stone-200 pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Total *</Label>
                <Input
                  type="number"
                  value={formData.total_price || ''}
                  onChange={(e) => updateField('total_price', parseFloat(e.target.value) || 0)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Comisión</Label>
                <Input
                  type="number"
                  value={formData.commission || ''}
                  onChange={(e) => updateField('commission', parseFloat(e.target.value) || 0)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className={`grid gap-4 ${formData.service_type === 'hotel' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="space-y-2">
                <Label>Bookeado por</Label>
                <Select value={formData.booked_by || 'montecito'} onValueChange={(v) => updateField('booked_by', v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOOKED_BY.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {formData.service_type === 'hotel' && (
                <div className="space-y-2">
                  <Label>Reservado por</Label>
                  <Select value={formData.reserved_by || ''} onValueChange={(v) => updateField('reserved_by', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {RESERVED_BY.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>
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
              {service ? 'Actualizar' : 'Agregar Servicio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}