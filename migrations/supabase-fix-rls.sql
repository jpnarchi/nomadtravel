-- =================================================================
-- FIX RLS POLICIES FOR CLERK AUTHENTICATION
-- =================================================================
-- Since this app uses Clerk (not Supabase Auth), we need permissive
-- RLS policies that allow access with the anon key.
-- Execute this in Supabase SQL Editor
-- =================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON clients;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON trips;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON sold_trips;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON trip_services;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON client_payments;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON supplier_payments;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON credentials;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON reviews;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON learning_materials;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON travel_documents;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON reminders;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON attendance;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON fam_trips;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON industry_fairs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON commissions;

-- Drop any existing anon policies
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

-- Create permissive policies for all tables
-- These policies allow full access (SELECT, INSERT, UPDATE, DELETE) to anon and authenticated roles
CREATE POLICY "Allow anon access" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON sold_trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON trip_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON client_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON supplier_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON learning_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON travel_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON fam_trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON industry_fairs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON commissions FOR ALL USING (true) WITH CHECK (true);

-- =================================================================
-- RESULTADO ESPERADO:
-- - RLS habilitado en todas las tablas
-- - Políticas permisivas que funcionan con Clerk authentication
-- - Sin errores 401/403 al insertar/actualizar datos
-- =================================================================
