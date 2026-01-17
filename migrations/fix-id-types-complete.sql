-- ============================================
-- PASO 1: ELIMINAR TODAS LAS FOREIGN KEYS
-- ============================================

-- Función para eliminar todas las foreign keys automáticamente
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) ||
                ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- ============================================
-- PASO 2: CONVERTIR TODAS LAS COLUMNAS UUID A TEXT
-- ============================================

-- Users (solo created_by_id, el id principal debe seguir siendo UUID para auth)
ALTER TABLE public.users
  ALTER COLUMN created_by_id TYPE TEXT;

-- Clients
ALTER TABLE public.clients
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Trips
ALTER TABLE public.trips
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN client_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Sold Trips
ALTER TABLE public.sold_trips
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN trip_id TYPE TEXT,
  ALTER COLUMN client_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Trip Services
ALTER TABLE public.trip_services
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN sold_trip_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Client Payments
ALTER TABLE public.client_payments
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN sold_trip_id TYPE TEXT,
  ALTER COLUMN group_member_id TYPE TEXT,
  ALTER COLUMN paid_for_member_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Supplier Payments
ALTER TABLE public.supplier_payments
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN sold_trip_id TYPE TEXT,
  ALTER COLUMN trip_service_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Suppliers
ALTER TABLE public.suppliers
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN representative_agency_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Tasks
ALTER TABLE public.tasks
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN related_trip_id TYPE TEXT,
  ALTER COLUMN related_client_id TYPE TEXT,
  ALTER COLUMN related_entity_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Credentials
ALTER TABLE public.credentials
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN supplier_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Reviews
ALTER TABLE public.reviews
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Attendance
ALTER TABLE public.attendance
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Industry Fairs
ALTER TABLE public.industry_fairs
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Commissions (esta es la que estaba causando el error)
ALTER TABLE public.commissions
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN sold_trip_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Reminders
ALTER TABLE public.reminders
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN sold_trip_id TYPE TEXT,
  ALTER COLUMN related_entity_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Client Payment Plans
ALTER TABLE public.client_payment_plans
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN sold_trip_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Trip Notes
ALTER TABLE public.trip_notes
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN sold_trip_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Trip Document Files
ALTER TABLE public.trip_document_files
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN sold_trip_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Travel Documents
ALTER TABLE public.travel_documents
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN client_id TYPE TEXT,
  ALTER COLUMN trip_id TYPE TEXT,
  ALTER COLUMN created_by_id TYPE TEXT;

-- Fam Trips (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fam_trips') THEN
    EXECUTE 'ALTER TABLE public.fam_trips ALTER COLUMN id TYPE TEXT';
    EXECUTE 'ALTER TABLE public.fam_trips ALTER COLUMN created_by_id TYPE TEXT';
  END IF;
END $$;

-- ============================================
-- PASO 3: RECREAR FOREIGN KEYS (AHORA COMO TEXT)
-- ============================================

-- Trips -> Clients
ALTER TABLE public.trips
  ADD CONSTRAINT trips_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id);

-- Sold Trips
ALTER TABLE public.sold_trips
  ADD CONSTRAINT sold_trips_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES public.trips(id);

ALTER TABLE public.sold_trips
  ADD CONSTRAINT sold_trips_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id);

-- Trip Services
ALTER TABLE public.trip_services
  ADD CONSTRAINT trip_services_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

-- Client Payments
ALTER TABLE public.client_payments
  ADD CONSTRAINT client_payments_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

-- Supplier Payments
ALTER TABLE public.supplier_payments
  ADD CONSTRAINT supplier_payments_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

ALTER TABLE public.supplier_payments
  ADD CONSTRAINT supplier_payments_trip_service_id_fkey
  FOREIGN KEY (trip_service_id) REFERENCES public.trip_services(id);

-- Tasks
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_related_trip_id_fkey
  FOREIGN KEY (related_trip_id) REFERENCES public.trips(id);

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_related_client_id_fkey
  FOREIGN KEY (related_client_id) REFERENCES public.clients(id);

-- Credentials
ALTER TABLE public.credentials
  ADD CONSTRAINT credentials_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

-- Commissions
ALTER TABLE public.commissions
  ADD CONSTRAINT commissions_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id);

-- Reminders
ALTER TABLE public.reminders
  ADD CONSTRAINT reminders_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id);

-- Client Payment Plans
ALTER TABLE public.client_payment_plans
  ADD CONSTRAINT client_payment_plans_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

-- Trip Notes
ALTER TABLE public.trip_notes
  ADD CONSTRAINT trip_notes_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

-- Trip Document Files
ALTER TABLE public.trip_document_files
  ADD CONSTRAINT trip_document_files_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

-- Travel Documents
ALTER TABLE public.travel_documents
  ADD CONSTRAINT travel_documents_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id);

ALTER TABLE public.travel_documents
  ADD CONSTRAINT travel_documents_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES public.trips(id);

-- ============================================
-- PASO 4: RECREAR ÍNDICES SI ES NECESARIO
-- ============================================

-- Los índices existentes deberían seguir funcionando,
-- pero si hay problemas, se pueden recrear aquí

-- ============================================
-- FINALIZADO
-- ============================================

-- Verificar que todo esté bien
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%_id'
  AND table_name IN ('clients', 'trips', 'sold_trips', 'trip_services', 'commissions')
ORDER BY table_name, column_name;
