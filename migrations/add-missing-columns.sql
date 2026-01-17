-- ============================================
-- AGREGAR COLUMNAS FALTANTES A TABLAS NUEVAS
-- ============================================

-- trip_notes - agregar is_sample
ALTER TABLE public.trip_notes
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- trip_document_files - agregar document_type e is_sample
ALTER TABLE public.trip_document_files
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- travel_documents - agregar is_sample
ALTER TABLE public.travel_documents
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

-- Verificación
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('trip_notes', 'trip_document_files', 'travel_documents')
  AND column_name IN ('is_sample', 'document_type', 'created_by_id')
ORDER BY table_name, column_name;
