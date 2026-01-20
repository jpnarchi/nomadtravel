-- ============================================
-- Fix trip_document_files table schema
-- ============================================
-- This migration adds missing columns to match the application code

-- Add document_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'trip_document_files'
        AND column_name = 'document_type'
    ) THEN
        ALTER TABLE public.trip_document_files
        ADD COLUMN document_type TEXT;
    END IF;
END $$;

-- Rename document_name to name if document_name exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'trip_document_files'
        AND column_name = 'document_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'trip_document_files'
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.trip_document_files
        RENAME COLUMN document_name TO name;
    END IF;
END $$;

-- Add name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'trip_document_files'
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.trip_document_files
        ADD COLUMN name TEXT NOT NULL;
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
