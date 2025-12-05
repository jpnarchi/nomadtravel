import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, MapPin, Calendar, Users, DollarSign, 
  Eye, Loader2, CheckCircle, Filter, TrendingUp,
  AlertCircle, Clock, ArrowUpRight, Plane
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import EmptyState from '@/components/ui/EmptyState';
import StatsCard from '@/components/ui/StatsCard';

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  parcial: { label: 'Pago Parcial', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completado: { label: 'Completado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
};

export default function SoldTrips() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: allSoldTrips = [], isLoading } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => base44.entities.SoldTrip.list('-created_date')
  });

  // Filter trips based on user role
  const soldTrips = isAdmin ? allSoldTrips : allSoldTrips.filter(t => t.created_by === user?.email);

  // Calculate stats
  const totalRevenue = soldTrips.reduce((sum, t) => sum + (t.total_price || 0), 0);
  const totalCommissions = soldTrips.reduce((sum, t) => sum + (t.total_commission || 0), 0);
  const totalCollected = soldTrips.reduce((sum, t) => sum + (t.total_paid_by_client || 0), 0);
  const pendingCollection = totalRevenue - totalCollected;

  // Filter and sort
  let filteredTrips = soldTrips.filter(trip => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (
      trip.client_name?.toLowerCase().includes(searchLower) ||
      trip.destination?.toLowerCase().includes(searchLower)
    );
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort
  filteredTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'date':
        return new Date(a.start_date) - new Date(b.start_date);
      case 'price_high':
        return (b.total_price || 0) - (a.total_price || 0);
      case 'price_low':
        return (a.total_price || 0) - (b.total_price || 0);
      case 'pending':
        const aPending = (a.total_price || 0) - (a.total_paid_by_client || 0);
        const bPending = (b.total_price || 0) - (b.total_paid_by_client || 0);
        return bPending - aPending;
      default:
        return 0;
    }
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
        <p className="text-stone-500 mt-1">Gestiona tus viajes cerrados y su seguimiento financiero</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Vendido"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle={`${soldTrips.length} viajes`}
          icon={DollarSign}
        />
        <StatsCard
          title="Comisiones Ganadas"
          value={`$${totalCommissions.toLocaleString()}`}
          subtitle="Total acumulado"
          icon={TrendingUp}
        />
        <StatsCard
          title="Cobrado"
          value={`$${totalCollected.toLocaleString()}`}
          subtitle={`${totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}% del total`}
          icon={CheckCircle}
          color="#22c55e"
        />
        <StatsCard
          title="Por Cobrar"
          value={`$${pendingCollection.toLocaleString()}`}
          subtitle="Saldo pendiente"
          icon={AlertCircle}
          color="#f59e0b"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Buscar por cliente o destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-stone-200"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-xl">
                <Filter className="w-4 h-4 mr-2 text-stone-400" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="parcial">Pago Parcial</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 rounded-xl">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="date">Fecha de viaje</SelectItem>
                <SelectItem value="price_high">Mayor precio</SelectItem>
                <SelectItem value="price_low">Menor precio</SelectItem>
                <SelectItem value="pending">Mayor saldo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title={search || statusFilter !== 'all' ? "Sin resultados" : "Sin viajes vendidos"}
          description={search || statusFilter !== 'all' ? "No se encontraron viajes con esos filtros" : "Cuando un viaje pase a 'Vendido' aparecerá aquí"}
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTrips.map((trip, index) => {
              const statusConfig = STATUS_CONFIG[trip.status] || STATUS_CONFIG.pendiente;
              const StatusIcon = statusConfig.icon;
              const balance = (trip.total_price || 0) - (trip.total_paid_by_client || 0);
              const paymentProgress = trip.total_price > 0 
                ? Math.round((trip.total_paid_by_client || 0) / trip.total_price * 100) 
                : 0;
              
              const daysUntilTrip = differenceInDays(new Date(trip.start_date), new Date());
              const isTripPast = isPast(new Date(trip.start_date));
              
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left Section - Trip Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#2E442A' }}
                          >
                            <Plane className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-stone-800 truncate">
                                {trip.client_name}
                              </h3>
                              <Badge className={`${statusConfig.color} font-medium text-xs flex-shrink-0`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-stone-600 mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#2E442A' }} />
                              <span className="font-medium truncate">{trip.destination}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  {format(new Date(trip.start_date), 'd MMM yyyy', { locale: es })}
                                  {trip.end_date && ` - ${format(new Date(trip.end_date), 'd MMM', { locale: es })}`}
                                </span>
                              </div>
                              {trip.travelers && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{trip.travelers} viajero(s)</span>
                                </div>
                              )}
                              {!isTripPast && daysUntilTrip <= 30 && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${daysUntilTrip <= 7 ? 'border-red-300 text-red-600' : 'border-orange-300 text-orange-600'}`}
                                >
                                  {daysUntilTrip === 0 ? '¡Hoy!' : `En ${daysUntilTrip} días`}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section - Financial */}
                      <div className="lg:w-72 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-xs text-stone-400">Total</p>
                            <p className="font-bold text-sm" style={{ color: '#2E442A' }}>
                              ${(trip.total_price || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">Comisión</p>
                            <p className="font-semibold text-sm text-stone-700">
                              ${(trip.total_commission || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">Saldo</p>
                            <p className={`font-bold text-sm ${balance > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                              ${balance.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-stone-400">Progreso de pago</span>
                            <span className="font-medium" style={{ color: '#2E442A' }}>{paymentProgress}%</span>
                          </div>
                          <Progress 
                            value={paymentProgress} 
                            className="h-2"
                            style={{ 
                              '--progress-background': paymentProgress === 100 ? '#22c55e' : '#2E442A'
                            }}
                          />
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex lg:flex-col gap-2 lg:w-32">
                        <Link 
                          to={createPageUrl(`SoldTripDetail?id=${trip.id}`)}
                          className="flex-1"
                        >
                          <Button 
                            className="w-full rounded-xl text-white"
                            style={{ backgroundColor: '#2E442A' }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalle
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Footer */}
                  <div className="bg-stone-50 px-5 py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-stone-400">
                        Pagado: <span className="text-green-600 font-semibold">${(trip.total_paid_by_client || 0).toLocaleString()}</span>
                      </span>
                      <span className="text-stone-400">
                        A proveedores: <span className="text-stone-600 font-semibold">${(trip.total_paid_to_suppliers || 0).toLocaleString()}</span>
                      </span>
                    </div>
                    <Link 
                      to={createPageUrl(`SoldTripDetail?id=${trip.id}`)}
                      className="flex items-center text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      Gestionar <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}