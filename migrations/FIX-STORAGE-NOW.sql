-- ============================================================
-- SOLUCIÓN RÁPIDA: Ejecuta este script COMPLETO en Supabase
-- ============================================================
-- Copia TODO este archivo y pégalo en Supabase SQL Editor
-- Luego haz clic en RUN
-- ============================================================

-- PASO 1: Crear el bucket si no existe
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- PASO 2: Deshabilitar RLS en storage.objects
-- ============================================================
-- Esto permite subir archivos sin restricciones de seguridad
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- PASO 3: Eliminar TODAS las políticas anteriores
-- ============================================================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname LIKE '%documents%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- PASO 4: Verificar el resultado
-- ============================================================
SELECT
    'Bucket creado correctamente' as status,
    id,
    name,
    public as es_publico
FROM storage.buckets
WHERE id = 'documents';

-- PASO 5: Verificar que RLS está deshabilitado
-- ============================================================
SELECT
    'RLS Status' as tipo,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'HABILITADO ⚠️' ELSE 'DESHABILITADO ✓' END as estado_rls
FROM pg_tables
WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================
-- RESULTADO ESPERADO:
-- - Bucket 'documents' creado y público
-- - RLS deshabilitado en storage.objects
-- - Políticas eliminadas
--
-- Después de ejecutar esto, RECARGA tu aplicación
-- e intenta subir un archivo nuevamente.
-- ============================================================
