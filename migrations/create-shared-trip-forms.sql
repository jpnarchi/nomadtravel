-- Create shared_trip_forms table for managing shareable trip form links
CREATE TABLE IF NOT EXISTS public.shared_trip_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL,
  agent_email TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_trip_forms_share_token ON public.shared_trip_forms(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_trip_forms_agent_id ON public.shared_trip_forms(agent_id);
CREATE INDEX IF NOT EXISTS idx_shared_trip_forms_is_active ON public.shared_trip_forms(is_active);

-- Add RLS policies (disable RLS for now to match other tables)
ALTER TABLE public.shared_trip_forms DISABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_shared_trip_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_shared_trip_forms_updated_at ON public.shared_trip_forms;
CREATE TRIGGER update_shared_trip_forms_updated_at
  BEFORE UPDATE ON public.shared_trip_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_trip_forms_updated_at();

-- Grant permissions
GRANT ALL ON public.shared_trip_forms TO authenticated;
GRANT ALL ON public.shared_trip_forms TO anon;
GRANT ALL ON public.shared_trip_forms TO service_role;
