-- ============================================
-- Setup Storage Buckets for Payments
-- ============================================

-- Create bucket for supplier payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-payments', 'supplier-payments', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for client payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-payments', 'client-payments', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for supplier-payments bucket
CREATE POLICY "Allow authenticated users to upload supplier payment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'supplier-payments');

CREATE POLICY "Allow public to read supplier payment files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'supplier-payments');

CREATE POLICY "Allow authenticated users to delete supplier payment files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'supplier-payments');

-- Policies for client-payments bucket
CREATE POLICY "Allow authenticated users to upload client payment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-payments');

CREATE POLICY "Allow public to read client payment files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-payments');

CREATE POLICY "Allow authenticated users to delete client payment files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-payments');
