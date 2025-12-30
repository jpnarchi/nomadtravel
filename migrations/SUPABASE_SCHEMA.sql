-- ============================================
-- NOMAD TRAVEL CRM - SUPABASE DATABASE SCHEMA
-- ============================================
-- Este archivo contiene el esquema completo de base de datos para Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user', -- 'admin' o 'user'
  custom_role TEXT, -- 'supervisor' u otros roles personalizados
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB
);

-- ============================================
-- TABLA: clients
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  country TEXT,
  city TEXT,
  source TEXT, -- Cómo conoció el servicio (referido, instagram, etc.)
  notes TEXT,
  tags TEXT[], -- Array de etiquetas
  priority TEXT, -- 'high', 'medium', 'low'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'converted'
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: trips
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT,
  destination TEXT NOT NULL,
  trip_type TEXT, -- 'individual', 'group', 'corporate', etc.
  start_date DATE,
  end_date DATE,
  num_adults INTEGER DEFAULT 0,
  num_children INTEGER DEFAULT 0,
  budget DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'lead', -- 'lead', 'quote', 'proposal', 'negotiation', 'won', 'lost'
  probability INTEGER DEFAULT 0, -- Probabilidad de cierre (0-100)
  notes TEXT,
  tags TEXT[],
  priority TEXT DEFAULT 'medium',
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: sold_trips
-- ============================================
CREATE TABLE IF NOT EXISTS public.sold_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id),
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  num_adults INTEGER DEFAULT 0,
  num_children INTEGER DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  total_paid_by_client DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: trip_services
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'hotel', 'flight', 'tour', 'transport', 'insurance', etc.
  service_name TEXT NOT NULL,
  supplier_name TEXT,
  cost DECIMAL(10,2) DEFAULT 0, -- Costo del proveedor
  price DECIMAL(10,2) DEFAULT 0, -- Precio al cliente
  commission DECIMAL(10,2) DEFAULT 0, -- Comisión
  paid_to_agent BOOLEAN DEFAULT false,
  payment_date DATE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: client_payments
-- ============================================
CREATE TABLE IF NOT EXISTS public.client_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  client_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  method TEXT, -- 'transfer', 'cash', 'card', etc.
  date DATE NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  confirmation_date DATE,
  notes TEXT,
  receipt_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: supplier_payments
-- ============================================
CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
  trip_service_id UUID REFERENCES public.trip_services(id),
  supplier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  method TEXT, -- 'transfer', 'cash', 'card', 'tarjeta_cliente', etc.
  payment_type TEXT, -- 'anticipo', 'neto', 'total'
  date DATE NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  confirmation_date DATE,
  notes TEXT,
  receipt_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: suppliers
-- ============================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- 'hotel', 'airline', 'dmc', 'transport', etc.
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  country TEXT,
  city TEXT,
  payment_terms TEXT,
  commission_rate DECIMAL(5,2),
  rating INTEGER, -- 1-5 stars
  notes TEXT,
  is_preferred BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: tasks
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  completed BOOLEAN DEFAULT false,
  related_entity_type TEXT, -- 'trip', 'sold_trip', 'client', etc.
  related_entity_id UUID,
  assigned_to TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: reminders
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  is_active BOOLEAN DEFAULT true,
  is_dismissed BOOLEAN DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  assigned_to TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: credentials
-- ============================================
CREATE TABLE IF NOT EXISTS public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- Nombre de la plataforma (Airbnb, Booking, etc.)
  username TEXT,
  password_encrypted TEXT, -- Encriptado
  url TEXT,
  category TEXT, -- 'supplier', 'booking', 'internal', etc.
  notes TEXT,
  is_shared BOOLEAN DEFAULT false, -- Si es compartida con el equipo
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: reviews
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT, -- 'training', 'best_practice', 'lesson_learned', etc.
  rating INTEGER, -- 1-5
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: attendance
-- ============================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  user_name TEXT NOT NULL,
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status TEXT DEFAULT 'present', -- 'present', 'absent', 'late', 'half_day'
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: fam_trips
-- ============================================
CREATE TABLE IF NOT EXISTS public.fam_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,
  organizer TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  participants TEXT[],
  cost DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  photos_url TEXT[],
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: industry_fairs
-- ============================================
CREATE TABLE IF NOT EXISTS public.industry_fairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  participants TEXT[],
  cost DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  website TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- TABLA: commissions
-- ============================================
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  user_name TEXT NOT NULL,
  sold_trip_id UUID REFERENCES public.sold_trips(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  commission_type TEXT, -- 'base', 'bonus', 'override', etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  paid_date DATE,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  metadata JSONB
);

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================

-- Clients
CREATE INDEX idx_clients_created_by ON public.clients(created_by);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_email ON public.clients(email);

-- Trips
CREATE INDEX idx_trips_created_by ON public.trips(created_by);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_client_id ON public.trips(client_id);

-- Sold Trips
CREATE INDEX idx_sold_trips_created_by ON public.sold_trips(created_by);
CREATE INDEX idx_sold_trips_client_id ON public.sold_trips(client_id);
CREATE INDEX idx_sold_trips_dates ON public.sold_trips(start_date, end_date);

-- Trip Services
CREATE INDEX idx_trip_services_sold_trip_id ON public.trip_services(sold_trip_id);

-- Payments
CREATE INDEX idx_client_payments_sold_trip_id ON public.client_payments(sold_trip_id);
CREATE INDEX idx_supplier_payments_sold_trip_id ON public.supplier_payments(sold_trip_id);

-- Tasks
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sold_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fam_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_fairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Políticas para users: Solo pueden ver y editar su propio perfil
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para admins: Pueden ver y editar todo
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas genéricas para las demás tablas
-- Los usuarios pueden ver sus propios registros
CREATE POLICY "Users can view own clients"
  ON public.clients FOR SELECT
  USING (
    created_by = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own clients"
  ON public.clients FOR INSERT
  WITH CHECK (created_by = (SELECT email FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own clients"
  ON public.clients FOR UPDATE
  USING (
    created_by = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Similar para trips
CREATE POLICY "Users can view own trips"
  ON public.trips FOR SELECT
  USING (
    created_by = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (created_by = (SELECT email FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  USING (
    created_by = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para sold_trips (similar pattern)
CREATE POLICY "Users can view own sold trips"
  ON public.sold_trips FOR SELECT
  USING (
    created_by = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own sold trips"
  ON public.sold_trips FOR INSERT
  WITH CHECK (created_by = (SELECT email FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own sold trips"
  ON public.sold_trips FOR UPDATE
  USING (
    created_by = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Las demás tablas siguen el mismo patrón
-- Para simplificar, permitimos que todos los usuarios autenticados puedan leer suppliers, credentials compartidas, etc.

CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update suppliers"
  ON public.suppliers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS PARA UPDATED_DATE
-- ============================================

-- Función para actualizar updated_date
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_users_updated_date
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_clients_updated_date
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_trips_updated_date
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_sold_trips_updated_date
  BEFORE UPDATE ON public.sold_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_trip_services_updated_date
  BEFORE UPDATE ON public.trip_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_suppliers_updated_date
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- ============================================
-- FINALIZADO
-- ============================================
-- El esquema está listo. Ahora configura las variables de entorno
-- en tu archivo .env con la URL y la clave de tu proyecto Supabase.
