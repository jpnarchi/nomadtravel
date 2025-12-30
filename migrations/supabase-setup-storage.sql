-- =================================================================
-- CONFIGURACIÓN DE STORAGE Y TABLA DE DOCUMENTOS DE VIAJE
-- =================================================================
-- Este script configura el almacenamiento de archivos y la tabla
-- para gestionar documentos de viaje (pasaportes, visas, etc.)
-- =================================================================

-- 1. CREAR TABLA DE DOCUMENTOS DE VIAJE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.travel_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL, -- 'pasaporte', 'visa', etc.
  name TEXT NOT NULL,
  file_url TEXT,
  file_path TEXT, -- Ruta del archivo en Supabase Storage
  expiry_date DATE,
  country TEXT,
  document_number TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_travel_documents_client_id ON public.travel_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_trip_id ON public.travel_documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_type ON public.travel_documents(document_type);

-- 2. CREAR BUCKET DE STORAGE
-- =====================================================
-- NOTA: Los buckets en Supabase se crean desde el panel de administración o mediante código.
-- Ejecuta este código en el panel de Supabase > Storage > New bucket
-- O usa la siguiente instrucción:

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 3. CONFIGURAR POLÍTICAS DE SEGURIDAD PARA STORAGE
-- =====================================================

-- Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Política para permitir a usuarios autenticados leer archivos
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Política para permitir a usuarios autenticados actualizar archivos
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Política para permitir a usuarios autenticados eliminar archivos
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Política para acceso público a los archivos (si el bucket es público)
CREATE POLICY "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- 4. COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE public.travel_documents IS 'Almacena documentos de viaje de clientes (pasaportes, visas, etc.)';
COMMENT ON COLUMN public.travel_documents.document_type IS 'Tipo de documento: pasaporte, visa, etc.';
COMMENT ON COLUMN public.travel_documents.file_path IS 'Ruta del archivo en Supabase Storage para poder eliminarlo';
COMMENT ON COLUMN public.travel_documents.client_id IS 'Cliente al que pertenece el documento';
COMMENT ON COLUMN public.travel_documents.trip_id IS 'Viaje asociado (opcional)';
