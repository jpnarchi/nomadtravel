-- ============================================================
-- SOLUCIÓN ALTERNATIVA: Sin necesidad de permisos de OWNER
-- ============================================================
-- Este script funciona con permisos normales de Supabase
-- ============================================================

-- PASO 1: Crear el bucket si no existe
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- PASO 2: Eliminar políticas anteriores si existen
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload files to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read files from documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update files in documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete files from documents bucket" ON storage.objects;

-- PASO 3: Crear políticas permisivas que funcionan sin autenticación
-- ============================================================

-- Permitir insertar archivos (usar anon en lugar de public)
CREATE POLICY "Allow anon uploads to documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'documents');

-- Permitir leer archivos públicamente
CREATE POLICY "Allow public reads from documents"
ON storage.objects FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'documents');

-- Permitir actualizar archivos
CREATE POLICY "Allow anon updates to documents"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'documents');

-- Permitir eliminar archivos
CREATE POLICY "Allow anon deletes from documents"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'documents');

-- PASO 4: Verificar el resultado
-- ============================================================
SELECT
    policyname as politica,
    CASE
        WHEN cmd = 'SELECT' THEN 'Lectura'
        WHEN cmd = 'INSERT' THEN 'Subida'
        WHEN cmd = 'UPDATE' THEN 'Actualización'
        WHEN cmd = 'DELETE' THEN 'Eliminación'
    END as tipo,
    roles as para_roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%documents%'
ORDER BY cmd;

-- ============================================================
-- RESULTADO ESPERADO:
-- Deberías ver 4 políticas creadas para el bucket documents
--
-- Después de ejecutar esto, RECARGA tu aplicación
-- e intenta subir un archivo nuevamente.
-- ============================================================
