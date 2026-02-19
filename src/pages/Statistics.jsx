import React, { useState, useMemo, useEffect, useContext } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { ViewModeContext } from '@/Layout';
import { useUser } from '@clerk/clerk-react';
import { format, getMonth, getYear, parseISO, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Loader2, TrendingUp, Users, Plane, DollarSign, 
  Calendar, MapPin, Hotel, Building2, Filter, X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import GeneralStats from '@/components/statistics/GeneralStats';
import DestinationsChart from '@/components/statistics/DestinationsChart';
import SeasonalityChart from '@/components/statistics/SeasonalityChart';
import TripTypesChart from '@/components/statistics/TripTypesChart';
import HotelChainsChart from '@/components/statistics/HotelChainsChart';
import ProvidersChart from '@/components/statistics/ProvidersChart';
import SoldTripsStats from '@/components/statistics/SoldTripsStats';
import PendingTripsStats from '@/components/statistics/PendingTripsStats';
import AgentComparisonStats from '@/components/statistics/AgentComparisonStats';

const MONTHS = [
  { value: '0', label: 'Enero' },
  { value: '1', label: 'Febrero' },
  { value: '2', label: 'Marzo' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Mayo' },
  { value: '5', label: 'Junio' },
  { value: '6', label: 'Julio' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Septiembre' },
  { value: '9', label: 'Octubre' },
  { value: '10', label: 'Noviembre' },
  { value: '11', label: 'Diciembre' },
];

const SEASONS = [
  { value: 'semana_santa', label: 'Semana Santa', months: [2, 3] },
  { value: 'verano', label: 'Verano', months: [5, 6, 7] },
  { value: 'navidad', label: 'Navidad / Año Nuevo', months: [11, 0] },
  { value: 'puentes', label: 'Puentes', months: [10, 1, 4] },
];

export default function Statistics() {
  const { viewMode, isActualAdmin } = useContext(ViewModeContext);
  const { user: clerkUser, isLoaded } = useUser();

  // Convert Clerk user to app user format
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName || clerkUser.username,
    role: clerkUser.publicMetadata?.role || 'user',
    custom_role: clerkUser.publicMetadata?.custom_role
  } : null;

  const userLoading = !isLoaded;

  const [filters, setFilters] = useState({
    year: 'all',
    saleMonth: 'all',
    travelMonth: 'all',
    season: 'all',
    destination: 'all',
    client: 'all',
    provider: 'all',
    hotelChain: 'all',
    tripType: 'all',
    agent: 'all'
  });

  // Usar isActualAdmin del contexto (basado en isAdminEmail) en lugar de publicMetadata.role
  const isAdmin = isActualAdmin && viewMode === 'admin';

  const { data: soldTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['soldTrips', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return supabaseAPI.entities.SoldTrip.list();
      return supabaseAPI.entities.SoldTrip.filter({ created_by: user.email });
    },
    enabled: !!user && !userLoading
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      // Reusar soldTrips ya cargados para filtrar servicios en la BD
      // Usar join directo en Supabase para mayor eficiencia
      if (isAdmin) {
        return supabaseAPI.entities.TripService.list();
      }
      // Para usuarios, filtrar servicios por email del creador directamente
      return supabaseAPI.entities.TripService.filter({ created_by: user.email });
    },
    enabled: !!user && !userLoading
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return supabaseAPI.entities.Client.list();
      return supabaseAPI.entities.Client.filter({ created_by: user.email });
    },
    enabled: !!user && !userLoading
  });

  const { data: trips = [], isLoading: rawTripsLoading } = useQuery({
    queryKey: ['trips', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return supabaseAPI.entities.Trip.list();
      return supabaseAPI.entities.Trip.filter({ created_by: user.email });
    },
    enabled: !!user && !userLoading
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseAPI.entities.User.list(),
    enabled: !!user && isAdmin && !userLoading
  });

  const agents = allUsers.filter(u => u.role === 'user');

  const isLoading = tripsLoading || servicesLoading || clientsLoading || rawTripsLoading || usersLoading || userLoading;

  // Get available years
  const availableYears = useMemo(() => {
    if (!soldTrips.length) return [new Date().getFullYear()];
    const years = new Set();
    soldTrips.forEach(t => {
      if (t.created_date) years.add(getYear(parseISO(t.created_date)));
      if (t.start_date) years.add(getYear(parseISO(t.start_date)));
    });
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [soldTrips]);

  // Get unique destinations
  const uniqueDestinations = useMemo(() => {
    const dests = new Set();
    soldTrips.forEach(t => {
      if (t.destination) {
        t.destination.split(', ').forEach(d => dests.add(d));
      }
    });
    return Array.from(dests).sort();
  }, [soldTrips]);

  // Get unique hotel chains
  const uniqueHotelChains = useMemo(() => {
    const chains = new Set();
    services.forEach(s => {
      if (s.hotel_chain) chains.add(s.hotel_chain);
    });
    return Array.from(chains).sort();
  }, [services]);

  // Get unique providers
  const uniqueProviders = useMemo(() => {
    const providers = new Set();
    services.forEach(s => {
      if (s.reserved_by) providers.add(s.reserved_by);
    });
    return Array.from(providers);
  }, [services]);

  // Filter data
  const filteredData = useMemo(() => {
    let filteredTrips = [...soldTrips];
    let filteredServices = [...services];

    // Filter by agent (only for admin)
    if (isAdmin && filters.agent !== 'all') {
      filteredTrips = filteredTrips.filter(t => t.created_by === filters.agent);
    }

    // Filter by year
    if (filters.year !== 'all') {
      const year = parseInt(filters.year);
      filteredTrips = filteredTrips.filter(t => {
        const saleYear = t.created_date ? getYear(parseISO(t.created_date)) : null;
        const travelYear = t.start_date ? getYear(parseISO(t.start_date)) : null;
        return saleYear === year || travelYear === year;
      });
    }

    // Filter by sale month
    if (filters.saleMonth !== 'all') {
      const month = parseInt(filters.saleMonth);
      filteredTrips = filteredTrips.filter(t => {
        if (!t.created_date) return false;
        return getMonth(parseISO(t.created_date)) === month;
      });
    }

    // Filter by travel month
    if (filters.travelMonth !== 'all') {
      const month = parseInt(filters.travelMonth);
      filteredTrips = filteredTrips.filter(t => {
        if (!t.start_date) return false;
        return getMonth(parseISO(t.start_date)) === month;
      });
    }

    // Filter by season
    if (filters.season !== 'all') {
      const season = SEASONS.find(s => s.value === filters.season);
      if (season) {
        filteredTrips = filteredTrips.filter(t => {
          if (!t.start_date) return false;
          const month = getMonth(parseISO(t.start_date));
          return season.months.includes(month);
        });
      }
    }

    // Filter by destination
    if (filters.destination !== 'all') {
      filteredTrips = filteredTrips.filter(t => 
        t.destination?.includes(filters.destination)
      );
    }

    // Filter by client
    if (filters.client !== 'all') {
      filteredTrips = filteredTrips.filter(t => t.client_id === filters.client);
    }

    // Get trip IDs for service filtering
    const tripIds = new Set(filteredTrips.map(t => t.id));
    filteredServices = filteredServices.filter(s => tripIds.has(s.sold_trip_id));

    // Filter services by provider
    if (filters.provider !== 'all') {
      filteredServices = filteredServices.filter(s => s.reserved_by === filters.provider);
    }

    // Filter services by hotel chain
    if (filters.hotelChain !== 'all') {
      filteredServices = filteredServices.filter(s => s.hotel_chain === filters.hotelChain);
    }

    return { filteredTrips, filteredServices };
  }, [soldTrips, services, filters, isAdmin]);

  const clearFilters = () => {
    setFilters({
      year: 'all',
      saleMonth: 'all',
      travelMonth: 'all',
      season: 'all',
      destination: 'all',
      client: 'all',
      provider: 'all',
      hotelChain: 'all',
      tripType: 'all',
      agent: 'all'
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([, value]) => value !== 'all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-800">
            {isAdmin ? 'Progreso de Agentes' : 'Mi Progreso'}
          </h1>
          <p className="text-stone-500 mt-1">
            {isAdmin ? 'Análisis de desempeño y estadísticas por agente' : 'Análisis de ventas, tendencias y desempeño'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-stone-700">{filteredData.filteredTrips.length} viajes</p>
            <p className="text-xs text-stone-400">
              {soldTrips.length > filteredData.filteredTrips.length ? `de ${soldTrips.length} totales` : 'en total'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-stone-500" />
          <span className="text-sm font-medium text-stone-700">Filtros</span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs">
              <X className="w-3 h-3 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isAdmin && (
            <Select value={filters.agent} onValueChange={(v) => setFilters({...filters, agent: v})}>
              <SelectTrigger className="rounded-xl text-xs">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los agentes</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.email} value={a.email}>{a.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={filters.year} onValueChange={(v) => setFilters({...filters, year: v})}>
            <SelectTrigger className="rounded-xl text-xs">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los años</SelectItem>
              {availableYears.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.saleMonth} onValueChange={(v) => setFilters({...filters, saleMonth: v})}>
            <SelectTrigger className="rounded-xl text-xs">
              <SelectValue placeholder="Mes de venta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (venta)</SelectItem>
              {MONTHS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.travelMonth} onValueChange={(v) => setFilters({...filters, travelMonth: v})}>
            <SelectTrigger className="rounded-xl text-xs">
              <SelectValue placeholder="Mes de viaje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (viaje)</SelectItem>
              {MONTHS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.season} onValueChange={(v) => setFilters({...filters, season: v})}>
            <SelectTrigger className="rounded-xl text-xs">
              <SelectValue placeholder="Temporada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las temporadas</SelectItem>
              {SEASONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.destination} onValueChange={(v) => setFilters({...filters, destination: v})}>
            <SelectTrigger className="rounded-xl text-xs">
              <SelectValue placeholder="Destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los destinos</SelectItem>
              {uniqueDestinations.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.client} onValueChange={(v) => setFilters({...filters, client: v})}>
            <SelectTrigger className="rounded-xl text-xs">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.provider} onValueChange={(v) => setFilters({...filters, provider: v})}>
            <SelectTrigger className="rounded-xl text-xs">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {uniqueProviders.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.hotelChain} onValueChange={(v) => setFilters({...filters, hotelChain: v})}>
            <SelectTrigger className="rounded-xl text-xs">
              <SelectValue placeholder="Cadena hotelera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las cadenas</SelectItem>
              {uniqueHotelChains.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty state when no data */}
      {soldTrips.length === 0 && !isLoading && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-stone-100 text-center">
          <TrendingUp className="w-14 h-14 mx-auto mb-4 text-stone-200" />
          <h3 className="text-lg font-semibold text-stone-700 mb-2">Sin datos de ventas</h3>
          <p className="text-stone-400 text-sm max-w-md mx-auto">
            {isAdmin
              ? 'No se encontraron viajes vendidos en el sistema.'
              : 'Aún no tienes viajes vendidos registrados. Las estadísticas aparecerán aquí una vez que registres ventas.'}
          </p>
        </div>
      )}

      {/* No results with current filters */}
      {soldTrips.length > 0 && filteredData.filteredTrips.length === 0 && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-center gap-3">
          <Filter className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Sin resultados para los filtros actuales</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Hay {soldTrips.length} viajes en total, pero ninguno coincide con los filtros seleccionados.
              {' '}<button onClick={clearFilters} className="underline font-medium">Limpiar filtros</button>
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={isAdmin ? "agent-comparison" : "general"} className="space-y-6">
        <TabsList className="bg-white border border-stone-200 p-1 rounded-xl flex-wrap h-auto">
          {isAdmin && (
            <TabsTrigger value="agent-comparison" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
              Comparación de Agentes
            </TabsTrigger>
          )}
          <TabsTrigger value="general" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
            General
          </TabsTrigger>
          <TabsTrigger value="sold-trips" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
            Viajes Vendidos
          </TabsTrigger>
          <TabsTrigger value="pending-trips" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
            En Proceso / Perdidos
          </TabsTrigger>
          <TabsTrigger value="destinations" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
            Destinos
          </TabsTrigger>
          <TabsTrigger value="seasonality" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
            Temporadas
          </TabsTrigger>
          <TabsTrigger value="trip-types" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
            Tipos de Viaje
          </TabsTrigger>
          <TabsTrigger value="hotels" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
            Hoteles
          </TabsTrigger>
          <TabsTrigger value="providers" className="rounded-lg text-xs data-[state=active]:bg-[#2E442A] data-[state=active]:text-white">
            Proveedores
          </TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="agent-comparison">
            <AgentComparisonStats 
              soldTrips={filteredData.filteredTrips}
              allUsers={allUsers}
            />
          </TabsContent>
        )}

        <TabsContent value="general">
          <GeneralStats 
            soldTrips={filteredData.filteredTrips} 
            services={filteredData.filteredServices}
            clients={clients}
            allSoldTrips={soldTrips}
          />
        </TabsContent>

        <TabsContent value="sold-trips">
          <SoldTripsStats 
            soldTrips={filteredData.filteredTrips} 
            services={filteredData.filteredServices}
          />
        </TabsContent>

        <TabsContent value="pending-trips">
          <PendingTripsStats trips={trips} />
        </TabsContent>

        <TabsContent value="destinations">
          <DestinationsChart 
            soldTrips={filteredData.filteredTrips}
            services={filteredData.filteredServices}
          />
        </TabsContent>

        <TabsContent value="seasonality">
          <SeasonalityChart 
            soldTrips={filteredData.filteredTrips}
            allSoldTrips={soldTrips}
          />
        </TabsContent>

        <TabsContent value="trip-types">
          <TripTypesChart 
            soldTrips={filteredData.filteredTrips}
            trips={trips}
          />
        </TabsContent>

        <TabsContent value="hotels">
          <HotelChainsChart 
            services={filteredData.filteredServices}
          />
        </TabsContent>

        <TabsContent value="providers">
          <ProvidersChart 
            services={filteredData.filteredServices}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}