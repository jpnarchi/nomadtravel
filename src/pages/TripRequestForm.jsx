import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin, Calendar, Users, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REGIONS = [
  'Sudeste Asiático', 'Asia Oriental', 'Asia del Sur', 'Medio Oriente',
  'Europa Occidental', 'Europa del Este', 'Europa del Norte', 'Europa del Sur',
  'África del Norte', 'África del Este', 'África del Sur', 'África Occidental',
  'Oceanía / Pacífico', 'Norteamérica', 'Caribe', 'Centroamérica', 'Sudamérica',
  'Islas del Índico', 'Islas del Mediterráneo'
];

const TRIP_TYPES = [
  { value: 'honeymoon', label: 'Honeymoon' },
  { value: 'aniversario', label: 'Aniversario' },
  { value: 'vacaciones_familiares', label: 'Vacaciones familiares' },
  { value: 'amigos', label: 'Viaje con amigos' },
  { value: 'aventura', label: 'Aventura' },
  { value: 'lujo_relajacion', label: 'Lujo y relajación' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'gastronomico', label: 'Gastronómico' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'otro', label: 'Otro' }
];

const ACTIVITIES = [
  'Playas', 'Montañas', 'Museos y cultura', 'Compras', 'Gastronomía',
  'Tours privados', 'Actividades al aire libre', 'Vida nocturna',
  'Parques temáticos', 'Safari', 'Buceo / snorkel', 'Esquí', 'Spas',
  'Experiencias únicas', 'Otro'
];

