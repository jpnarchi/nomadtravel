-- ============================================
-- MIGRACIÓN: Tabla shared_trip_forms
-- Para ejecutar en Supabase Dashboard
-- ============================================
--
-- Instrucciones:
-- 1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/sql
-- 2. Copia y pega este SQL completo
-- 3. Haz clic en "Run"
--
-- ============================================

-- Create shared_trip_forms table for storing shareable trip form links
CREATE TABLE IF NOT EXISTS shared_trip_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL,
  agent_email TEXT NOT NULL,
  agent_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_trip_forms_share_token ON shared_trip_forms(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_trip_forms_agent_id ON shared_trip_forms(agent_id);

-- Enable RLS
ALTER TABLE shared_trip_forms ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can only see their own shared forms
CREATE POLICY "Users can view their own shared forms"
  ON shared_trip_forms
  FOR SELECT
  USING (agent_id = auth.uid()::text OR agent_email = auth.jwt() ->> 'email');

-- Policy: Agents can create shared forms
CREATE POLICY "Users can create shared forms"
  ON shared_trip_forms
  FOR INSERT
  WITH CHECK (agent_id = auth.uid()::text OR agent_email = auth.jwt() ->> 'email');

-- Policy: Agents can update their own shared forms
CREATE POLICY "Users can update their own shared forms"
  ON shared_trip_forms
  FOR UPDATE
  USING (agent_id = auth.uid()::text OR agent_email = auth.jwt() ->> 'email');

-- Policy: Allow anonymous users to read active shared forms (for public form access)
CREATE POLICY "Public can view active shared forms by token"
  ON shared_trip_forms
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_shared_trip_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_trip_forms_updated_at
  BEFORE UPDATE ON shared_trip_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_trip_forms_updated_at();

-- ============================================
-- ¡Migración completada!
-- ============================================
