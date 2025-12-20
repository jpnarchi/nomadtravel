import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const issues = [];
    
    // Timezone de referencia (America/Monterrey = UTC-6)
    const TIMEZONE_OFFSET = -6;

    function checkDateShift(date, recordId, entityName, fieldName) {
      if (!date) return null;
      
      const dateObj = new Date(date);
      const utcHour = dateObj.getUTCHours();
      const utcDay = dateObj.getUTCDate();
      
      // Convertir a America/Monterrey
      const localDate = new Date(dateObj.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
      const localDay = localDate.getUTCDate();
      
      // Si la hora UTC es cercana a medianoche (00:00-02:00 o 22:00-23:59)
      // Y el día local es diferente al día UTC
      if ((utcHour <= 2 || utcHour >= 22) && utcDay !== localDay) {
        return {
          recordId,
          entityName,
          fieldName,
          storedValue: date,
          utcDate: dateObj.toISOString(),
          localDate: localDate.toISOString(),
          dayShift: localDay - utcDay,
          reason: `Fecha guardada en UTC causa shift de día (UTC: día ${utcDay}, Local: día ${localDay})`
        };
      }
      
      return null;
    }

    // Auditar Trip
    const trips = await base44.asServiceRole.entities.Trip.list();
    for (const trip of trips) {
      const startIssue = checkDateShift(trip.start_date, trip.id, 'Trip', 'start_date');
      const endIssue = checkDateShift(trip.end_date, trip.id, 'Trip', 'end_date');
      if (startIssue) issues.push(startIssue);
      if (endIssue) issues.push(endIssue);
    }

    // Auditar SoldTrip
    const soldTrips = await base44.asServiceRole.entities.SoldTrip.list();
    for (const trip of soldTrips) {
      const startIssue = checkDateShift(trip.start_date, trip.id, 'SoldTrip', 'start_date');
      const endIssue = checkDateShift(trip.end_date, trip.id, 'SoldTrip', 'end_date');
      const saleIssue = checkDateShift(trip.sale_date, trip.id, 'SoldTrip', 'sale_date');
      if (startIssue) issues.push(startIssue);
      if (endIssue) issues.push(endIssue);
      if (saleIssue) issues.push(saleIssue);
    }

    // Auditar TripService (múltiples campos de fecha)
    const services = await base44.asServiceRole.entities.TripService.list();
    for (const service of services) {
      const dateFields = [
        'check_in', 'check_out', 'flight_date', 'tour_date', 
        'cruise_departure_date', 'cruise_arrival_date', 
        'train_date', 'dmc_date', 'other_date', 'quote_date',
        'payment_due_date', 'commission_payment_date'
      ];
      
      for (const field of dateFields) {
        const issue = checkDateShift(service[field], service.id, 'TripService', field);
        if (issue) issues.push(issue);
      }
    }

    // Auditar ClientPayment
    const clientPayments = await base44.asServiceRole.entities.ClientPayment.list();
    for (const payment of clientPayments) {
      const issue = checkDateShift(payment.date, payment.id, 'ClientPayment', 'date');
      if (issue) issues.push(issue);
    }

    // Auditar SupplierPayment
    const supplierPayments = await base44.asServiceRole.entities.SupplierPayment.list();
    for (const payment of supplierPayments) {
      const issue = checkDateShift(payment.date, payment.id, 'SupplierPayment', 'date');
      if (issue) issues.push(issue);
    }

    // Auditar ClientPaymentPlan
    const paymentPlans = await base44.asServiceRole.entities.ClientPaymentPlan.list();
    for (const plan of paymentPlans) {
      const dueIssue = checkDateShift(plan.due_date, plan.id, 'ClientPaymentPlan', 'due_date');
      const paidIssue = checkDateShift(plan.paid_date, plan.id, 'ClientPaymentPlan', 'paid_date');
      if (dueIssue) issues.push(dueIssue);
      if (paidIssue) issues.push(paidIssue);
    }

    // Auditar InternalCommission
    const commissions = await base44.asServiceRole.entities.InternalCommission.list();
    for (const comm of commissions) {
      const issue = checkDateShift(comm.payment_date, comm.id, 'InternalCommission', 'payment_date');
      if (issue) issues.push(issue);
    }

    return Response.json({
      success: true,
      totalIssues: issues.length,
      issues: issues,
      summary: {
        byEntity: issues.reduce((acc, issue) => {
          acc[issue.entityName] = (acc[issue.entityName] || 0) + 1;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error auditing dates:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});