export default function TripRequestForm() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Client info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    // Trip basics
    start_date: '',
    end_date: '',
    budget: '',
    adults: 2,
    children: 0,
    // Destination
    region: '',
    specific_destination: '',
    // Style
    trip_type: '',
    ideal_trip_description: '',
    // Activities
    activities: [],
    // Notes
    additional_notes: ''
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleActivity = (activity) => {
    const current = formData.activities;
    if (current.includes(activity)) {
      updateField('activities', current.filter(a => a !== activity));
    } else {
      updateField('activities', [...current, activity]);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // 1. Check if client exists or create new one
      let client;
      const existingClients = await base44.entities.Client.filter({ email: formData.email });
      
      if (existingClients && existingClients.length > 0) {
        client = existingClients[0];
        // Update client with trip preferences
        await base44.entities.Client.update(client.id, {
          trip_preferences: {
            budget: parseFloat(formData.budget) || 0,
            adults: formData.adults,
            children: formData.children,
            region: formData.region,
            specific_destination: formData.specific_destination,
            trip_type: formData.trip_type,
            ideal_trip_description: formData.ideal_trip_description,
            activities: formData.activities,
            additional_notes: formData.additional_notes
          }
        });
      } else {
        // Create new client
        client = await base44.entities.Client.create({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          source: 'otro',
          trip_preferences: {
            budget: parseFloat(formData.budget) || 0,
            adults: formData.adults,
            children: formData.children,
            region: formData.region,
            specific_destination: formData.specific_destination,
            trip_type: formData.trip_type,
            ideal_trip_description: formData.ideal_trip_description,
            activities: formData.activities,
            additional_notes: formData.additional_notes
          }
        });
      }

      // 2. Create trip
      const tripType = TRIP_TYPES.find(t => t.value === formData.trip_type)?.label || formData.trip_type;
      const tripName = `${tripType} - ${formData.region}`;
      
      const destination = formData.specific_destination 
        ? `${formData.region} (${formData.specific_destination})`
        : formData.region;

      const travelers = (formData.adults || 0) + (formData.children || 0);
      
      const tripNotes = [
        `Tipo de viaje: ${tripType}`,
        formData.ideal_trip_description ? `Descripción: ${formData.ideal_trip_description}` : '',
        formData.activities.length > 0 ? `Actividades: ${formData.activities.join(', ')}` : '',
        `Adultos: ${formData.adults}, Niños: ${formData.children}`,
        formData.additional_notes ? `Notas adicionales: ${formData.additional_notes}` : ''
      ].filter(Boolean).join('\n\n');

      await base44.entities.Trip.create({
        trip_name: tripName,
        client_id: client.id,
        client_name: `${formData.first_name} ${formData.last_name}`,
        destination: destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        travelers: travelers,
        budget: parseFloat(formData.budget) || 0,
        mood: tripType,
        stage: 'nuevo',
        notes: tripNotes
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Hubo un error al enviar el formulario. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.first_name && formData.last_name && formData.email;
      case 2:
        return formData.start_date && formData.end_date;
      case 3:
        return formData.region;
      case 4:
        return formData.trip_type;
      default:
        return true;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');`}</style>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#2E442A' }}>
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#2E442A' }}>¡Gracias por tu solicitud!</h2>
          <p className="text-stone-600 mb-6">
            Hemos recibido tu información. Nuestro equipo de asesores se pondrá en contacto contigo pronto para comenzar a planear tu viaje soñado.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
            <MapPin className="w-4 h-4" />
            <span>Nomad Travel Society</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-8 px-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');`}</style>
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#2E442A' }}>
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#2E442A' }}>Nomad Travel Society</h1>
          <p className="text-stone-500">Cuéntanos sobre tu viaje ideal</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${s <= step ? 'w-8' : 'w-2'}`}
              style={{ backgroundColor: s <= step ? '#2E442A' : '#d6d3d1' }}
            />
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
                    <Users className="w-5 h-5" style={{ color: '#2E442A' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: '#2E442A' }}>Tus datos</h2>
                    <p className="text-sm text-stone-500">Para poder contactarte</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => updateField('first_name', e.target.value)}
                      className="rounded-xl"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido *</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => updateField('last_name', e.target.value)}
                      className="rounded-xl"
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="rounded-xl"
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="rounded-xl"
                    placeholder="+52 81 1234 5678"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Trip Basics */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
                    <Calendar className="w-5 h-5" style={{ color: '#2E442A' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: '#2E442A' }}>Datos del viaje</h2>
                    <p className="text-sm text-stone-500">Fechas y presupuesto</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de inicio *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => updateField('start_date', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de fin *</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => updateField('end_date', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Presupuesto estimado (USD)</Label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    className="rounded-xl"
                    placeholder="5000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de adultos</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.adults}
                      onChange={(e) => updateField('adults', parseInt(e.target.value) || 1)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de niños</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.children}
                      onChange={(e) => updateField('children', parseInt(e.target.value) || 0)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Destination */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
                    <MapPin className="w-5 h-5" style={{ color: '#2E442A' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: '#2E442A' }}>Destino</h2>
                    <p className="text-sm text-stone-500">¿A dónde te gustaría viajar?</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Región del viaje *</Label>
                  <Select value={formData.region} onValueChange={(v) => updateField('region', v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecciona una región" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Destino específico</Label>
                  <Textarea
                    value={formData.specific_destination}
                    onChange={(e) => updateField('specific_destination', e.target.value)}
                    className="rounded-xl resize-none"
                    rows={3}
                    placeholder="Escribe las ciudades o países que te gustaría visitar..."
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Trip Style */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
                    <Heart className="w-5 h-5" style={{ color: '#2E442A' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: '#2E442A' }}>Estilo de viaje</h2>
                    <p className="text-sm text-stone-500">¿Qué tipo de experiencia buscas?</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de viaje *</Label>
                  <Select value={formData.trip_type} onValueChange={(v) => updateField('trip_type', v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecciona el tipo de viaje" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIP_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Describe tu viaje ideal</Label>
                  <Textarea
                    value={formData.ideal_trip_description}
                    onChange={(e) => updateField('ideal_trip_description', e.target.value)}
                    className="rounded-xl resize-none"
                    rows={4}
                    placeholder="Cuéntanos cómo imaginas tu viaje perfecto..."
                  />
                </div>
              </motion.div>
            )}

            {/* Step 5: Activities */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
                    <Sparkles className="w-5 h-5" style={{ color: '#2E442A' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: '#2E442A' }}>Actividades</h2>
                    <p className="text-sm text-stone-500">¿Qué les gustaría hacer?</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ACTIVITIES.map(activity => (
                    <div
                      key={activity}
                      onClick={() => toggleActivity(activity)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center text-sm ${
                        formData.activities.includes(activity)
                          ? 'border-transparent text-white'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                      style={formData.activities.includes(activity) ? { backgroundColor: '#2E442A' } : {}}
                    >
                      {activity}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 6: Additional Notes */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
                    <Sparkles className="w-5 h-5" style={{ color: '#2E442A' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: '#2E442A' }}>Notas adicionales</h2>
                    <p className="text-sm text-stone-500">¿Algo más que debamos saber?</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Textarea
                    value={formData.additional_notes}
                    onChange={(e) => updateField('additional_notes', e.target.value)}
                    className="rounded-xl resize-none"
                    rows={5}
                    placeholder="Escribe aquí cualquier aclaración, petición especial o información adicional..."
                  />
                </div>

                {/* Summary */}
                <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-sm" style={{ color: '#2E442A' }}>Resumen de tu solicitud</h3>
                  <div className="text-sm text-stone-600 space-y-1">
                    <p><span className="font-medium">Viajero:</span> {formData.first_name} {formData.last_name}</p>
                    <p><span className="font-medium">Destino:</span> {formData.region}</p>
                    <p><span className="font-medium">Fechas:</span> {formData.start_date} al {formData.end_date}</p>
                    <p><span className="font-medium">Viajeros:</span> {formData.adults} adultos, {formData.children} niños</p>
                    {formData.budget && <p><span className="font-medium">Presupuesto:</span> ${formData.budget} USD</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-stone-100">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="rounded-xl"
              >
                Anterior
              </Button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="rounded-xl text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-xl text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar solicitud
              </Button>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 mt-6">
          © {new Date().getFullYear()} Nomad Travel Society. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}