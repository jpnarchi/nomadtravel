import { useQuery } from '@tanstack/react-query';
import { supabaseAPI } from '@/api/supabaseClient';

export function useTripData(tripId) {
  const { data: soldTrip, isLoading: tripLoading } = useQuery({
    queryKey: ['soldTrip', tripId],
    queryFn: async () => {
      const trips = await supabaseAPI.entities.SoldTrip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId,
    refetchOnWindowFocus: false
  });

  const { data: services = [] } = useQuery({
    queryKey: ['tripServices', tripId],
    queryFn: async () => {
      const rawServices = await supabaseAPI.entities.TripService.filter({ sold_trip_id: tripId });
      return rawServices.map(service => ({
        ...service,
        ...(service.metadata || {}),
        id: service.id,
        service_type: service.service_type,
        service_name: service.service_name,
        sold_trip_id: service.sold_trip_id,
        total_price: service.price || 0,
        commission: service.commission,
        notes: service.notes,
        created_by: service.created_by,
        created_date: service.created_date,
        updated_date: service.updated_date
      }));
    },
    enabled: !!tripId
  });

  const { data: clientPayments = [] } = useQuery({
    queryKey: ['clientPayments', tripId],
    queryFn: () => supabaseAPI.entities.ClientPayment.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: supplierPayments = [] } = useQuery({
    queryKey: ['supplierPayments', tripId],
    queryFn: () => supabaseAPI.entities.SupplierPayment.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: paymentPlan = [] } = useQuery({
    queryKey: ['paymentPlan', tripId],
    queryFn: () => supabaseAPI.entities.ClientPaymentPlan.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: tripNotes = [] } = useQuery({
    queryKey: ['tripNotes', tripId],
    queryFn: () => supabaseAPI.entities.TripNote.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: tripDocuments = [] } = useQuery({
    queryKey: ['tripDocuments', tripId],
    queryFn: () => supabaseAPI.entities.TripDocumentFile.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: tripReminders = [] } = useQuery({
    queryKey: ['tripReminders', tripId],
    queryFn: () => supabaseAPI.entities.TripReminder.filter({ sold_trip_id: tripId }),
    enabled: !!tripId
  });

  return {
    soldTrip,
    tripLoading,
    services,
    clientPayments,
    supplierPayments,
    paymentPlan,
    tripNotes,
    tripDocuments,
    tripReminders
  };
}
