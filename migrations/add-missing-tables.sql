-- ============================================
-- Migration: Add missing tables for SoldTrip features
-- ============================================
-- Execute this in Supabase SQL Editor to create missing tables

-- ============================================
-- CLIENT_PAYMENT_PLAN: Plan de pagos del cliente
-- ============================================
CREATE TABLE IF NOT EXISTS public.client_payment_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  description TEXT,
  due_date DATE NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pendiente', -- 'pendiente', 'parcial', 'pagado'
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TRIP_NOTES: Notas del viaje
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
  completed BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TRIP_DOCUMENT_FILES: Documentos del viaje
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_document_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TRIP_REMINDERS: Recordatorios del viaje
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date DATE,
  days_before_trip INTEGER, -- Días antes del viaje para recordar
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'completed', 'dismissed'
  priority TEXT DEFAULT 'normal',
  completed BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_client_payment_plan_sold_trip ON public.client_payment_plan(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notes_sold_trip ON public.trip_notes(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_document_files_sold_trip ON public.trip_document_files(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_reminders_sold_trip ON public.trip_reminders(sold_trip_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.client_payment_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir acceso a usuarios autenticados
CREATE POLICY "Allow all for authenticated users" ON public.client_payment_plan
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.trip_notes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.trip_document_files
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.trip_reminders
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS para UPDATED_DATE
-- ============================================
CREATE TRIGGER update_client_payment_plan_updated_date
  BEFORE UPDATE ON public.client_payment_plan
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

CREATE TRIGGER update_trip_reminders_updated_date
  BEFORE UPDATE ON public.trip_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- ============================================
-- FINISHED
-- ============================================
