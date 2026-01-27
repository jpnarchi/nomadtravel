-- Create error_reports table
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

-- Create index on created_date for faster sorting
CREATE INDEX IF NOT EXISTS idx_error_reports_created_date ON error_reports(created_date DESC);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON error_reports(status);

-- Create index on reported_by for faster user lookups
CREATE INDEX IF NOT EXISTS idx_error_reports_reported_by ON error_reports(reported_by);

-- Enable Row Level Security
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read error reports
CREATE POLICY "Allow all authenticated users to read error reports"
  ON error_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow all authenticated users to insert error reports
CREATE POLICY "Allow all authenticated users to insert error reports"
  ON error_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow all authenticated users to update error reports
CREATE POLICY "Allow all authenticated users to update error reports"
  ON error_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER error_reports_updated_at
  BEFORE UPDATE ON error_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_error_reports_updated_at();

-- Create storage bucket for error report screenshots (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('error-reports', 'error-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload to error-reports bucket
CREATE POLICY "Allow authenticated users to upload error screenshots"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'error-reports');

-- Create policy to allow public read access to error-reports bucket
CREATE POLICY "Allow public read access to error screenshots"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'error-reports');

-- Create policy to allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated users to delete error screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'error-reports');
