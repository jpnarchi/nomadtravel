-- ============================================
-- CONVERTIR IDs DE UUID A TEXT PARA MONGODB IDs
-- ============================================
-- Este script permite usar los IDs originales de MongoDB

-- IMPORTANTE: Primero deshabilitar RLS y eliminar foreign keys

-- Eliminar foreign keys existentes
ALTER TABLE public.sold_trips DROP CONSTRAINT IF EXISTS sold_trips_trip_id_fkey;
ALTER TABLE public.sold_trips DROP CONSTRAINT IF EXISTS sold_trips_client_id_fkey;
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_client_id_fkey;
ALTER TABLE public.trip_services DROP CONSTRAINT IF EXISTS trip_services_sold_trip_id_fkey;
ALTER TABLE public.client_payments DROP CONSTRAINT IF EXISTS client_payments_sold_trip_id_fkey;
ALTER TABLE public.supplier_payments DROP CONSTRAINT IF EXISTS supplier_payments_sold_trip_id_fkey;
ALTER TABLE public.supplier_payments DROP CONSTRAINT IF EXISTS supplier_payments_trip_service_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_related_trip_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_related_client_id_fkey;
ALTER TABLE public.credentials DROP CONSTRAINT IF EXISTS credentials_supplier_id_fkey;
ALTER TABLE public.client_payment_plans DROP CONSTRAINT IF EXISTS client_payment_plans_sold_trip_id_fkey;
ALTER TABLE public.trip_notes DROP CONSTRAINT IF EXISTS trip_notes_sold_trip_id_fkey;
ALTER TABLE public.trip_document_files DROP CONSTRAINT IF EXISTS trip_document_files_sold_trip_id_fkey;
ALTER TABLE public.travel_documents DROP CONSTRAINT IF EXISTS travel_documents_client_id_fkey;
ALTER TABLE public.travel_documents DROP CONSTRAINT IF EXISTS travel_documents_trip_id_fkey;
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_sold_trip_id_fkey;

-- Cambiar tipo de columnas ID de UUID a TEXT en todas las tablas
-- Clients
ALTER TABLE public.clients ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.clients ALTER COLUMN created_by_id TYPE TEXT;

-- Trips
ALTER TABLE public.trips ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.trips ALTER COLUMN client_id TYPE TEXT;
ALTER TABLE public.trips ALTER COLUMN created_by_id TYPE TEXT;

-- Sold Trips
ALTER TABLE public.sold_trips ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.sold_trips ALTER COLUMN trip_id TYPE TEXT;
ALTER TABLE public.sold_trips ALTER COLUMN client_id TYPE TEXT;
ALTER TABLE public.sold_trips ALTER COLUMN created_by_id TYPE TEXT;

-- Trip Services
ALTER TABLE public.trip_services ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.trip_services ALTER COLUMN sold_trip_id TYPE TEXT;
ALTER TABLE public.trip_services ALTER COLUMN created_by_id TYPE TEXT;

-- Client Payments
ALTER TABLE public.client_payments ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.client_payments ALTER COLUMN sold_trip_id TYPE TEXT;
ALTER TABLE public.client_payments ALTER COLUMN group_member_id TYPE TEXT;
ALTER TABLE public.client_payments ALTER COLUMN paid_for_member_id TYPE TEXT;
ALTER TABLE public.client_payments ALTER COLUMN created_by_id TYPE TEXT;

-- Supplier Payments
ALTER TABLE public.supplier_payments ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.supplier_payments ALTER COLUMN sold_trip_id TYPE TEXT;
ALTER TABLE public.supplier_payments ALTER COLUMN trip_service_id TYPE TEXT;
ALTER TABLE public.supplier_payments ALTER COLUMN created_by_id TYPE TEXT;

-- Suppliers
ALTER TABLE public.suppliers ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.suppliers ALTER COLUMN representative_agency_id TYPE TEXT;
ALTER TABLE public.suppliers ALTER COLUMN created_by_id TYPE TEXT;

-- Tasks
ALTER TABLE public.tasks ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN related_trip_id TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN related_client_id TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN created_by_id TYPE TEXT;

