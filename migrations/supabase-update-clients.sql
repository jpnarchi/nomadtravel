-- Update clients table to match the app's fields
-- Execute this in Supabase SQL Editor

-- Add missing columns to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Make the old 'name' column nullable (since we now use first_name/last_name)
ALTER TABLE clients
  ALTER COLUMN name DROP NOT NULL;
