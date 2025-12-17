import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInMonths, differenceInWeeks, differenceInDays, differenceInHours, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { parseLocalDate } from '@/components/utils/dateHelpers';

const getActiveTimeline = (startDate) => {
  const tripDate = parseLocalDate(startDate);
  const now = new Date();
  const daysUntil = differenceInDays(tripDate, now);

  // Only show reminders within 3 days of each milestone
  if (daysUntil <= 1) return '24_hours';
  if (daysUntil >= 2 && daysUntil <= 3) return '72-48_hours';
  if (daysUntil >= 12 && daysUntil <= 14) return '1-2_weeks';
  if (daysUntil >= 19 && daysUntil <= 21) return '3_weeks';
  if (daysUntil >= 28 && daysUntil <= 30) return '1_month';
  if (daysUntil >= 43 && daysUntil <= 45) return '1.5_months';
  if (daysUntil >= 88 && daysUntil <= 90) return '3_months';
  if (daysUntil >= 178 && daysUntil <= 180) return '6_months';
  
  return null;
};

const TIMELINE_LABELS = {
  '6_months': '6 meses antes',
  '3_months': '3 meses antes',
  '1.5_months': '1.5 meses antes',
  '1_month': '1 mes antes',
  '3_weeks': '3 semanas antes',
  '1-2_weeks': '1-2 semanas antes',
  '72-48_hours': '72-48 horas antes',
  '24_hours': '24 horas antes'
};

export default function ActiveReminders({ userEmail, isAdmin }) {
  const queryClient = useQueryClient();

  const { data: soldTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['soldTrips', userEmail, isAdmin],
    queryFn: async () => {
      if (!userEmail) return [];
      if (isAdmin) return base44.entities.SoldTrip.list();
      return base44.entities.SoldTrip.filter({ created_by: userEmail });
    },
    enabled: !!userEmail
  });

  const { data: allReminders = [], isLoading: remindersLoading } = useQuery({
    queryKey: ['allReminders'],
    queryFn: () => base44.entities.TripReminder.list(),
    enabled: true
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TripReminder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReminders'] });
    }
  });

  if (tripsLoading || remindersLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4" style={{ color: '#2E442A' }} />
          <h2 className="font-semibold text-stone-800 text-sm">Recordatorios Activos</h2>
        </div>
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#2E442A' }} />
        </div>
      </div>
    );
  }

  // Filter upcoming trips
  const upcomingTrips = soldTrips.filter(trip => {
    const tripDate = parseLocalDate(trip.start_date);
    return tripDate > new Date();
  });

  // Get active reminders for each trip
  const activeRemindersData = upcomingTrips.map(trip => {
    const activeTimeline = getActiveTimeline(trip.start_date);
    if (!activeTimeline) return null;

    const tripReminders = allReminders.filter(
      r => r.sold_trip_id === trip.id && 
           r.timeline_period === activeTimeline &&
           !r.completed
    );

    if (tripReminders.length === 0) return null;

    return {
      trip,
      timeline: activeTimeline,
      reminders: tripReminders
    };
  }).filter(Boolean);

  if (activeRemindersData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4" style={{ color: '#2E442A' }} />
          <h2 className="font-semibold text-stone-800 text-sm">Recordatorios Activos</h2>
        </div>
        <div className="text-center py-6">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-50" />
          <p className="text-xs text-stone-500">No hay recordatorios pendientes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4" style={{ color: '#2E442A' }} />
        <h2 className="font-semibold text-stone-800 text-sm">Recordatorios Activos</h2>
        <Badge variant="secondary" className="text-xs">{activeRemindersData.reduce((sum, d) => sum + d.reminders.length, 0)}</Badge>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto">
        {activeRemindersData.map(({ trip, timeline, reminders }) => (
          <div key={trip.id} className="border border-stone-200 rounded-xl p-3 space-y-2">
            <Link to={createPageUrl(`SoldTripDetail?id=${trip.id}`)} className="block">
              <div className="flex items-start gap-2 mb-2 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2E442A15' }}>
                  <MapPin className="w-3.5 h-3.5" style={{ color: '#2E442A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 truncate text-sm">{trip.client_name}</p>
                  <p className="text-xs text-stone-500">{trip.destination} • {format(parseLocalDate(trip.start_date), 'd MMM', { locale: es })}</p>
                </div>
                <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0 flex-shrink-0">
                  {TIMELINE_LABELS[timeline]}
                </Badge>
              </div>
            </Link>

            <div className="space-y-1.5">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateReminderMutation.mutate({
                          id: reminder.id,
                          data: {
                            completed: true,
                            completed_date: new Date().toISOString()
                          }
                        });
                      }
                    }}
                    className="mt-0.5"
                  />
                  <p className="text-xs text-stone-700 flex-1">{reminder.task}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}