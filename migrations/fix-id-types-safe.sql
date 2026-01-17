-- ============================================
-- CONVERTIR IDs DE UUID A TEXT PARA MONGODB IDs
-- Versión Segura - Verifica existencia de columnas
-- ============================================

-- ============================================
-- PASO 1: ELIMINAR TODAS LAS FOREIGN KEYS
-- ============================================

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
-- PASO 2: CONVERTIR COLUMNAS UUID A TEXT
-- ============================================

-- Función helper para cambiar tipo de columna si existe
CREATE OR REPLACE FUNCTION alter_column_if_exists(
    p_table_name TEXT,
    p_column_name TEXT,
    p_new_type TEXT
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = p_table_name
        AND column_name = p_column_name
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE %s',
                      p_table_name, p_column_name, p_new_type);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Clients
SELECT alter_column_if_exists('clients', 'id', 'TEXT');
SELECT alter_column_if_exists('clients', 'created_by_id', 'TEXT');

-- Trips
SELECT alter_column_if_exists('trips', 'id', 'TEXT');
SELECT alter_column_if_exists('trips', 'client_id', 'TEXT');
SELECT alter_column_if_exists('trips', 'created_by_id', 'TEXT');

-- Sold Trips
SELECT alter_column_if_exists('sold_trips', 'id', 'TEXT');
SELECT alter_column_if_exists('sold_trips', 'trip_id', 'TEXT');
SELECT alter_column_if_exists('sold_trips', 'client_id', 'TEXT');
SELECT alter_column_if_exists('sold_trips', 'created_by_id', 'TEXT');

-- Trip Services
SELECT alter_column_if_exists('trip_services', 'id', 'TEXT');
SELECT alter_column_if_exists('trip_services', 'sold_trip_id', 'TEXT');
SELECT alter_column_if_exists('trip_services', 'created_by_id', 'TEXT');

-- Client Payments
SELECT alter_column_if_exists('client_payments', 'id', 'TEXT');
SELECT alter_column_if_exists('client_payments', 'sold_trip_id', 'TEXT');
SELECT alter_column_if_exists('client_payments', 'group_member_id', 'TEXT');
SELECT alter_column_if_exists('client_payments', 'paid_for_member_id', 'TEXT');
SELECT alter_column_if_exists('client_payments', 'created_by_id', 'TEXT');

-- Supplier Payments
SELECT alter_column_if_exists('supplier_payments', 'id', 'TEXT');
SELECT alter_column_if_exists('supplier_payments', 'sold_trip_id', 'TEXT');
SELECT alter_column_if_exists('supplier_payments', 'trip_service_id', 'TEXT');
SELECT alter_column_if_exists('supplier_payments', 'created_by_id', 'TEXT');

-- Suppliers
SELECT alter_column_if_exists('suppliers', 'id', 'TEXT');
SELECT alter_column_if_exists('suppliers', 'representative_agency_id', 'TEXT');
SELECT alter_column_if_exists('suppliers', 'created_by_id', 'TEXT');

-- Tasks
SELECT alter_column_if_exists('tasks', 'id', 'TEXT');
SELECT alter_column_if_exists('tasks', 'related_trip_id', 'TEXT');
SELECT alter_column_if_exists('tasks', 'related_client_id', 'TEXT');
SELECT alter_column_if_exists('tasks', 'related_entity_id', 'TEXT');
SELECT alter_column_if_exists('tasks', 'created_by_id', 'TEXT');

-- Credentials
SELECT alter_column_if_exists('credentials', 'id', 'TEXT');
SELECT alter_column_if_exists('credentials', 'supplier_id', 'TEXT');
SELECT alter_column_if_exists('credentials', 'created_by_id', 'TEXT');

-- Reviews
SELECT alter_column_if_exists('reviews', 'id', 'TEXT');
SELECT alter_column_if_exists('reviews', 'created_by_id', 'TEXT');

-- Attendance
SELECT alter_column_if_exists('attendance', 'id', 'TEXT');
SELECT alter_column_if_exists('attendance', 'user_id', 'TEXT');
SELECT alter_column_if_exists('attendance', 'created_by_id', 'TEXT');

-- Industry Fairs
SELECT alter_column_if_exists('industry_fairs', 'id', 'TEXT');
SELECT alter_column_if_exists('industry_fairs', 'created_by_id', 'TEXT');

-- Commissions
SELECT alter_column_if_exists('commissions', 'id', 'TEXT');
SELECT alter_column_if_exists('commissions', 'user_id', 'TEXT');
SELECT alter_column_if_exists('commissions', 'sold_trip_id', 'TEXT');
SELECT alter_column_if_exists('commissions', 'created_by_id', 'TEXT');

-- Reminders
SELECT alter_column_if_exists('reminders', 'id', 'TEXT');
SELECT alter_column_if_exists('reminders', 'sold_trip_id', 'TEXT');
SELECT alter_column_if_exists('reminders', 'related_entity_id', 'TEXT');
SELECT alter_column_if_exists('reminders', 'created_by_id', 'TEXT');

-- Client Payment Plans
SELECT alter_column_if_exists('client_payment_plans', 'id', 'TEXT');
SELECT alter_column_if_exists('client_payment_plans', 'sold_trip_id', 'TEXT');
SELECT alter_column_if_exists('client_payment_plans', 'created_by_id', 'TEXT');

