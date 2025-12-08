import React, { useState, useEffect, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DollarSign, Plane, Users, TrendingUp, Loader2 } from 'lucide-react';
import { ViewModeContext } from '@/Layout';
import StatsCard from '@/components/ui/StatsCard';
import FunnelChart from '@/components/dashboard/FunnelChart';
import UpcomingTrips from '@/components/dashboard/UpcomingTrips';
import TasksList from '@/components/dashboard/TasksList';
import UpcomingPayments from '@/components/dashboard/UpcomingPayments';

export default function Dashboard() {
  const { viewMode } = useContext(ViewModeContext);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

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

  const isAdmin = user?.role === 'admin' && viewMode === 'admin';

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.Trip.list();
      return base44.entities.Trip.filter({ created_by: user.email });
    },
    enabled: !!user
  });

  const { data: soldTrips = [], isLoading: soldLoading } = useQuery({
    queryKey: ['soldTrips', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.SoldTrip.list();
      return base44.entities.SoldTrip.filter({ created_by: user.email });
    },
    enabled: !!user
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.Client.list();
      return base44.entities.Client.filter({ created_by: user.email });
    },
    enabled: !!user
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.Task.list();
      return base44.entities.Task.filter({ created_by: user.email });
    },
    enabled: !!user
  });

  const soldTripIds = soldTrips.map(t => t.id);
  const { data: services = [] } = useQuery({
    queryKey: ['services', soldTripIds],
    queryFn: async () => {
      if (soldTripIds.length === 0) return [];
      return base44.entities.TripService.list();
    },
    enabled: soldTripIds.length > 0
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  // Calculate monthly sales
  const thisMonth = {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  };

  const monthlySales = soldTrips
    .filter(trip => {
      const created = new Date(trip.created_date);
      return isWithinInterval(created, thisMonth);
    })
    .reduce((sum, trip) => sum + (trip.total_price || 0), 0);

  const monthlyCommission = soldTrips
    .filter(trip => {
      const created = new Date(trip.created_date);
      return isWithinInterval(created, thisMonth);
    })
    .reduce((sum, trip) => sum + (trip.total_commission || 0), 0);

  const isLoading = tripsLoading || soldLoading;

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
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 mt-1">Bienvenido a Nomad Travel Society</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas del Mes"
          value={`$${monthlySales.toLocaleString()}`}
          subtitle="USD"
          icon={DollarSign}
        />
        <StatsCard
          title="Comisiones del Mes"
          value={`$${monthlyCommission.toLocaleString()}`}
          subtitle="USD"
          icon={TrendingUp}
        />
        <StatsCard
          title="Viajes Activos"
          value={trips.length}
          subtitle="En proceso"
          icon={Plane}
        />
        <StatsCard
          title="Clientes"
          value={clients.length}
          subtitle="Total registrados"
          icon={Users}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Funnel Chart */}
        <div className="lg:col-span-1">
          <FunnelChart trips={trips} />
        </div>

        {/* Upcoming Trips */}
        <div className="lg:col-span-1">
          <UpcomingTrips soldTrips={soldTrips} />
        </div>

        {/* Upcoming Payments */}
        <div className="lg:col-span-1">
          <UpcomingPayments services={services} soldTrips={soldTrips} />
        </div>

        {/* Tasks */}
        <div className="lg:col-span-1">
          <TasksList
            tasks={tasks}
            onToggle={(task) => updateTaskMutation.mutate({ 
              id: task.id, 
              data: { completed: !task.completed } 
            })}
            onDelete={(task) => deleteTaskMutation.mutate(task.id)}
            onCreate={(data) => createTaskMutation.mutate(data)}
          />
        </div>
      </div>
    </div>
  );
}