-- ========================================
-- FIX RLS PARA ERROR REPORTS CON CLERK
-- ========================================

-- 1. Drop todas las políticas existentes
DROP POLICY IF EXISTS "Allow all authenticated users to read error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow all authenticated users to insert error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow all authenticated users to update error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow authenticated users to read error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow authenticated users to update error reports" ON error_reports;

-- 2. Crear políticas que permitan tanto authenticated como anon (para Clerk)
CREATE POLICY "Allow users to read error reports"
  ON error_reports
  FOR SELECT
  USING (true);

CREATE POLICY "Allow users to insert error reports"
  ON error_reports
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to update error reports"
  ON error_reports
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. Drop políticas de storage existentes
DROP POLICY IF EXISTS "Allow authenticated users to upload error screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to error screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete error screenshots" ON storage.objects;

-- 4. Crear políticas de storage que permitan anon también
CREATE POLICY "Allow users to upload error screenshots"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'error-reports');

CREATE POLICY "Allow public read access to error screenshots"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'error-reports');

CREATE POLICY "Allow users to delete error screenshots"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'error-reports');

-- ========================================
-- ✅ FIX COMPLETADO
-- Las políticas ahora permiten tanto usuarios
-- autenticados de Supabase como usuarios de Clerk
-- ========================================
