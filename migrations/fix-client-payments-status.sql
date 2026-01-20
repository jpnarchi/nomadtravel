-- ============================================
-- Fix client_payments status field
-- ============================================
-- This migration adds default status to existing payments

-- Update all payments that don't have a status
-- Set status based on the 'confirmed' field for backward compatibility
UPDATE public.client_payments
SET status = CASE
  WHEN confirmed = true THEN 'confirmado'
  ELSE 'reportado'
END
WHERE status IS NULL;

-- Make sure the status column exists (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'client_payments'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.client_payments
    ADD COLUMN status TEXT DEFAULT 'reportado';
  END IF;
END $$;

-- Update any payments with method 'tarjeta_cliente' to have notes if they don't have any
UPDATE public.client_payments
SET notes = COALESCE(notes, 'Pago automático generado por tarjeta de cliente')
WHERE method = 'tarjeta_cliente' AND (notes IS NULL OR notes = '');
