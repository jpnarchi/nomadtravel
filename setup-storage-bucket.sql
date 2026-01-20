-- ============================================================================
-- Storage Bucket Setup para Trip Documents
-- Execute este script en Supabase Dashboard > SQL Editor
-- ============================================================================

-- ⚠️ IMPORTANTE: PRIMERO crea el bucket manualmente en Supabase Dashboard:
-- 1. Ve a Storage en el menú lateral
-- 2. Haz clic en "New bucket"
-- 3. Nombre: trip-documents
-- 4. Public bucket: TRUE (marca el checkbox)
-- 5. Haz clic en "Create bucket"
--
-- LUEGO ejecuta este script completo para crear las políticas:
-- ============================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can view trip documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload trip documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update trip documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete trip documents" ON storage.objects;

-- Política: Todos pueden ver documentos en el bucket trip-documents
CREATE POLICY "Anyone can view trip documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-documents');

-- Política: Todos pueden subir documentos
CREATE POLICY "Authenticated users can upload trip documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trip-documents');

-- Política: Todos pueden actualizar documentos
CREATE POLICY "Authenticated users can update trip documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'trip-documents');

-- Política: Todos pueden eliminar documentos
CREATE POLICY "Authenticated users can delete trip documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'trip-documents');


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver el bucket creado
SELECT
  id,
  name,
  public
FROM storage.buckets
WHERE name = 'trip-documents';

-- Ver las políticas de storage
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE '%trip documents%';
