-- ============================================
-- EXTENSIONES AL SCHEMA PARA IMPORTAR DATOS DE CSVs
-- ============================================
-- Este script extiende el schema existente para incluir todas las columnas
-- necesarias de los CSVs exportados

-- ============================================
-- EXTENDER TABLA: clients
-- ============================================
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS trip_requests JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS companions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS preferences TEXT,
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- Actualizar nombre completo basado en first_name y last_name si no existe
-- (se ejecutará después de la importación)

-- ============================================
-- EXTENDER TABLA: trips
-- ============================================
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS trip_name TEXT,
  ADD COLUMN IF NOT EXISTS travelers INTEGER,
  ADD COLUMN IF NOT EXISTS mood TEXT,
  ADD COLUMN IF NOT EXISTS stage TEXT, -- 'lead', 'cotización', 'vendido', etc.
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- Mapeo de 'stage' al campo 'status' existente
-- stage -> status mapping:
-- 'vendido' -> 'won'
-- 'perdido' -> 'lost'
-- 'cotización' -> 'quote'
-- etc.

-- ============================================
-- EXTENDER TABLA: sold_trips
-- ============================================
ALTER TABLE public.sold_trips
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id),
  ADD COLUMN IF NOT EXISTS travelers INTEGER,
  ADD COLUMN IF NOT EXISTS is_group_trip BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_split_method TEXT, -- 'equal', 'custom'
  ADD COLUMN IF NOT EXISTS total_paid_to_suppliers DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- ============================================
-- EXTENDER TABLA: trip_services
-- ============================================
-- Esta tabla necesita muchas más columnas para manejar todos los tipos de servicios
ALTER TABLE public.trip_services
  ADD COLUMN IF NOT EXISTS local_currency TEXT,
  ADD COLUMN IF NOT EXISTS local_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS quote_date DATE,
  ADD COLUMN IF NOT EXISTS quote_exchange_rate DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS amount_paid_to_supplier DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_type TEXT, -- 'anticipo', 'neto', 'bruto', 'total'
  ADD COLUMN IF NOT EXISTS paid_to_agency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_to_agency_date DATE,
  ADD COLUMN IF NOT EXISTS commission_payment_date DATE,
  ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS booked_by TEXT,
  ADD COLUMN IF NOT EXISTS reserved_by TEXT,
  ADD COLUMN IF NOT EXISTS flight_consolidator TEXT,
  ADD COLUMN IF NOT EXISTS cruise_provider TEXT,
  ADD COLUMN IF NOT EXISTS train_provider TEXT,

  -- Campos específicos de Hotel
  ADD COLUMN IF NOT EXISTS hotel_chain TEXT,
  ADD COLUMN IF NOT EXISTS hotel_brand TEXT,
  ADD COLUMN IF NOT EXISTS hotel_name TEXT,
  ADD COLUMN IF NOT EXISTS hotel_city TEXT,
  ADD COLUMN IF NOT EXISTS check_in DATE,
  ADD COLUMN IF NOT EXISTS check_out DATE,
  ADD COLUMN IF NOT EXISTS room_type TEXT,
  ADD COLUMN IF NOT EXISTS num_rooms INTEGER,
  ADD COLUMN IF NOT EXISTS meal_plan TEXT,
  ADD COLUMN IF NOT EXISTS reservation_number TEXT,
  ADD COLUMN IF NOT EXISTS reservation_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_due_date DATE,
  ADD COLUMN IF NOT EXISTS nights INTEGER,

  -- Campos específicos de Vuelo
  ADD COLUMN IF NOT EXISTS airline TEXT,
  ADD COLUMN IF NOT EXISTS airline_other TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS flight_number TEXT,
  ADD COLUMN IF NOT EXISTS flight_date DATE,
  ADD COLUMN IF NOT EXISTS departure_time TIME,
  ADD COLUMN IF NOT EXISTS arrival_time TIME,
  ADD COLUMN IF NOT EXISTS flight_class TEXT,
  ADD COLUMN IF NOT EXISTS baggage_included TEXT,
  ADD COLUMN IF NOT EXISTS flight_reservation_number TEXT,
  ADD COLUMN IF NOT EXISTS passengers TEXT,

  -- Campos específicos de Traslado
  ADD COLUMN IF NOT EXISTS transfer_type TEXT,
  ADD COLUMN IF NOT EXISTS transfer_origin TEXT,
  ADD COLUMN IF NOT EXISTS transfer_destination TEXT,
  ADD COLUMN IF NOT EXISTS transfer_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vehicle TEXT,
  ADD COLUMN IF NOT EXISTS transfer_passengers TEXT,

  -- Campos específicos de Tour
  ADD COLUMN IF NOT EXISTS tour_name TEXT,
  ADD COLUMN IF NOT EXISTS tour_city TEXT,
  ADD COLUMN IF NOT EXISTS tour_date DATE,
  ADD COLUMN IF NOT EXISTS tour_duration TEXT,
  ADD COLUMN IF NOT EXISTS tour_includes TEXT,
  ADD COLUMN IF NOT EXISTS tour_people TEXT,
  ADD COLUMN IF NOT EXISTS tour_reservation_number TEXT,

  -- Campos específicos de Crucero
  ADD COLUMN IF NOT EXISTS cruise_line TEXT,
  ADD COLUMN IF NOT EXISTS cruise_ship TEXT,
  ADD COLUMN IF NOT EXISTS cruise_itinerary TEXT,
  ADD COLUMN IF NOT EXISTS cruise_departure_port TEXT,
  ADD COLUMN IF NOT EXISTS cruise_arrival_port TEXT,
  ADD COLUMN IF NOT EXISTS cruise_departure_date DATE,
  ADD COLUMN IF NOT EXISTS cruise_arrival_date DATE,
  ADD COLUMN IF NOT EXISTS cruise_nights INTEGER,
  ADD COLUMN IF NOT EXISTS cruise_cabin_type TEXT,
  ADD COLUMN IF NOT EXISTS cruise_cabin_number TEXT,
  ADD COLUMN IF NOT EXISTS cruise_passengers TEXT,
  ADD COLUMN IF NOT EXISTS cruise_reservation_number TEXT,

  -- Campos específicos de Tren
  ADD COLUMN IF NOT EXISTS train_route TEXT,
  ADD COLUMN IF NOT EXISTS train_operator TEXT,
  ADD COLUMN IF NOT EXISTS train_number TEXT,
  ADD COLUMN IF NOT EXISTS train_date DATE,
  ADD COLUMN IF NOT EXISTS train_departure_time TIME,
  ADD COLUMN IF NOT EXISTS train_arrival_time TIME,
  ADD COLUMN IF NOT EXISTS train_class TEXT,
  ADD COLUMN IF NOT EXISTS train_passengers TEXT,
  ADD COLUMN IF NOT EXISTS train_reservation_number TEXT,

  -- Campos específicos de DMC
  ADD COLUMN IF NOT EXISTS dmc_name TEXT,
  ADD COLUMN IF NOT EXISTS dmc_services TEXT,
  ADD COLUMN IF NOT EXISTS dmc_destination TEXT,
  ADD COLUMN IF NOT EXISTS dmc_date DATE,
  ADD COLUMN IF NOT EXISTS dmc_reservation_number TEXT,
  ADD COLUMN IF NOT EXISTS dmc_passengers TEXT,

  -- Campos específicos de Otro
  ADD COLUMN IF NOT EXISTS other_name TEXT,
  ADD COLUMN IF NOT EXISTS other_description TEXT,
  ADD COLUMN IF NOT EXISTS other_date DATE,

  -- Campos de auditoría
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- ============================================
-- EXTENDER TABLA: client_payments
-- ============================================
ALTER TABLE public.client_payments
  ADD COLUMN IF NOT EXISTS group_member_id UUID,
  ADD COLUMN IF NOT EXISTS paid_for_member_id UUID,
  ADD COLUMN IF NOT EXISTS amount_original DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS fx_rate DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS amount_usd_fixed DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bank TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- ============================================
