import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseAPI } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, ChevronDown, CheckCircle, Plane } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Normaliza una fecha a formato YYYY-MM-DD sin conversiones de timezone.
 */
function normalizeDateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export default function ClientTripForm() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [agentInfo, setAgentInfo] = useState(null);

  const [formData, setFormData] = useState({
    client_email: '',
    client_full_name: '',
    client_phone: '',
    trip_name: '',
    destination: '',
    start_date: '',
    end_date: '',
    travelers: '1',
    budget: '',
    mood: '',
    notes: ''
  });

  const [destinationSearch, setDestinationSearch] = useState('');
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const destinationInputRef = useRef(null);

  // Validate token and get agent info
  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);

        // Get shared form by token
        const sharedForms = await supabaseAPI.entities.SharedTripForm.filter({
          share_token: token
        });

        if (sharedForms && sharedForms.length > 0) {
          const sharedForm = sharedForms[0];

          // Check if active
          if (sharedForm.is_active) {
            // Check expiration
            if (!sharedForm.expires_at || new Date(sharedForm.expires_at) > new Date()) {
              setValidToken(true);
              setAgentInfo({
                name: sharedForm.agent_name,
                email: sharedForm.agent_email
              });
            } else {
              toast.error('Este link ha expirado');
            }
          } else {
            toast.error('Este link ya no está activo');
          }
        } else {
          toast.error('Link inválido');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        toast.error('Error al validar el link');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  // Load countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,region,subregion,cca2');
        const data = await response.json();

        const formattedCountries = data.map(country => ({
          code: country.cca2,
          name: country.name.common,
          region: country.region || '',
          subregion: country.subregion || ''
        })).sort((a, b) => a.name.localeCompare(b.name, 'es'));

        setCountries(formattedCountries);
      } catch (error) {
        console.error('Error loading countries:', error);
        setCountries([]);
      } finally {
        setLoadingCountries(false);
      }
    };

    if (validToken) {
      fetchCountries();
    }
  }, [validToken]);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(destinationSearch.toLowerCase()) ||
    country.region.toLowerCase().includes(destinationSearch.toLowerCase()) ||
    country.subregion.toLowerCase().includes(destinationSearch.toLowerCase())
  );

  const handleCountrySelect = (countryName) => {
    let currentDests = formData.destination ? formData.destination.split(', ').filter(d => d) : [];
    if (!currentDests.includes(countryName)) {
      currentDests.push(countryName);
      setFormData({ ...formData, destination: currentDests.join(', ') });
    }
    setDestinationSearch('');
    setShowDestinationDropdown(false);
  };

  const handleDestinationInputChange = (e) => {
    const value = e.target.value;
    setDestinationSearch(value);
    setShowDestinationDropdown(true);
  };

  const handleDestinationInputBlur = () => {
    setTimeout(() => {
      setShowDestinationDropdown(false);
      const validCountry = countries.find(c => c.name.toLowerCase() === destinationSearch.toLowerCase());
      if (destinationSearch && !validCountry) {
        setDestinationSearch('');
      }
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.client_email) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }
    if (!formData.client_full_name) {
      toast.error('Por favor ingresa tu nombre completo');
      return;
    }
    if (!formData.destination) {
      toast.error('Por favor selecciona al menos un destino');
      return;
    }
    if (!formData.start_date) {
      toast.error('Por favor ingresa una fecha de inicio');
      return;
    }

    setSubmitting(true);
    try {
      // First, create or find client
      let clientId;

      // Check if client already exists
      const existingClients = await supabaseAPI.entities.Client.filter({
        email: formData.client_email
      });

      if (existingClients && existingClients.length > 0) {
        clientId = existingClients[0].id;
      } else {
        // Create new client
        const nameParts = formData.client_full_name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const newClient = await supabaseAPI.entities.Client.create({
          first_name: firstName,
          last_name: lastName,
          email: formData.client_email,
          phone: formData.client_phone || '',
          created_by: agentInfo.email,
          source: 'Formulario compartido'
        });
        clientId = newClient.id;
      }

      // Create trip
      const tripData = {
        trip_name: formData.trip_name || `Viaje a ${formData.destination}`,
        client_id: clientId,
        client_name: formData.client_full_name,
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        travelers: formData.travelers,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        mood: formData.mood || '',
        stage: 'nuevo',
        notes: formData.notes || '',
        created_by: agentInfo.email
      };

      await supabaseAPI.entities.Trip.create(tripData);

      setSubmitted(true);
      toast.success('¡Formulario enviado exitosamente!');

      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al enviar el formulario. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-stone-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Link Inválido</h1>
          <p className="text-stone-600">
            Este link no es válido o ha expirado. Por favor contacta a tu agente de viajes.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2E442A' }}>
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">¡Formulario Enviado!</h1>
          <p className="text-stone-600 mb-4">
            Gracias por compartir los detalles de tu viaje. {agentInfo?.name || 'Tu agente'} se
            pondrá en contacto contigo pronto para ayudarte a planificar tu viaje perfecto.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
            <Plane className="w-4 h-4" />
            <span>¡Feliz viaje!</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-stone-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A' }}>
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">Cuéntanos sobre tu viaje</h1>
              <p className="text-sm text-stone-600">
                Agente: <strong>{agentInfo?.name}</strong>
              </p>
            </div>
          </div>
          <p className="text-stone-600">
            Completa este formulario con los detalles de tu viaje soñado y nos pondremos en
            contacto contigo para ayudarte a hacerlo realidad.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Tu Información</h2>

          <div className="space-y-2">
            <Label htmlFor="client_email">Correo Electrónico <span className="text-red-500">*</span></Label>
            <Input
              id="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              className="rounded-xl"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_full_name">Nombre Completo <span className="text-red-500">*</span></Label>
            <Input
              id="client_full_name"
              value={formData.client_full_name}
              onChange={(e) => setFormData({ ...formData, client_full_name: e.target.value })}
              className="rounded-xl"
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_phone">Teléfono (opcional)</Label>
            <Input
              id="client_phone"
              type="tel"
              value={formData.client_phone}
              onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              className="rounded-xl"
              placeholder="+52 123 456 7890"
            />
          </div>

          <hr className="my-6" />

          <h2 className="text-lg font-semibold text-stone-800 mb-4">Detalles del Viaje</h2>

          <div className="space-y-2">
            <Label htmlFor="trip_name">Nombre del Viaje (opcional)</Label>
            <Input
              id="trip_name"
              value={formData.trip_name}
              onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
              className="rounded-xl"
              placeholder="Ej: Luna de miel Europa"
            />
          </div>

          <div className="space-y-2">
            <Label>Países <span className="text-red-500">*</span></Label>

            {/* Selected countries */}
            {formData.destination && (
              <div className="flex flex-wrap gap-1 mb-2">
                {formData.destination.split(', ').map((countryName) => (
                  <Badge key={countryName} variant="secondary" className="text-xs">
                    {countryName}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => {
                        const newDests = formData.destination.split(', ').filter(d => d !== countryName);
                        setFormData({ ...formData, destination: newDests.join(', ') });
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Autocomplete input */}
            <div className="relative">
              <Input
                ref={destinationInputRef}
                value={destinationSearch}
                onChange={handleDestinationInputChange}
                onFocus={() => setShowDestinationDropdown(true)}
                onBlur={handleDestinationInputBlur}
                placeholder="Escribe para buscar país..."
                className="rounded-xl pr-8"
                disabled={loadingCountries}
              />
              {loadingCountries ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-stone-400" />
              ) : (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              )}

              {/* Dropdown */}
              {showDestinationDropdown && !loadingCountries && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-[300px] overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    <div className="p-2">
                      {filteredCountries.map((country) => {
                        const isSelected = formData.destination?.split(', ').includes(country.name);
                        return (
                          <div
                            key={country.code}
                            onClick={() => handleCountrySelect(country.name)}
                            className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'hover:bg-stone-50'
                            }`}
                          >
                            <div className="font-medium text-sm">{country.name}</div>
                            <div className="text-xs text-stone-500 mt-0.5">
                              {country.subregion || country.region}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-stone-500 text-center">
                      No se encontraron países
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha inicio <span className="text-red-500">*</span></Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha fin (opcional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travelers">Número de personas</Label>
              <Input
                id="travelers"
                type="text"
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                className="rounded-xl"
                placeholder="Ej: 2 o 2 adultos + 1 niño"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto (USD) (opcional)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="rounded-xl"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood">Mood del viaje (opcional)</Label>
            <Input
              id="mood"
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              className="rounded-xl"
              placeholder="Ej: Romántico, Aventura, Relajación"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="rounded-xl resize-none"
              placeholder="Cuéntanos más sobre lo que buscas en este viaje..."
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl text-white text-lg py-6 mt-6"
            style={{ backgroundColor: '#2E442A' }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Enviar Formulario
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
