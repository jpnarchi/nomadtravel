-- =================================================================
-- FIX: Políticas de Storage para funcionar con Clerk Auth
-- =================================================================
-- Este script corrige las políticas de storage para permitir
-- subidas de archivos cuando se usa Clerk en lugar de Supabase Auth
-- =================================================================

-- OPCIÓN 1: Eliminar todas las políticas existentes y crear nuevas permisivas
-- =====================================================

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;

-- Crear políticas permisivas para el bucket 'documents'
-- =====================================================

-- Permitir a TODOS insertar archivos en el bucket documents
CREATE POLICY "Anyone can upload files to documents bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Permitir a TODOS leer archivos del bucket documents
CREATE POLICY "Anyone can read files from documents bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Permitir a TODOS actualizar archivos en el bucket documents
CREATE POLICY "Anyone can update files in documents bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents');

-- Permitir a TODOS eliminar archivos del bucket documents
CREATE POLICY "Anyone can delete files from documents bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

-- =================================================================
-- IMPORTANTE: Estas políticas son permisivas para desarrollo
-- En producción, considera implementar validación en el backend
-- o integrar Clerk JWT con Supabase RLS
-- =================================================================
