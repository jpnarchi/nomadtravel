-- Add JSONB columns to clients table for companions, preferences, and trip_requests
-- Execute this in Supabase SQL Editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS companions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS trip_requests JSONB DEFAULT '[]'::jsonb;

-- Add comments to document the structure
COMMENT ON COLUMN clients.companions IS 'Array of companion objects with fields: first_name, last_name, birth_date, relationship, passport_number, passport_expiry, notes';
COMMENT ON COLUMN clients.preferences IS 'Client preferences object with custom fields';
COMMENT ON COLUMN clients.trip_requests IS 'Array of trip request history objects';