-- EXTENDER TABLA: supplier_payments
-- ============================================
ALTER TABLE public.supplier_payments
  ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- ============================================
-- EXTENDER TABLA: suppliers
-- ============================================
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS representative_agency_id UUID,
  ADD COLUMN IF NOT EXISTS contact1_name TEXT,
  ADD COLUMN IF NOT EXISTS contact1_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact1_email TEXT,
  ADD COLUMN IF NOT EXISTS contact2_name TEXT,
  ADD COLUMN IF NOT EXISTS contact2_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact2_email TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS destinations TEXT[],
  ADD COLUMN IF NOT EXISTS services TEXT[],
  ADD COLUMN IF NOT EXISTS commission TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS response_time TEXT,
  ADD COLUMN IF NOT EXISTS agent_portal TEXT,
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS documents_folder TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods TEXT[],
  ADD COLUMN IF NOT EXISTS policies TEXT,
  ADD COLUMN IF NOT EXISTS business_hours TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_time TEXT,
  ADD COLUMN IF NOT EXISTS team_comments TEXT,
  ADD COLUMN IF NOT EXISTS issues TEXT,
  ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- Renombrar columnas existentes si es necesario
-- ALTER TABLE public.suppliers RENAME COLUMN contact_name TO contact1_name;

-- ============================================
-- EXTENDER TABLA: tasks
-- ============================================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS related_trip_id UUID REFERENCES public.trips(id),
  ADD COLUMN IF NOT EXISTS related_client_id UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- ============================================
-- EXTENDER TABLA: credentials
-- ============================================
ALTER TABLE public.credentials
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS password TEXT, -- Se debe encriptar después
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_question TEXT,
  ADD COLUMN IF NOT EXISTS security_answer TEXT;

-- Renombrar si existe password_encrypted
-- ALTER TABLE public.credentials RENAME COLUMN password_encrypted TO password;

