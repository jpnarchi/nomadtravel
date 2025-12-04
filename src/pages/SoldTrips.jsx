import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, MapPin, Calendar, Users, DollarSign, 
  Eye, Loader2, CheckCircle 
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from '@/components/ui/EmptyState';

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  parcial: { label: 'Pago Parcial', color: 'bg-blue-100 text-blue-700' },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  completado: { label: 'Completado', color: 'bg-emerald-100 text-emerald-800' }
};

export default function SoldTrips() {
  const [search, setSearch] = useState('');

  const { data: soldTrips = [], isLoading } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => base44.entities.SoldTrip.list('-created_date')
  });

  const filteredTrips = soldTrips.filter(trip => {
    const searchLower = search.toLowerCase();
    return (
      trip.client_name?.toLowerCase().includes(searchLower) ||
      trip.destination?.toLowerCase().includes(searchLower)
    );
  });

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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-stone-800">Viajes Vendidos</h1>
        <p className="text-stone-500 mt-1">{soldTrips.length} viajes vendidos</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Buscar por cliente o destino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title={search ? "Sin resultados" : "Sin viajes vendidos"}
          description={search ? "No se encontraron viajes con esa búsqueda" : "Cuando un viaje pase a 'Vendido' aparecerá aquí"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTrips.map((trip, index) => {
              const statusConfig = STATUS_CONFIG[trip.status] || STATUS_CONFIG.pendiente;
              
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={`${statusConfig.color} font-medium text-xs`}>
                      {statusConfig.label}
                    </Badge>
                    <Link to={createPageUrl(`SoldTripDetail?id=${trip.id}`)}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-600">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>

                  <h3 className="font-semibold text-stone-800 mb-1">{trip.client_name}</h3>
                  
                  <div className="flex items-center gap-1 text-stone-600 mb-3">
                    <MapPin className="w-4 h-4" style={{ color: '#2E442A' }} />
                    <span className="font-medium">{trip.destination}</span>
                  </div>

                  <div className="space-y-1.5 text-sm text-stone-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(trip.start_date), 'd MMM yyyy', { locale: es })}
                        {trip.end_date && ` - ${format(new Date(trip.end_date), 'd MMM', { locale: es })}`}
                      </span>
                    </div>
                    {trip.travelers && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{trip.travelers} viajero(s)</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Total viaje</span>
                      <span className="font-bold" style={{ color: '#2E442A' }}>
                        ${(trip.total_price || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Comisión</span>
                      <span className="font-medium text-stone-600">
                        ${(trip.total_commission || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-400">Pagado cliente</span>
                      <span className="font-medium text-green-600">
                        ${(trip.total_paid_by_client || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Link 
                    to={createPageUrl(`SoldTripDetail?id=${trip.id}`)}
                    className="block mt-4"
                  >
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl text-sm"
                      style={{ borderColor: '#2E442A', color: '#2E442A' }}
                    >
                      Ver Detalles
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}