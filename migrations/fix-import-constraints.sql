-- ============================================
-- ARREGLAR RESTRICCIONES PARA IMPORTACIÓN
-- ============================================

-- 1. Hacer reminder_date opcional (para trip reminders que son tareas, no fechas)
ALTER TABLE public.reminders
  ALTER COLUMN reminder_date DROP NOT NULL;

-- 2. Hacer end_date opcional en sold_trips (algunos viajes en curso)
ALTER TABLE public.sold_trips
  ALTER COLUMN end_date DROP NOT NULL;

-- 3. Hacer start_date opcional en sold_trips
ALTER TABLE public.sold_trips
  ALTER COLUMN start_date DROP NOT NULL;

-- 4. Agregar created_by_id a las tablas nuevas si no existe
DO $$
BEGIN
  -- trip_notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_notes' AND column_name = 'created_by_id'
  ) THEN
    ALTER TABLE public.trip_notes ADD COLUMN created_by_id TEXT;
  END IF;

  -- trip_document_files
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_document_files' AND column_name = 'created_by_id'
  ) THEN
    ALTER TABLE public.trip_document_files ADD COLUMN created_by_id TEXT;
  END IF;

  -- travel_documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_documents' AND column_name = 'created_by_id'
  ) THEN
    ALTER TABLE public.travel_documents ADD COLUMN created_by_id TEXT;
  END IF;
END $$;

-- 5. Verificación final
SELECT
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('reminders', 'sold_trips', 'trip_notes', 'trip_document_files', 'travel_documents')
  AND column_name IN ('reminder_date', 'start_date', 'end_date', 'created_by_id')
ORDER BY table_name, column_name;
