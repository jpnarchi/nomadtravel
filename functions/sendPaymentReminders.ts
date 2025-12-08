import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all payment plans
    const allPaymentPlans = await base44.asServiceRole.entities.ClientPaymentPlan.list();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const remindersToSend = [];
    
    for (const plan of allPaymentPlans) {
      // Skip if already paid
      if (plan.status === 'pagado') continue;
      
      const dueDate = new Date(plan.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      // Check if we should send a reminder
      // Send reminder 7 days before, 3 days before, 1 day before, and on due date
      const shouldSendReminder = 
        (daysUntilDue === 7 || daysUntilDue === 3 || daysUntilDue === 1 || daysUntilDue === 0 || daysUntilDue < 0);
      
      // Don't send multiple reminders on the same day
      const lastReminderDate = plan.last_reminder_date ? new Date(plan.last_reminder_date) : null;
      const alreadySentToday = lastReminderDate && 
        lastReminderDate.getFullYear() === today.getFullYear() &&
        lastReminderDate.getMonth() === today.getMonth() &&
        lastReminderDate.getDate() === today.getDate();
      
      if (shouldSendReminder && !alreadySentToday) {
        // Get the sold trip info
        const trips = await base44.asServiceRole.entities.SoldTrip.filter({ id: plan.sold_trip_id });
        const soldTrip = trips[0];
        
        if (!soldTrip) continue;
        
        // Get client info
        const clients = await base44.asServiceRole.entities.Client.filter({ id: soldTrip.client_id });
        const client = clients[0];
        
        if (!client || !client.email) continue;
        
        remindersToSend.push({
          plan,
          soldTrip,
          client,
          daysUntilDue
        });
      }
    }
    
    // Send reminders
    const sentReminders = [];
    
    for (const reminder of remindersToSend) {
      const { plan, soldTrip, client, daysUntilDue } = reminder;
      
      let subject = '';
      let body = '';
      
      if (daysUntilDue < 0) {
        // Overdue
        subject = `⚠️ Pago Vencido - ${soldTrip.destination}`;
        body = `
Hola ${client.first_name},

Te recordamos que el pago #${plan.payment_number} de tu viaje a ${soldTrip.destination} está vencido.

Monto: $${plan.amount_due.toLocaleString()} USD
Fecha de vencimiento: ${new Date(plan.due_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
Días vencidos: ${Math.abs(daysUntilDue)}

Por favor, ponte en contacto con nosotros lo antes posible para regularizar tu pago.

Saludos,
Nomad Travel Society
        `.trim();
      } else if (daysUntilDue === 0) {
        // Due today
        subject = `🔔 Pago Vence Hoy - ${soldTrip.destination}`;
        body = `
Hola ${client.first_name},

Te recordamos que hoy vence el pago #${plan.payment_number} de tu viaje a ${soldTrip.destination}.

Monto: $${plan.amount_due.toLocaleString()} USD
Fecha de vencimiento: HOY

Por favor, realiza tu pago lo antes posible.

Saludos,
Nomad Travel Society
        `.trim();
      } else {
        // Upcoming
        subject = `📅 Recordatorio de Pago - ${soldTrip.destination}`;
        body = `
Hola ${client.first_name},

Te recordamos que tu pago #${plan.payment_number} para el viaje a ${soldTrip.destination} vence próximamente.

Monto: $${plan.amount_due.toLocaleString()} USD
Fecha de vencimiento: ${new Date(plan.due_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
Días restantes: ${daysUntilDue}

Por favor, asegúrate de realizar tu pago antes de la fecha límite.

Saludos,
Nomad Travel Society
        `.trim();
      }
      
      try {
        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          subject: subject,
          body: body,
          from_name: 'Nomad Travel Society'
        });
        
        // Update the payment plan
        await base44.asServiceRole.entities.ClientPaymentPlan.update(plan.id, {
          reminder_sent: true,
          last_reminder_date: new Date().toISOString().split('T')[0],
          status: daysUntilDue < 0 ? 'atrasado' : plan.status
        });
        
        sentReminders.push({
          client: client.email,
          trip: soldTrip.destination,
          daysUntilDue
        });
      } catch (error) {
        console.error(`Failed to send reminder to ${client.email}:`, error);
      }
    }
    
    return Response.json({
      success: true,
      reminders_sent: sentReminders.length,
      details: sentReminders
    });
    
  } catch (error) {
    console.error('Error in sendPaymentReminders:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});