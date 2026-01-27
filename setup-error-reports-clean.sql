-- ========================================
-- SETUP COMPLETO PARA ERROR REPORTS
-- Ejecuta este script en el SQL Editor de Supabase
-- ========================================

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all authenticated users to read error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow all authenticated users to insert error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow all authenticated users to update error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow authenticated users to read error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert error reports" ON error_reports;
DROP POLICY IF EXISTS "Allow authenticated users to update error reports" ON error_reports;

-- 2. Create error_reports table (if not exists)
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  reported_by VARCHAR(255) NOT NULL,
  reporter_email VARCHAR(255) NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_error_reports_created_date ON error_reports(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_reported_by ON error_reports(reported_by);

-- 4. Create or replace trigger function
CREATE OR REPLACE FUNCTION update_error_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS error_reports_updated_at ON error_reports;
CREATE TRIGGER error_reports_updated_at
  BEFORE UPDATE ON error_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_error_reports_updated_at();

-- 6. Enable Row Level Security
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- 7. Create new policies
CREATE POLICY "Allow authenticated users to read error reports"
  ON error_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert error reports"
  ON error_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update error reports"
  ON error_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Create storage bucket (skip if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('error-reports', 'error-reports', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Drop existing storage policies and create new ones
DROP POLICY IF EXISTS "Allow authenticated users to upload error screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to error screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete error screenshots" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload error screenshots"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'error-reports');

CREATE POLICY "Allow public read access to error screenshots"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'error-reports');

CREATE POLICY "Allow authenticated users to delete error screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'error-reports');

-- ========================================
-- ✅ SETUP COMPLETADO
-- ========================================
