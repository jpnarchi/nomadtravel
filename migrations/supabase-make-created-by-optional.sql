-- Make created_by nullable in all tables (for development)
-- Execute this in Supabase SQL Editor
-- This allows creating records without requiring created_by

ALTER TABLE clients ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE trips ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE sold_trips ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE tasks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE suppliers ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE credentials ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE client_payments ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE supplier_payments ALTER COLUMN created_by DROP NOT NULL;
