-- ============================================
-- Migration: Add missing fields to payment tables
-- ============================================
-- Execute this in Supabase SQL Editor to add missing columns to client_payments and supplier_payments tables

-- ============================================
-- CLIENT_PAYMENTS: Add missing fields
-- ============================================

-- Add currency field (USD, MXN, etc.)
ALTER TABLE public.client_payments
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add amount_original (monto en moneda original antes de conversión)
ALTER TABLE public.client_payments
ADD COLUMN IF NOT EXISTS amount_original DECIMAL(10,2);

-- Add fx_rate (tipo de cambio usado para la conversión)
ALTER TABLE public.client_payments
ADD COLUMN IF NOT EXISTS fx_rate DECIMAL(10,4);

-- Add amount_usd_fixed (monto convertido a USD con el tipo de cambio fijo del día del pago)
ALTER TABLE public.client_payments
ADD COLUMN IF NOT EXISTS amount_usd_fixed DECIMAL(10,2);

-- Add bank field (BBVA MXN, BBVA USD, BASE, WISE, etc.)
ALTER TABLE public.client_payments
ADD COLUMN IF NOT EXISTS bank TEXT;

-- Add status field (pending, confirmed, reportado, etc.)
ALTER TABLE public.client_payments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';

-- Add receipt_url field if it doesn't exist
ALTER TABLE public.client_payments
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add created_by field if it doesn't exist
ALTER TABLE public.client_payments
ADD COLUMN IF NOT EXISTS created_by TEXT;


-- ============================================
-- SUPPLIER_PAYMENTS: Add missing fields
-- ============================================

-- Add receipt_url field if it doesn't exist
ALTER TABLE public.supplier_payments
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add created_by field if it doesn't exist
ALTER TABLE public.supplier_payments
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Add currency field if it doesn't exist (most supplier payments are in USD)
ALTER TABLE public.supplier_payments
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';


-- ============================================
-- Update existing records
-- ============================================

-- For client_payments: If amount_original is NULL, copy from amount
UPDATE public.client_payments
SET amount_original = amount
WHERE amount_original IS NULL;

-- For client_payments: If amount_usd_fixed is NULL, copy from amount
UPDATE public.client_payments
SET amount_usd_fixed = amount
WHERE amount_usd_fixed IS NULL;


-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON COLUMN public.client_payments.currency IS 'Currency of the payment (USD, MXN, etc.)';
COMMENT ON COLUMN public.client_payments.amount_original IS 'Amount in original currency before conversion';
COMMENT ON COLUMN public.client_payments.fx_rate IS 'Exchange rate used for conversion (if applicable)';
COMMENT ON COLUMN public.client_payments.amount_usd_fixed IS 'Amount converted to USD using the exchange rate from payment date';
COMMENT ON COLUMN public.client_payments.bank IS 'Bank account where payment was received (BBVA MXN, BBVA USD, BASE, WISE)';
COMMENT ON COLUMN public.client_payments.status IS 'Payment status (pending, confirmed, reportado)';

-- ============================================
-- FINISHED
-- ============================================