-- ============================================
-- EXTENDER TABLA: reviews
-- ============================================
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS hotel_chain TEXT,
  ADD COLUMN IF NOT EXISTS cruise_line TEXT,
  ADD COLUMN IF NOT EXISTS provider_name TEXT,
  ADD COLUMN IF NOT EXISTS experience_date DATE,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS fam_type TEXT,
  ADD COLUMN IF NOT EXISTS fam_details TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS pros TEXT,
  ADD COLUMN IF NOT EXISTS cons TEXT,
  ADD COLUMN IF NOT EXISTS tips TEXT,
  ADD COLUMN IF NOT EXISTS destination_tips TEXT,
  ADD COLUMN IF NOT EXISTS recommended BOOLEAN,
  ADD COLUMN IF NOT EXISTS pdf_files TEXT[],
  ADD COLUMN IF NOT EXISTS images TEXT[],
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- ============================================
-- EXTENDER TABLA: attendance
-- ============================================
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS event_name TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS event_time TIME,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS attendees TEXT[],
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- ============================================
-- EXTENDER TABLA: industry_fairs
-- ============================================
ALTER TABLE public.industry_fairs
  ADD COLUMN IF NOT EXISTS organizer TEXT,
  ADD COLUMN IF NOT EXISTS cost_per_person DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS includes TEXT,
  ADD COLUMN IF NOT EXISTS includes_description TEXT,
  ADD COLUMN IF NOT EXISTS assigned_agents TEXT[],
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- Renombrar si es necesario
-- ALTER TABLE public.industry_fairs RENAME COLUMN participants TO assigned_agents;

-- ============================================
-- NUEVA TABLA: client_payment_plans
-- ============================================
CREATE TABLE IF NOT EXISTS public.client_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  payment_number INTEGER,
  due_date DATE,
  amount_due DECIMAL(10,2),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  reminder_sent BOOLEAN DEFAULT false,
  last_reminder_date DATE,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  created_by_id UUID,
  is_sample BOOLEAN DEFAULT false,
  metadata JSONB
);

-- ============================================
-- NUEVA TABLA: trip_notes
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  created_by_id UUID,
  is_sample BOOLEAN DEFAULT false,
  metadata JSONB
);

-- ============================================
-- NUEVA TABLA: trip_document_files
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_document_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  document_type TEXT, -- 'itinerary', 'invoice', 'voucher', 'contract', etc.
  name TEXT NOT NULL,
  file_url TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  created_by_id UUID,
  is_sample BOOLEAN DEFAULT false,
  metadata JSONB
);

-- ============================================
-- NUEVA TABLA: travel_documents
-- ============================================
CREATE TABLE IF NOT EXISTS public.travel_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  trip_id UUID REFERENCES public.trips(id),
  document_type TEXT, -- 'passport', 'visa', 'id', etc.
  name TEXT NOT NULL,
  file_url TEXT,
  expiry_date DATE,
  country TEXT,
  document_number TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  created_by_id UUID,
  is_sample BOOLEAN DEFAULT false,
  metadata JSONB
);

-- ============================================
-- MODIFICAR TABLA: reminders
-- ============================================
-- La tabla reminders ya existe pero necesitamos asegurarnos que tiene los campos para TripReminder
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS sold_trip_id UUID REFERENCES public.sold_trips(id),
  ADD COLUMN IF NOT EXISTS timeline_period TEXT, -- '6_months', '3_months', etc.
  ADD COLUMN IF NOT EXISTS task TEXT,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_date DATE,
  ADD COLUMN IF NOT EXISTS created_by_id UUID,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- ============================================
-- ÍNDICES PARA LAS NUEVAS TABLAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_payment_plans_sold_trip_id ON public.client_payment_plans(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notes_sold_trip_id ON public.trip_notes(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_document_files_sold_trip_id ON public.trip_document_files(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_client_id ON public.travel_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_trip_id ON public.travel_documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sold_trip_id ON public.reminders(sold_trip_id);

-- ============================================
-- RLS PARA LAS NUEVAS TABLAS
-- ============================================

ALTER TABLE public.client_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;

-- Políticas genéricas (los usuarios autenticados pueden acceder)
CREATE POLICY "Authenticated users can view client payment plans"
  ON public.client_payment_plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert client payment plans"
  ON public.client_payment_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update client payment plans"
  ON public.client_payment_plans FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view trip notes"
  ON public.trip_notes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert trip notes"
  ON public.trip_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update trip notes"
  ON public.trip_notes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view trip document files"
  ON public.trip_document_files FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert trip document files"
  ON public.trip_document_files FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update trip document files"
  ON public.trip_document_files FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view travel documents"
  ON public.travel_documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert travel documents"
  ON public.travel_documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update travel documents"
  ON public.travel_documents FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS PARA UPDATED_DATE EN NUEVAS TABLAS
-- ============================================

CREATE TRIGGER update_client_payment_plans_updated_date
  BEFORE UPDATE ON public.client_payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_trip_notes_updated_date
  BEFORE UPDATE ON public.trip_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_trip_document_files_updated_date
  BEFORE UPDATE ON public.trip_document_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_travel_documents_updated_date
  BEFORE UPDATE ON public.travel_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- ============================================
-- FINALIZADO
-- ============================================
