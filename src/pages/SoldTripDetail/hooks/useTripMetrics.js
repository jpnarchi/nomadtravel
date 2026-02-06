import { useMemo } from 'react';
import { differenceInDays, isPast } from 'date-fns';
import { parseLocalDate } from '@/components/utils/dateHelpers';

export function useTripMetrics(soldTrip, services, clientPayments, supplierPayments) {
  return useMemo(() => {
    if (!soldTrip) return null;

    const totalServices = services.reduce((sum, s) => sum + (s.total_price || 0), 0);
    const totalCommissions = services.reduce((sum, s) => sum + (s.commission || 0), 0);
    const totalClientPaid = clientPayments.reduce((sum, p) => {
      return sum + (p.amount_usd_fixed || p.amount || 0);
    }, 0);
    const totalSupplierPaid = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calcular el total de servicios que el cliente debe pagar
    // Excluyendo los servicios marcados como "pagado" (pagados directamente al proveedor)
    const totalServicesToPay = services.reduce((sum, s) => {
      // Check reservation_status in both direct field and metadata
      const reservationStatus = s.reservation_status || s.metadata?.reservation_status;
      if (reservationStatus === 'pagado') return sum;
      return sum + (s.total_price || s.price || 0);
    }, 0);

    const clientBalance = totalServicesToPay - totalClientPaid;
    const paymentProgress = totalServices > 0 ? Math.round((totalClientPaid / totalServices) * 100) : 0;

    const daysUntilTrip = differenceInDays(parseLocalDate(soldTrip.start_date), new Date());
    const isTripPast = isPast(parseLocalDate(soldTrip.start_date));

    // Pending payment alerts
    const today = new Date();
    const pendingPaymentAlerts = services.filter(service => {
      const paymentDueDate = service.payment_due_date || service.metadata?.payment_due_date;
      if (!paymentDueDate) return false;

      // Check reservation_status in both direct field and metadata
      const reservationStatus = service.reservation_status || service.metadata?.reservation_status;
      if (reservationStatus === 'pagado') return false;

      const dueDate = parseLocalDate(paymentDueDate);
      const daysUntilDue = differenceInDays(dueDate, today);
      return daysUntilDue <= 30;
    }).map(service => {
      const paymentDueDate = service.payment_due_date || service.metadata?.payment_due_date;
      const dueDate = parseLocalDate(paymentDueDate);
      const daysUntilDue = differenceInDays(dueDate, today);
      const isOverdue = daysUntilDue < 0;
      return { ...service, daysUntilDue, isOverdue };
    }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // Group services by type
    const servicesByType = services.reduce((acc, s) => {
      if (!acc[s.service_type]) acc[s.service_type] = [];
      acc[s.service_type].push(s);
      return acc;
    }, {});

    return {
      totalServices,
      totalCommissions,
      totalClientPaid,
      totalSupplierPaid,
      clientBalance,
      paymentProgress,
      daysUntilTrip,
      isTripPast,
      pendingPaymentAlerts,
      servicesByType
    };
  }, [soldTrip, services, clientPayments, supplierPayments]);
}
