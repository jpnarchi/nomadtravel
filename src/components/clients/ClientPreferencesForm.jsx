import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClientPreferencesForm({ open, onClose, preferences = {}, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    flight_class: preferences.flight_class || '',
    seat_preference: preferences.seat_preference || '',
    frequent_flyer_programs: preferences.frequent_flyer_programs || '',
    ground_transport: preferences.ground_transport || '',
    car_rental_type: preferences.car_rental_type || '',
    train_class: preferences.train_class || '',
    accommodation_type: preferences.accommodation_type || '',
    hotel_loyalty_programs: preferences.hotel_loyalty_programs || '',
    room_view: preferences.room_view || '',
    bed_type: preferences.bed_type || '',
    hotel_amenities: preferences.hotel_amenities || '',
    pet_friendly: preferences.pet_friendly || false,
    dietary_restrictions: preferences.dietary_restrictions || '',
    cuisine_preferences: preferences.cuisine_preferences || '',
    meal_plan: preferences.meal_plan || '',
    restaurant_atmosphere: preferences.restaurant_atmosphere || '',
    beverage_preferences: preferences.beverage_preferences || '',
    activity_interests: preferences.activity_interests || '',
    travel_pace: preferences.travel_pace || '',
    guided_tours: preferences.guided_tours || false,
    travel_style: preferences.travel_style || '',
    climate_preference: preferences.climate_preference || '',
    trip_purpose: preferences.trip_purpose || '',
    accessibility_needs: preferences.accessibility_needs || '',
    language_preferences: preferences.language_preferences || '',
    budget_range: preferences.budget_range || '',
    travel_companions: preferences.travel_companions || '',
    dislikes: preferences.dislikes || '',
    recently_visited: preferences.recently_visited || '',
    additional_notes: preferences.additional_notes || ''
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        flight_class: preferences.flight_class || '',
        seat_preference: preferences.seat_preference || '',
        frequent_flyer_programs: preferences.frequent_flyer_programs || '',
        ground_transport: preferences.ground_transport || '',
        car_rental_type: preferences.car_rental_type || '',
        train_class: preferences.train_class || '',
        accommodation_type: preferences.accommodation_type || '',
        hotel_loyalty_programs: preferences.hotel_loyalty_programs || '',
        room_view: preferences.room_view || '',
        bed_type: preferences.bed_type || '',
        hotel_amenities: preferences.hotel_amenities || '',
        pet_friendly: preferences.pet_friendly || false,
        dietary_restrictions: preferences.dietary_restrictions || '',
        cuisine_preferences: preferences.cuisine_preferences || '',
        meal_plan: preferences.meal_plan || '',
        restaurant_atmosphere: preferences.restaurant_atmosphere || '',
        beverage_preferences: preferences.beverage_preferences || '',
        activity_interests: preferences.activity_interests || '',
        travel_pace: preferences.travel_pace || '',
        guided_tours: preferences.guided_tours || false,
        travel_style: preferences.travel_style || '',
        climate_preference: preferences.climate_preference || '',
        trip_purpose: preferences.trip_purpose || '',
        accessibility_needs: preferences.accessibility_needs || '',
        language_preferences: preferences.language_preferences || '',
        budget_range: preferences.budget_range || '',
        travel_companions: preferences.travel_companions || '',
        dislikes: preferences.dislikes || '',
        recently_visited: preferences.recently_visited || '',
        additional_notes: preferences.additional_notes || ''
      });
    }
  }, [open, preferences]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            Preferencias del Cliente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <Tabs defaultValue="transport" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="transport">Transporte</TabsTrigger>
              <TabsTrigger value="accommodation">Alojamiento</TabsTrigger>
              <TabsTrigger value="food">Comida</TabsTrigger>
              <TabsTrigger value="activities">Actividades</TabsTrigger>
            </TabsList>

            {/* Transporte */}
            <TabsContent value="transport" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clase de Vuelo Preferida</Label>
                  <Input
                    value={formData.flight_class}
                    onChange={(e) => updateField('flight_class', e.target.value)}
                    placeholder="Ej: Ejecutiva, Primera Clase"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Asiento Preferido</Label>
                  <Input
                    value={formData.seat_preference}
                    onChange={(e) => updateField('seat_preference', e.target.value)}
                    placeholder="Ej: Ventana, Pasillo"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Programas Viajero Frecuente</Label>
                <Textarea
                  value={formData.frequent_flyer_programs}
                  onChange={(e) => updateField('frequent_flyer_programs', e.target.value)}
                  placeholder="Ej: Delta SkyMiles #123456, United MileagePlus #789012"
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transporte Terrestre</Label>
                  <Input
                    value={formData.ground_transport}
                    onChange={(e) => updateField('ground_transport', e.target.value)}
                    placeholder="Ej: Traslados privados, Uber"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Coche de Alquiler</Label>
                  <Input
                    value={formData.car_rental_type}
                    onChange={(e) => updateField('car_rental_type', e.target.value)}
                    placeholder="Ej: SUV, Compacto, Lujo"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Clase de Tren Preferida</Label>
                <Input
                  value={formData.train_class}
                  onChange={(e) => updateField('train_class', e.target.value)}
                  placeholder="Ej: Primera Clase"
                  className="rounded-xl"
                />
              </div>
            </TabsContent>

            {/* Alojamiento */}
            <TabsContent value="accommodation" className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Alojamiento</Label>
                <Input
                  value={formData.accommodation_type}
                  onChange={(e) => updateField('accommodation_type', e.target.value)}
                  placeholder="Ej: Boutique, Lujo, Resort Todo Incluido"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Programas de Lealtad de Hoteles</Label>
                <Textarea
                  value={formData.hotel_loyalty_programs}
                  onChange={(e) => updateField('hotel_loyalty_programs', e.target.value)}
                  placeholder="Ej: Marriott Bonvoy #123456, Hilton Honors #789012"
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vista de Habitación</Label>
                  <Input
                    value={formData.room_view}
                    onChange={(e) => updateField('room_view', e.target.value)}
                    placeholder="Ej: Mar, Ciudad, Jardín"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Cama</Label>
                  <Input
                    value={formData.bed_type}
                    onChange={(e) => updateField('bed_type', e.target.value)}
                    placeholder="Ej: King, Queen, Dobles"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Servicios/Comodidades Esenciales</Label>
                <Textarea
                  value={formData.hotel_amenities}
                  onChange={(e) => updateField('hotel_amenities', e.target.value)}
                  placeholder="Ej: Piscina, Gimnasio, Spa, Acceso a playa"
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="pet_friendly"
                  checked={formData.pet_friendly}
                  onCheckedChange={(checked) => updateField('pet_friendly', checked)}
                />
                <Label htmlFor="pet_friendly">Viaja con mascotas</Label>
              </div>
            </TabsContent>

            {/* Comida y Bebida */}
            <TabsContent value="food" className="space-y-4">
              <div className="space-y-2">
                <Label>Restricciones Dietéticas o Alergias</Label>
                <Textarea
                  value={formData.dietary_restrictions}
                  onChange={(e) => updateField('dietary_restrictions', e.target.value)}
                  placeholder="Ej: Vegetariano, Sin gluten, Alergia a nueces"
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Cocina Preferida</Label>
                <Input
                  value={formData.cuisine_preferences}
                  onChange={(e) => updateField('cuisine_preferences', e.target.value)}
                  placeholder="Ej: Italiana, Asiática, Local"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan de Comidas Deseado</Label>
                  <Input
                    value={formData.meal_plan}
                    onChange={(e) => updateField('meal_plan', e.target.value)}
                    placeholder="Ej: Sólo desayuno, Todo incluido"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ambiente en Restaurantes</Label>
                  <Input
                    value={formData.restaurant_atmosphere}
                    onChange={(e) => updateField('restaurant_atmosphere', e.target.value)}
                    placeholder="Ej: Fine Dining, Casual, Romántico"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferencia de Bebidas</Label>
                <Input
                  value={formData.beverage_preferences}
                  onChange={(e) => updateField('beverage_preferences', e.target.value)}
                  placeholder="Ej: Vinos, Cócteles, Cervezas artesanales"
                  className="rounded-xl"
                />
              </div>
            </TabsContent>

            {/* Actividades y Viaje */}
            <TabsContent value="activities" className="space-y-4">
              <div className="space-y-2">
                <Label>Intereses Específicos</Label>
                <Textarea
                  value={formData.activity_interests}
                  onChange={(e) => updateField('activity_interests', e.target.value)}
                  placeholder="Ej: Senderismo, Buceo, Arte, Historia, Compras"
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ritmo de Viaje</Label>
                  <Input
                    value={formData.travel_pace}
                    onChange={(e) => updateField('travel_pace', e.target.value)}
                    placeholder="Ej: Relajado, Moderado, Activo"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estilo de Viaje</Label>
                  <Input
                    value={formData.travel_style}
                    onChange={(e) => updateField('travel_style', e.target.value)}
                    placeholder="Ej: Lujo, Aventura, Familiar"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="guided_tours"
                  checked={formData.guided_tours}
                  onCheckedChange={(checked) => updateField('guided_tours', checked)}
                />
                <Label htmlFor="guided_tours">Interés en tours guiados</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clima Preferido</Label>
                  <Input
                    value={formData.climate_preference}
                    onChange={(e) => updateField('climate_preference', e.target.value)}
                    placeholder="Ej: Cálido, Templado, Frío"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Propósito del Viaje</Label>
                  <Input
                    value={formData.trip_purpose}
                    onChange={(e) => updateField('trip_purpose', e.target.value)}
                    placeholder="Ej: Vacaciones, Luna de miel"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rango de Presupuesto</Label>
                  <Input
                    value={formData.budget_range}
                    onChange={(e) => updateField('budget_range', e.target.value)}
                    placeholder="Ej: $5,000 - $10,000 USD"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Con Quién Viaja</Label>
                  <Input
                    value={formData.travel_companions}
                    onChange={(e) => updateField('travel_companions', e.target.value)}
                    placeholder="Ej: Pareja, Familia, Amigos"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Necesidades de Accesibilidad</Label>
                <Input
                  value={formData.accessibility_needs}
                  onChange={(e) => updateField('accessibility_needs', e.target.value)}
                  placeholder="Ej: Silla de ruedas, Asistencia visual"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferencias de Idioma</Label>
                <Input
                  value={formData.language_preferences}
                  onChange={(e) => updateField('language_preferences', e.target.value)}
                  placeholder="Ej: Inglés, Español, Francés"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Destinos/Actividades que NO le Gustan</Label>
                <Textarea
                  value={formData.dislikes}
                  onChange={(e) => updateField('dislikes', e.target.value)}
                  placeholder="Ej: Climas muy fríos, cruceros, ciudades muy concurridas"
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Destinos Visitados Recientemente</Label>
                <Textarea
                  value={formData.recently_visited}
                  onChange={(e) => updateField('recently_visited', e.target.value)}
                  placeholder="Ej: París (2024), Tokio (2023)"
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas Adicionales</Label>
                <Textarea
                  value={formData.additional_notes}
                  onChange={(e) => updateField('additional_notes', e.target.value)}
                  placeholder="Cualquier otra información relevante sobre sus preferencias"
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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
              Guardar Preferencias
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}