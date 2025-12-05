import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Loader2, Search, Filter, DollarSign, 
  Check, X, Download
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const BOOKED_BY_LABELS = {
  montecito: 'Montecito',
  iata_nomad: 'IATA Nomad'
};

const RESERVED_BY_LABELS = {
  virtuoso: 'Virtuoso',
  preferred_partner: 'Preferred Partner',
  tbo: 'TBO',
  expedia_taap: 'Expedia TAAP',
  ratehawk: 'RateHawk',
  tablet_hotels: 'Tablet Hotels',
  dmc: 'DMC',
  otro: 'Otro'
};

const SERVICE_TYPE_LABELS = {
  hotel: 'Hotel',
  vuelo: 'Vuelo',
  traslado: 'Traslado',
  tour: 'Tour',
  otro: 'Otro'
};

export default function Commissions() {
  const [search, setSearch] = useState('');
  const [filterPaid, setFilterPaid] = useState('all');
  const [filterBookedBy, setFilterBookedBy] = useState('all');

  const queryClient = useQueryClient();

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['allServices'],
    queryFn: () => base44.entities.TripService.list()
  });

  const { data: soldTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => base44.entities.SoldTrip.list()
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TripService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
    }
  });

  const updateSoldTripMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SoldTrip.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
    }
  });

  const togglePaid = (service) => {
    updateServiceMutation.mutate({
      id: service.id,
      data: { commission_paid: !service.commission_paid }
    });
  };

  // Create a map of sold trips for quick lookup
  const tripsMap = soldTrips.reduce((acc, trip) => {
    acc[trip.id] = trip;
    return acc;
  }, {});

  // Filter and sort services
  const filteredServices = services
    .filter(s => s.commission > 0) // Only show services with commission
    .filter(s => {
      const trip = tripsMap[s.sold_trip_id];
      const clientName = trip?.client_name || '';
      const matchesSearch = clientName.toLowerCase().includes(search.toLowerCase()) ||
                           (s.hotel_name || '').toLowerCase().includes(search.toLowerCase()) ||
                           (s.airline || '').toLowerCase().includes(search.toLowerCase());
      const matchesPaid = filterPaid === 'all' || 
                         (filterPaid === 'paid' && s.commission_paid) || 
                         (filterPaid === 'unpaid' && !s.commission_paid);
      const matchesBookedBy = filterBookedBy === 'all' || s.booked_by === filterBookedBy;
      return matchesSearch && matchesPaid && matchesBookedBy;
    })
    .sort((a, b) => {
      const dateA = a.commission_payment_date ? new Date(a.commission_payment_date) : new Date(0);
      const dateB = b.commission_payment_date ? new Date(b.commission_payment_date) : new Date(0);
      return dateA - dateB;
    });

  const totalCommissions = filteredServices.reduce((sum, s) => sum + (s.commission || 0), 0);
  const paidCommissions = filteredServices.filter(s => s.commission_paid).reduce((sum, s) => sum + (s.commission || 0), 0);
  const pendingCommissions = totalCommissions - paidCommissions;

  const getServiceName = (service) => {
    switch (service.service_type) {
      case 'hotel': return service.hotel_name || 'Hotel';
      case 'vuelo': return `${service.airline || 'Vuelo'} ${service.route || ''}`;
      case 'traslado': return `${service.transfer_origin || ''} → ${service.transfer_destination || ''}`;
      case 'tour': return service.tour_name || 'Tour';
      default: return service.other_name || 'Servicio';
    }
  };

  const isLoading = servicesLoading || tripsLoading;

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
          <h1 className="text-2xl font-bold text-stone-800">Comisiones</h1>
          <p className="text-stone-500 text-sm mt-1">Control de comisiones por servicio</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Total</p>
          <p className="text-xl font-bold" style={{ color: '#2E442A' }}>${totalCommissions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Pagadas</p>
          <p className="text-xl font-bold text-green-600">${paidCommissions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Pendientes</p>
          <p className="text-xl font-bold text-orange-500">${pendingCommissions.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Buscar por cliente o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterPaid} onValueChange={setFilterPaid}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="paid">Pagadas</SelectItem>
            <SelectItem value="unpaid">Pendientes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBookedBy} onValueChange={setFilterBookedBy}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Bookeado por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="montecito">Montecito</SelectItem>
            <SelectItem value="iata_nomad">IATA Nomad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600">Pagada</th>
                <th className="text-left p-3 font-semibold text-stone-600">Cliente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Servicio</th>
                <th className="text-left p-3 font-semibold text-stone-600">Tipo</th>
                <th className="text-left p-3 font-semibold text-stone-600">Bookeado por</th>
                <th className="text-left p-3 font-semibold text-stone-600">Reservado por</th>
                <th className="text-left p-3 font-semibold text-stone-600">Fecha Pago</th>
                <th className="text-right p-3 font-semibold text-stone-600">Comisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredServices.map((service) => {
                const trip = tripsMap[service.sold_trip_id];
                return (
                  <tr key={service.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3">
                      <Checkbox
                        checked={service.commission_paid || false}
                        onCheckedChange={() => togglePaid(service)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-stone-800">{trip?.client_name || '-'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-700">{getServiceName(service)}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {SERVICE_TYPE_LABELS[service.service_type] || service.service_type}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-600">
                        {BOOKED_BY_LABELS[service.booked_by] || '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-600">
                        {RESERVED_BY_LABELS[service.reserved_by] || service.flight_consolidator || '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-500">
                        {service.commission_payment_date 
                          ? format(new Date(service.commission_payment_date), 'd MMM yy', { locale: es })
                          : '-'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${service.commission_paid ? 'text-green-600' : 'text-stone-800'}`}>
                        ${(service.commission || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p>No hay comisiones que mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
}