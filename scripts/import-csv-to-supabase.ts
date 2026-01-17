import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CSV_DIR = '/Users/jpnarchi/Desktop/Nueva carpeta con elementos';

// Funciones de utilidad
function parseCSV(filePath: string): any[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: true,
    cast_date: false, // Manejamos las fechas manualmente
  });
}

function convertToUUID(id: string): string | null {
  if (!id || id === '') return null;
  // Los IDs ya parecen estar en formato ObjectId de MongoDB
  // Los mantendremos como están para preservar las relaciones
  return id;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '') return null;
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  } catch {
    return null;
  }
}

function parseTimestamp(dateStr: string): string | null {
  if (!dateStr || dateStr === '') return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

function parseDecimal(value: any): number | null {
  if (!value || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseInteger(value: any): number | null {
  if (!value || value === '') return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
}

function parseJSON(value: string): any {
  if (!value || value === '' || value === '[]' || value === '{}') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// ============================================
// IMPORTAR CLIENTES
// ============================================
async function importClients() {
  console.log('\n📥 Importando clientes...');
  const csvPath = path.join(CSV_DIR, 'Client_export (1).csv');
  const records = parseCSV(csvPath);

  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const client = {
      id: convertToUUID(record.id),
      first_name: record.first_name || null,
      last_name: record.last_name || null,
      name: `${record.first_name || ''} ${record.last_name || ''}`.trim() || null,
      email: record.email || null,
      phone: record.phone || null,
      birth_date: parseDate(record.birth_date),
      source: record.source || null,
      notes: record.notes || null,
      trip_requests: parseJSON(record.trip_requests),
      companions: parseJSON(record.companions),
      preferences: record.preferences || null,
      status: 'active',
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('clients').upsert(client, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando cliente ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Clientes importados: ${imported}, Errores: ${errors}`);
}

// ============================================
// IMPORTAR VIAJES (TRIPS)
// ============================================
async function importTrips() {
  console.log('\n📥 Importando viajes...');
  const csvPath = path.join(CSV_DIR, 'Trip_export.csv');
  const records = parseCSV(csvPath);

  let imported = 0;
  let errors = 0;

  for (const record of records) {
    // Mapear 'stage' a 'status'
    const stageToStatus: { [key: string]: string } = {
      'vendido': 'won',
      'perdido': 'lost',
      'cotización': 'quote',
      'lead': 'lead',
      'negociación': 'negotiation',
    };

    const trip = {
      id: convertToUUID(record.id),
      trip_name: record.trip_name || null,
      client_id: convertToUUID(record.client_id),
      client_name: record.client_name || null,
      destination: record.destination || null,
      start_date: parseDate(record.start_date),
      end_date: parseDate(record.end_date),
      travelers: parseInteger(record.travelers),
      num_adults: parseInteger(record.travelers) || 0,
      num_children: 0,
      budget: parseDecimal(record.budget),
      mood: record.mood || null,
      stage: record.stage || null,
      status: stageToStatus[record.stage?.toLowerCase()] || 'lead',
      lost_reason: record.lost_reason || null,
      notes: record.notes || null,
      currency: 'USD',
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('trips').upsert(trip, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando viaje ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Viajes importados: ${imported}, Errores: ${errors}`);
}

// ============================================
// IMPORTAR VIAJES VENDIDOS (SOLD TRIPS)
// ============================================
async function importSoldTrips() {
  console.log('\n📥 Importando viajes vendidos...');
  const csvPath = path.join(CSV_DIR, 'SoldTrip_export.csv');
  const records = parseCSV(csvPath);

  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const soldTrip = {
      id: convertToUUID(record.id),
      trip_id: convertToUUID(record.trip_id),
      client_id: convertToUUID(record.client_id),
      client_name: record.client_name || null,
      destination: record.destination || null,
      start_date: parseDate(record.start_date),
      end_date: parseDate(record.end_date),
      travelers: parseInteger(record.travelers),
      num_adults: parseInteger(record.travelers) || 0,
      num_children: 0,
      is_group_trip: parseBoolean(record.is_group_trip),
      group_split_method: record.group_split_method || null,
      total_price: parseDecimal(record.total_price) || 0,
      total_commission: parseDecimal(record.total_commission) || 0,
      total_paid_by_client: parseDecimal(record.total_paid_by_client) || 0,
      total_paid_to_suppliers: parseDecimal(record.total_paid_to_suppliers) || 0,
      status: record.status || 'confirmed',
      notes: record.notes || null,
      sale_date: parseTimestamp(record.sale_date),
      currency: 'USD',
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('sold_trips').upsert(soldTrip, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando viaje vendido ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Viajes vendidos importados: ${imported}, Errores: ${errors}`);
}

// ============================================
// IMPORTAR SERVICIOS DE VIAJE
// ============================================
async function importTripServices() {
  console.log('\n📥 Importando servicios de viaje...');
  const csvPath = path.join(CSV_DIR, 'TripService_export.csv');
  const records = parseCSV(csvPath);

  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const service = {
      id: convertToUUID(record.id),
      sold_trip_id: convertToUUID(record.sold_trip_id),
      service_type: record.service_type || null,
      service_name: record.hotel_name || record.tour_name || record.cruise_ship || record.other_name || record.service_type || 'Service',
      supplier_name: record.reserved_by || null,

      local_currency: record.local_currency || null,
      local_amount: parseDecimal(record.local_amount),
      quote_date: parseDate(record.quote_date),
      quote_exchange_rate: parseDecimal(record.quote_exchange_rate),
      total_price: parseDecimal(record.total_price),
      cost: parseDecimal(record.amount_paid_to_supplier) || 0,
      price: parseDecimal(record.total_price) || 0,
      commission: parseDecimal(record.commission) || 0,
      amount_paid_to_supplier: parseDecimal(record.amount_paid_to_supplier),
      payment_type: record.payment_type || null,
      paid_to_agency: parseBoolean(record.paid_to_agency),
      paid_to_agency_date: parseDate(record.paid_to_agency_date),
      paid_to_agent: parseBoolean(record.paid_to_agent),
      commission_payment_date: parseDate(record.commission_payment_date),
      commission_paid: parseBoolean(record.commission_paid),
      booked_by: record.booked_by || null,
      reserved_by: record.reserved_by || null,
      flight_consolidator: record.flight_consolidator || null,
      cruise_provider: record.cruise_provider || null,
      train_provider: record.train_provider || null,
      notes: record.notes || null,

      // Hotel
      hotel_chain: record.hotel_chain || null,
      hotel_brand: record.hotel_brand || null,
      hotel_name: record.hotel_name || null,
      hotel_city: record.hotel_city || null,
      check_in: parseDate(record.check_in),
      check_out: parseDate(record.check_out),
      room_type: record.room_type || null,
      num_rooms: parseInteger(record.num_rooms),
      meal_plan: record.meal_plan || null,
      reservation_number: record.reservation_number || null,
      reservation_status: record.reservation_status || null,
      payment_due_date: parseDate(record.payment_due_date),
      nights: parseInteger(record.nights),
      start_date: parseDate(record.check_in),
      end_date: parseDate(record.check_out),

      // Vuelo
      airline: record.airline || null,
      airline_other: record.airline_other || null,
      route: record.route || null,
      flight_number: record.flight_number || null,
      flight_date: parseDate(record.flight_date),
      departure_time: record.departure_time || null,
      arrival_time: record.arrival_time || null,
      flight_class: record.flight_class || null,
      baggage_included: record.baggage_included || null,
      flight_reservation_number: record.flight_reservation_number || null,
      passengers: record.passengers || null,

      // Traslado
      transfer_type: record.transfer_type || null,
      transfer_origin: record.transfer_origin || null,
      transfer_destination: record.transfer_destination || null,
      transfer_datetime: record.transfer_datetime || null,
      vehicle: record.vehicle || null,
      transfer_passengers: record.transfer_passengers || null,

      // Tour
      tour_name: record.tour_name || null,
      tour_city: record.tour_city || null,
      tour_date: parseDate(record.tour_date),
      tour_duration: record.tour_duration || null,
      tour_includes: record.tour_includes || null,
      tour_people: record.tour_people || null,
      tour_reservation_number: record.tour_reservation_number || null,

      // Crucero
      cruise_line: record.cruise_line || null,
      cruise_ship: record.cruise_ship || null,
      cruise_itinerary: record.cruise_itinerary || null,
      cruise_departure_port: record.cruise_departure_port || null,
      cruise_arrival_port: record.cruise_arrival_port || null,
      cruise_departure_date: parseDate(record.cruise_departure_date),
      cruise_arrival_date: parseDate(record.cruise_arrival_date),
      cruise_nights: parseInteger(record.cruise_nights),
      cruise_cabin_type: record.cruise_cabin_type || null,
      cruise_cabin_number: record.cruise_cabin_number || null,
      cruise_passengers: record.cruise_passengers || null,
      cruise_reservation_number: record.cruise_reservation_number || null,

      // Tren
      train_route: record.train_route || null,
      train_operator: record.train_operator || null,
      train_number: record.train_number || null,
      train_date: parseDate(record.train_date),
      train_departure_time: record.train_departure_time || null,
      train_arrival_time: record.train_arrival_time || null,
      train_class: record.train_class || null,
      train_passengers: record.train_passengers || null,
      train_reservation_number: record.train_reservation_number || null,

      // DMC
      dmc_name: record.dmc_name || null,
      dmc_services: record.dmc_services || null,
      dmc_destination: record.dmc_destination || null,
      dmc_date: parseDate(record.dmc_date),
      dmc_reservation_number: record.dmc_reservation_number || null,
      dmc_passengers: record.dmc_passengers || null,

      // Otro
      other_name: record.other_name || null,
      other_description: record.other_description || null,
      other_date: parseDate(record.other_date),

      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('trip_services').upsert(service, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando servicio ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Servicios importados: ${imported}, Errores: ${errors}`);
}

// ============================================
// IMPORTAR PAGOS DE CLIENTES
// ============================================
async function importClientPayments() {
  console.log('\n📥 Importando pagos de clientes...');
  const csvPath = path.join(CSV_DIR, 'ClientPayment_export.csv');
  const records = parseCSV(csvPath);

  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const payment = {
      id: convertToUUID(record.id),
      sold_trip_id: convertToUUID(record.sold_trip_id),
      group_member_id: convertToUUID(record.group_member_id),
      paid_for_member_id: convertToUUID(record.paid_for_member_id),
      date: parseDate(record.date),
      currency: record.currency || 'USD',
      amount_original: parseDecimal(record.amount_original),
      fx_rate: parseDecimal(record.fx_rate),
      amount_usd_fixed: parseDecimal(record.amount_usd_fixed),
      amount: parseDecimal(record.amount),
      method: record.method || null,
      bank: record.bank || null,
      receipt_url: record.receipt_url || null,
      notes: record.notes || null,
      status: record.status || null,
      confirmed: parseBoolean(record.confirmed),
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('client_payments').upsert(payment, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando pago de cliente ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Pagos de clientes importados: ${imported}, Errores: ${errors}`);
}

// ============================================
// IMPORTAR PAGOS A PROVEEDORES
// ============================================
async function importSupplierPayments() {
  console.log('\n📥 Importando pagos a proveedores...');
  const csvPath = path.join(CSV_DIR, 'SupplierPayment_export.csv');
  const records = parseCSV(csvPath);

  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const payment = {
      id: convertToUUID(record.id),
      sold_trip_id: convertToUUID(record.sold_trip_id),
      trip_service_id: convertToUUID(record.trip_service_id),
      supplier: record.supplier || null,
      date: parseDate(record.date),
      amount: parseDecimal(record.amount),
      payment_type: record.payment_type || null,
      method: record.method || null,
      receipt_url: record.receipt_url || null,
      notes: record.notes || null,
      confirmed: parseBoolean(record.confirmed),
      paid: parseBoolean(record.paid),
      currency: 'USD',
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('supplier_payments').upsert(payment, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando pago a proveedor ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Pagos a proveedores importados: ${imported}, Errores: ${errors}`);
}

// ============================================
// IMPORTAR PROVEEDORES
// ============================================
async function importSuppliers() {
  console.log('\n📥 Importando proveedores...');
  const csvPath = path.join(CSV_DIR, 'Supplier_export.csv');
  const records = parseCSV(csvPath);

  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const supplier = {
      id: convertToUUID(record.id),
      name: record.name || null,
      type: record.type || null,
      category: record.type || null,
      representative_agency_id: convertToUUID(record.representative_agency_id),
      contact1_name: record.contact1_name || null,
      contact1_phone: record.contact1_phone || null,
      contact1_email: record.contact1_email || null,
      contact2_name: record.contact2_name || null,
      contact2_phone: record.contact2_phone || null,
      contact2_email: record.contact2_email || null,
      email: record.contact1_email || null,
      phone: record.contact1_phone || null,
      internal_notes: record.internal_notes || null,
      notes: record.internal_notes || null,
      destinations: parseJSON(record.destinations),
      services: parseJSON(record.services),
      commission: record.commission || null,
      currency: record.currency || null,
      response_time: record.response_time || null,
      website: record.website || null,
      agent_portal: record.agent_portal || null,
      agent_id: record.agent_id || null,
      documents_folder: record.documents_folder || null,
      payment_methods: parseJSON(record.payment_methods),
      policies: record.policies || null,
      business_hours: record.business_hours || null,
      confirmation_time: record.confirmation_time || null,
      rating: parseInteger(record.rating),
      team_comments: record.team_comments || null,
      issues: record.issues || null,
      last_used: parseTimestamp(record.last_used),
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('suppliers').upsert(supplier, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando proveedor ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Proveedores importados: ${imported}, Errores: ${errors}`);
}

// ============================================
// IMPORTAR OTRAS TABLAS (simplificado)
// ============================================

async function importTasks() {
  console.log('\n📥 Importando tareas...');
  const csvPath = path.join(CSV_DIR, 'Task_export.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Archivo no encontrado, saltando...');
    return;
  }

  const records = parseCSV(csvPath);
  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const task = {
      id: convertToUUID(record.id),
      title: record.title || 'Sin título',
      description: record.description || null,
      due_date: parseDate(record.due_date),
      related_trip_id: convertToUUID(record.related_trip_id),
      related_client_id: convertToUUID(record.related_client_id),
      priority: record.priority || 'medium',
      completed: parseBoolean(record.completed),
      status: parseBoolean(record.completed) ? 'completed' : 'pending',
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('tasks').upsert(task, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando tarea ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Tareas importadas: ${imported}, Errores: ${errors}`);
}

async function importTripReminders() {
  console.log('\n📥 Importando recordatorios de viajes...');
  const csvPath = path.join(CSV_DIR, 'TripReminder_export.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Archivo no encontrado, saltando...');
    return;
  }

  const records = parseCSV(csvPath);
  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const reminder = {
      id: convertToUUID(record.id),
      sold_trip_id: convertToUUID(record.sold_trip_id),
      timeline_period: record.timeline_period || null,
      task: record.task || null,
      title: record.task || 'Recordatorio',
      completed: parseBoolean(record.completed),
      completed_date: parseDate(record.completed_date),
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('reminders').upsert(reminder, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando recordatorio ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Recordatorios importados: ${imported}, Errores: ${errors}`);
}

async function importClientPaymentPlans() {
  console.log('\n📥 Importando planes de pago...');
  const csvPath = path.join(CSV_DIR, 'ClientPaymentPlan_export.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Archivo no encontrado, saltando...');
    return;
  }

  const records = parseCSV(csvPath);
  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const plan = {
      id: convertToUUID(record.id),
      sold_trip_id: convertToUUID(record.sold_trip_id),
      payment_number: parseInteger(record.payment_number),
      due_date: parseDate(record.due_date),
      amount_due: parseDecimal(record.amount_due),
      amount_paid: parseDecimal(record.amount_paid) || 0,
      status: record.status || 'pending',
      reminder_sent: parseBoolean(record.reminder_sent),
      last_reminder_date: parseDate(record.last_reminder_date),
      notes: record.notes || null,
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('client_payment_plans').upsert(plan, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando plan de pago ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Planes de pago importados: ${imported}, Errores: ${errors}`);
}

async function importTripNotes() {
  console.log('\n📥 Importando notas de viajes...');
  const csvPath = path.join(CSV_DIR, 'TripNote_export.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Archivo no encontrado, saltando...');
    return;
  }

  const records = parseCSV(csvPath);
  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const note = {
      id: convertToUUID(record.id),
      sold_trip_id: convertToUUID(record.sold_trip_id),
      content: record.content || '',
      is_urgent: parseBoolean(record.is_urgent),
      completed: parseBoolean(record.completed),
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('trip_notes').upsert(note, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando nota ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Notas importadas: ${imported}, Errores: ${errors}`);
}

async function importTripDocumentFiles() {
  console.log('\n📥 Importando archivos de documentos de viajes...');
  const csvPath = path.join(CSV_DIR, 'TripDocumentFile_export.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Archivo no encontrado, saltando...');
    return;
  }

  const records = parseCSV(csvPath);
  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const doc = {
      id: convertToUUID(record.id),
      sold_trip_id: convertToUUID(record.sold_trip_id),
      document_type: record.document_type || null,
      name: record.name || 'Documento',
      file_url: record.file_url || null,
      notes: record.notes || null,
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('trip_document_files').upsert(doc, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando documento ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Archivos de documentos importados: ${imported}, Errores: ${errors}`);
}

async function importTravelDocuments() {
  console.log('\n📥 Importando documentos de viaje...');
  const csvPath = path.join(CSV_DIR, 'TravelDocument_export.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Archivo no encontrado, saltando...');
    return;
  }

  const records = parseCSV(csvPath);
  let imported = 0;
  let errors = 0;

  for (const record of records) {
    const doc = {
      id: convertToUUID(record.id),
      client_id: convertToUUID(record.client_id),
      trip_id: convertToUUID(record.trip_id),
      document_type: record.document_type || null,
      name: record.name || 'Documento',
      file_url: record.file_url || null,
      expiry_date: parseDate(record.expiry_date),
      country: record.country || null,
      document_number: record.document_number || null,
      notes: record.notes || null,
      is_deleted: false,
      created_date: parseTimestamp(record.created_date),
      updated_date: parseTimestamp(record.updated_date),
      created_by: record.created_by || 'import',
      created_by_id: convertToUUID(record.created_by_id),
      is_sample: parseBoolean(record.is_sample),
    };

    const { error } = await supabase.from('travel_documents').upsert(doc, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importando documento de viaje ${record.id}:`, error.message);
      errors++;
    } else {
      imported++;
    }
  }

  console.log(`✅ Documentos de viaje importados: ${imported}, Errores: ${errors}`);
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function main() {
  console.log('🚀 Iniciando importación de CSVs a Supabase...\n');
  console.log(`📁 Directorio de CSVs: ${CSV_DIR}\n`);

  try {
    // Orden de importación (respetando dependencias)
    await importClients();          // 1. Clientes primero
    await importTrips();            // 2. Viajes (dependen de clientes)
    await importSoldTrips();        // 3. Viajes vendidos (dependen de trips y clients)
    await importSuppliers();        // 4. Proveedores (independientes)
    await importTripServices();     // 5. Servicios (dependen de sold_trips)
    await importClientPayments();   // 6. Pagos de clientes (dependen de sold_trips)
    await importSupplierPayments(); // 7. Pagos a proveedores (dependen de sold_trips y services)
    await importTasks();            // 8. Tareas
    await importTripReminders();    // 9. Recordatorios
    await importClientPaymentPlans(); // 10. Planes de pago
    await importTripNotes();        // 11. Notas
    await importTripDocumentFiles(); // 12. Archivos de documentos
    await importTravelDocuments();  // 13. Documentos de viaje

    console.log('\n✅ Importación completada exitosamente!');
  } catch (error) {
    console.error('\n❌ Error durante la importación:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