-- Credentials
ALTER TABLE public.credentials ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.credentials ALTER COLUMN supplier_id TYPE TEXT;
ALTER TABLE public.credentials ALTER COLUMN created_by_id TYPE TEXT;

-- Reviews
ALTER TABLE public.reviews ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.reviews ALTER COLUMN created_by_id TYPE TEXT;

-- Attendance
ALTER TABLE public.attendance ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.attendance ALTER COLUMN created_by_id TYPE TEXT;

-- Industry Fairs
ALTER TABLE public.industry_fairs ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.industry_fairs ALTER COLUMN created_by_id TYPE TEXT;

-- Commissions
ALTER TABLE public.commissions ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.commissions ALTER COLUMN created_by_id TYPE TEXT;

-- Reminders
ALTER TABLE public.reminders ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.reminders ALTER COLUMN sold_trip_id TYPE TEXT;
ALTER TABLE public.reminders ALTER COLUMN created_by_id TYPE TEXT;

-- Client Payment Plans
ALTER TABLE public.client_payment_plans ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.client_payment_plans ALTER COLUMN sold_trip_id TYPE TEXT;
ALTER TABLE public.client_payment_plans ALTER COLUMN created_by_id TYPE TEXT;

-- Trip Notes
ALTER TABLE public.trip_notes ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.trip_notes ALTER COLUMN sold_trip_id TYPE TEXT;
ALTER TABLE public.trip_notes ALTER COLUMN created_by_id TYPE TEXT;

-- Trip Document Files
ALTER TABLE public.trip_document_files ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.trip_document_files ALTER COLUMN sold_trip_id TYPE TEXT;
ALTER TABLE public.trip_document_files ALTER COLUMN created_by_id TYPE TEXT;

-- Travel Documents
ALTER TABLE public.travel_documents ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.travel_documents ALTER COLUMN client_id TYPE TEXT;
ALTER TABLE public.travel_documents ALTER COLUMN trip_id TYPE TEXT;
ALTER TABLE public.travel_documents ALTER COLUMN created_by_id TYPE TEXT;

-- Fam Trips (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fam_trips') THEN
    ALTER TABLE public.fam_trips ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.fam_trips ALTER COLUMN created_by_id TYPE TEXT;
  END IF;
END $$;

-- Recrear foreign keys (ahora como TEXT)
ALTER TABLE public.trips
  ADD CONSTRAINT trips_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id);

ALTER TABLE public.sold_trips
  ADD CONSTRAINT sold_trips_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES public.trips(id);

ALTER TABLE public.sold_trips
  ADD CONSTRAINT sold_trips_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id);

ALTER TABLE public.trip_services
  ADD CONSTRAINT trip_services_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

ALTER TABLE public.client_payments
  ADD CONSTRAINT client_payments_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

ALTER TABLE public.supplier_payments
  ADD CONSTRAINT supplier_payments_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

ALTER TABLE public.supplier_payments
  ADD CONSTRAINT supplier_payments_trip_service_id_fkey
  FOREIGN KEY (trip_service_id) REFERENCES public.trip_services(id);

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_related_trip_id_fkey
  FOREIGN KEY (related_trip_id) REFERENCES public.trips(id);

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_related_client_id_fkey
  FOREIGN KEY (related_client_id) REFERENCES public.clients(id);

ALTER TABLE public.credentials
  ADD CONSTRAINT credentials_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE public.client_payment_plans
  ADD CONSTRAINT client_payment_plans_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

ALTER TABLE public.trip_notes
  ADD CONSTRAINT trip_notes_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

ALTER TABLE public.trip_document_files
  ADD CONSTRAINT trip_document_files_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id) ON DELETE CASCADE;

ALTER TABLE public.travel_documents
  ADD CONSTRAINT travel_documents_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id);

ALTER TABLE public.travel_documents
  ADD CONSTRAINT travel_documents_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES public.trips(id);

ALTER TABLE public.reminders
  ADD CONSTRAINT reminders_sold_trip_id_fkey
  FOREIGN KEY (sold_trip_id) REFERENCES public.sold_trips(id);

-- ============================================
-- FINALIZADO
-- ============================================
