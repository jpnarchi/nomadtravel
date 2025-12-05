import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Star, Hotel, Plane, MapPin } from 'lucide-react';
import { Card } from "@/components/ui/card";

const SERVICE_TYPES = [
  { value: 'hotel', label: 'Hotel', icon: Hotel },
  { value: 'aerolinea', label: 'Aerolínea', icon: Plane },
  { value: 'experiencia', label: 'Experiencia', icon: MapPin },
  { value: 'destino', label: 'Destino', icon: MapPin },
  { value: 'otro', label: 'Otro', icon: MapPin }
];

export default function FamDetailsInput({ famDetails = [], onChange }) {
  const addItem = () => {
    onChange([
      ...famDetails,
      {
        type: 'hotel',
        name: '',
        chain: '',
        city: '',
        rating: 0,
        notes: ''
      }
    ]);
  };

  const removeItem = (index) => {
    onChange(famDetails.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...famDetails];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Servicios / Hoteles del FAM</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="text-xs"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar Servicio
        </Button>
      </div>

      {famDetails.length === 0 && (
        <div className="text-center py-8 text-stone-400 text-sm border-2 border-dashed border-stone-200 rounded-xl">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          <p>No hay servicios agregados</p>
          <p className="text-xs mt-1">Haz clic en "Agregar Servicio" para comenzar</p>
        </div>
      )}

      <div className="space-y-3">
        {famDetails.map((item, index) => {
          const ServiceIcon = SERVICE_TYPES.find(t => t.value === item.type)?.icon || MapPin;
          
          return (
            <Card key={index} className="p-4 bg-stone-50 border-stone-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ServiceIcon className="w-5 h-5" style={{ color: '#2E442A' }} />
                  <span className="font-medium text-stone-700">Servicio {index + 1}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeItem(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo *</Label>
                    <Select 
                      value={item.type} 
                      onValueChange={(v) => updateItem(index, 'type', v)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Ciudad *</Label>
                    <Input
                      value={item.city}
                      onChange={(e) => updateItem(index, 'city', e.target.value)}
                      placeholder="Ej: Cancún"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Nombre del Servicio / Hotel *</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Ej: Four Seasons Resort"
                    className="h-9 text-sm"
                  />
                </div>

                {item.type === 'hotel' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Cadena Hotelera (opcional)</Label>
                    <Input
                      value={item.chain}
                      onChange={(e) => updateItem(index, 'chain', e.target.value)}
                      placeholder="Ej: Four Seasons"
                      className="h-9 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Rating (opcional)</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateItem(index, 'rating', star)}
                        className="p-1"
                      >
                        <Star 
                          className={`w-5 h-5 transition-colors ${
                            star <= (item.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-stone-300 hover:text-yellow-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Notas (opcional)</Label>
                  <Textarea
                    value={item.notes}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    placeholder="Detalles específicos de este servicio..."
                    className="h-16 text-sm resize-none"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}