-- Trip Notes
SELECT alter_column_if_exists('trip_notes', 'id', 'TEXT');
SELECT alter_column_if_exists('trip_notes', 'sold_trip_id', 'TEXT');
SELECT alter_column_if_exists('trip_notes', 'created_by_id', 'TEXT');

-- Trip Document Files
SELECT alter_column_if_exists('trip_document_files', 'id', 'TEXT');
SELECT alter_column_if_exists('trip_document_files', 'sold_trip_id', 'TEXT');
SELECT alter_column_if_exists('trip_document_files', 'created_by_id', 'TEXT');

-- Travel Documents
SELECT alter_column_if_exists('travel_documents', 'id', 'TEXT');
SELECT alter_column_if_exists('travel_documents', 'client_id', 'TEXT');
SELECT alter_column_if_exists('travel_documents', 'trip_id', 'TEXT');
SELECT alter_column_if_exists('travel_documents', 'created_by_id', 'TEXT');

-- Fam Trips
SELECT alter_column_if_exists('fam_trips', 'id', 'TEXT');
SELECT alter_column_if_exists('fam_trips', 'created_by_id', 'TEXT');

-- Limpiar función helper
DROP FUNCTION alter_column_if_exists;

-- ============================================
-- PASO 3: RECREAR FOREIGN KEYS
-- ============================================

-- Helper para crear FK si las columnas existen
CREATE OR REPLACE FUNCTION add_fk_if_columns_exist(
    p_table_name TEXT,
    p_constraint_name TEXT,
    p_column_name TEXT,
    p_ref_table TEXT,
    p_ref_column TEXT,
    p_on_delete TEXT DEFAULT ''
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = p_table_name
        AND column_name = p_column_name
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = p_ref_table
        AND column_name = p_ref_column
    ) THEN
        EXECUTE format(
            'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I) %s',
            p_table_name, p_constraint_name, p_column_name, p_ref_table, p_ref_column, p_on_delete
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear todas las foreign keys
SELECT add_fk_if_columns_exist('trips', 'trips_client_id_fkey', 'client_id', 'clients', 'id');
SELECT add_fk_if_columns_exist('sold_trips', 'sold_trips_trip_id_fkey', 'trip_id', 'trips', 'id');
SELECT add_fk_if_columns_exist('sold_trips', 'sold_trips_client_id_fkey', 'client_id', 'clients', 'id');
SELECT add_fk_if_columns_exist('trip_services', 'trip_services_sold_trip_id_fkey', 'sold_trip_id', 'sold_trips', 'id', 'ON DELETE CASCADE');
SELECT add_fk_if_columns_exist('client_payments', 'client_payments_sold_trip_id_fkey', 'sold_trip_id', 'sold_trips', 'id', 'ON DELETE CASCADE');
SELECT add_fk_if_columns_exist('supplier_payments', 'supplier_payments_sold_trip_id_fkey', 'sold_trip_id', 'sold_trips', 'id', 'ON DELETE CASCADE');
SELECT add_fk_if_columns_exist('supplier_payments', 'supplier_payments_trip_service_id_fkey', 'trip_service_id', 'trip_services', 'id');
SELECT add_fk_if_columns_exist('tasks', 'tasks_related_trip_id_fkey', 'related_trip_id', 'trips', 'id');
SELECT add_fk_if_columns_exist('tasks', 'tasks_related_client_id_fkey', 'related_client_id', 'clients', 'id');
SELECT add_fk_if_columns_exist('credentials', 'credentials_supplier_id_fkey', 'supplier_id', 'suppliers', 'id');
SELECT add_fk_if_columns_exist('commissions', 'commissions_sold_trip_id_fkey', 'sold_trip_id', 'sold_trips', 'id');
SELECT add_fk_if_columns_exist('reminders', 'reminders_sold_trip_id_fkey', 'sold_trip_id', 'sold_trips', 'id');
SELECT add_fk_if_columns_exist('client_payment_plans', 'client_payment_plans_sold_trip_id_fkey', 'sold_trip_id', 'sold_trips', 'id', 'ON DELETE CASCADE');
SELECT add_fk_if_columns_exist('trip_notes', 'trip_notes_sold_trip_id_fkey', 'sold_trip_id', 'sold_trips', 'id', 'ON DELETE CASCADE');
SELECT add_fk_if_columns_exist('trip_document_files', 'trip_document_files_sold_trip_id_fkey', 'sold_trip_id', 'sold_trips', 'id', 'ON DELETE CASCADE');
SELECT add_fk_if_columns_exist('travel_documents', 'travel_documents_client_id_fkey', 'client_id', 'clients', 'id');
SELECT add_fk_if_columns_exist('travel_documents', 'travel_documents_trip_id_fkey', 'trip_id', 'trips', 'id');

-- Limpiar función helper
DROP FUNCTION add_fk_if_columns_exist;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name = 'id' OR column_name LIKE '%_id')
  AND table_name IN ('clients', 'trips', 'sold_trips', 'trip_services', 'suppliers', 'client_payments', 'supplier_payments')
ORDER BY table_name, column_name;
