-- =================================================================
-- DISABLE RLS (ALTERNATIVE APPROACH - FOR DEVELOPMENT ONLY)
-- =================================================================
-- WARNING: This makes your tables publicly accessible with the anon key
-- Only use this for development, re-enable RLS for production
--
-- RECOMMENDED: Use supabase-fix-rls.sql instead to keep RLS enabled
-- with permissive policies
-- =================================================================

-- Disable Row Level Security on all tables
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE sold_trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE travel_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE fam_trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE industry_fairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE commissions DISABLE ROW LEVEL SECURITY;

-- Optional: Drop all policies (cleanup)
DROP POLICY IF EXISTS "Allow anon access" ON clients;
DROP POLICY IF EXISTS "Allow anon access" ON trips;
DROP POLICY IF EXISTS "Allow anon access" ON sold_trips;
DROP POLICY IF EXISTS "Allow anon access" ON trip_services;
DROP POLICY IF EXISTS "Allow anon access" ON client_payments;
DROP POLICY IF EXISTS "Allow anon access" ON supplier_payments;
DROP POLICY IF EXISTS "Allow anon access" ON tasks;
DROP POLICY IF EXISTS "Allow anon access" ON suppliers;
DROP POLICY IF EXISTS "Allow anon access" ON credentials;
DROP POLICY IF EXISTS "Allow anon access" ON reviews;
DROP POLICY IF EXISTS "Allow anon access" ON learning_materials;
DROP POLICY IF EXISTS "Allow anon access" ON travel_documents;
DROP POLICY IF EXISTS "Allow anon access" ON reminders;
DROP POLICY IF EXISTS "Allow anon access" ON attendance;
DROP POLICY IF EXISTS "Allow anon access" ON fam_trips;
DROP POLICY IF EXISTS "Allow anon access" ON industry_fairs;
DROP POLICY IF EXISTS "Allow anon access" ON commissions;
