import React from 'react';
import { differenceInMonths, differenceInWeeks, differenceInDays, differenceInHours } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle } from 'lucide-react';

const getActiveTimeline = (startDate) => {
  const tripDate = new Date(startDate);
  const now = new Date();
  const monthsUntil = differenceInMonths(tripDate, now);
  const weeksUntil = differenceInWeeks(tripDate, now);
  const daysUntil = differenceInDays(tripDate, now);
  const hoursUntil = differenceInHours(tripDate, now);

  if (monthsUntil >= 6) return '6_months';
  if (monthsUntil >= 3) return '3_months';
  if (monthsUntil >= 1.5) return '1.5_months';
  if (monthsUntil >= 1) return '1_month';
  if (weeksUntil >= 3) return '3_weeks';
  if (weeksUntil >= 1) return '1-2_weeks';
  if (hoursUntil >= 48) return '72-48_hours';
  if (hoursUntil > 0) return '24_hours';
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

export default function ActiveTripReminders({ startDate, reminders = [], onUpdate }) {
  const activeTimeline = getActiveTimeline(startDate);

  if (!activeTimeline) return null;

  const activeReminders = reminders.filter(
    r => r.timeline_period === activeTimeline && !r.completed
  );

  if (activeReminders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5" style={{ color: '#2E442A' }} />
          <h3 className="font-semibold text-stone-800">Recordatorios Pendientes</h3>
        </div>
        <div className="text-center py-6">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-50" />
          <p className="text-sm text-stone-500">Todo listo en esta etapa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5" style={{ color: '#2E442A' }} />
        <h3 className="font-semibold text-stone-800">Recordatorios Pendientes</h3>
        <Badge className="bg-blue-500 text-white">{TIMELINE_LABELS[activeTimeline]}</Badge>
      </div>

      <div className="space-y-3">
        {activeReminders.map((reminder) => (
          <div
            key={reminder.id}
            className="p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onUpdate(reminder.id, {
                      completed: true,
                      completed_date: new Date().toISOString()
                    });
                  }
                }}
                className="mt-0.5"
              />
              <p className="text-sm text-stone-700 flex-1">{reminder.task}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}