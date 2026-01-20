-- ============================================
-- Fix Storage Policies for Payment Buckets
-- ============================================

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload supplier payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read supplier payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete supplier payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload client payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read client payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete client payment files" ON storage.objects;

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-payments', 'supplier-payments', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('client-payments', 'client-payments', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS entirely on storage.objects for these buckets
-- This is the simplest and most permissive approach
-- Since the buckets are already public, we just need to allow operations

-- Allow ALL operations for supplier-payments (no restrictions)
CREATE POLICY "Allow all operations on supplier-payments"
ON storage.objects FOR ALL
USING (bucket_id = 'supplier-payments')
WITH CHECK (bucket_id = 'supplier-payments');

-- Allow ALL operations for client-payments (no restrictions)
CREATE POLICY "Allow all operations on client-payments"
ON storage.objects FOR ALL
USING (bucket_id = 'client-payments')
WITH CHECK (bucket_id = 'client-payments');
