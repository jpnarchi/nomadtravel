-- Migration: Add Group Trips Feature (FIXED VERSION)
-- Date: 2026-01-17
-- Description: Adds support for group trips with individual member tracking and split payments
-- NOTE: This version uses TEXT for IDs to match your current schema

-- 1. Add group trip fields to sold_trips table
ALTER TABLE sold_trips
ADD COLUMN IF NOT EXISTS is_group_trip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS group_split_method TEXT DEFAULT 'equal',
ADD COLUMN IF NOT EXISTS travelers TEXT;

-- 2. Create group_members table with TEXT IDs
CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    sold_trip_id TEXT REFERENCES sold_trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'adulto', -- 'adulto' or 'niño'
    email TEXT,
    phone TEXT,
    is_organizer BOOLEAN DEFAULT FALSE,
    is_payment_responsible BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'activo', -- 'activo' or 'cancelado'
    percentage DECIMAL(5, 2), -- For percentage split method (e.g., 33.33)
    fixed_amount DECIMAL(10, 2), -- For fixed amount split method
    notes TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add group_member_id to client_payments for tracking individual payments
ALTER TABLE client_payments
ADD COLUMN IF NOT EXISTS group_member_id TEXT REFERENCES group_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS paid_for_member_id TEXT REFERENCES group_members(id) ON DELETE SET NULL;

-- 4. Add group_member_id to supplier_payments for tracking payments per member
ALTER TABLE supplier_payments
ADD COLUMN IF NOT EXISTS group_member_id TEXT REFERENCES group_members(id) ON DELETE SET NULL;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_sold_trip ON group_members(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);
CREATE INDEX IF NOT EXISTS idx_client_payments_group_member ON client_payments(group_member_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_paid_for_member ON client_payments(paid_for_member_id);

-- 6. Enable Row Level Security on group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policy for group_members
CREATE POLICY "Allow all for authenticated users" ON group_members
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. Add comments for documentation
COMMENT ON TABLE group_members IS 'Stores individual members of group trips';
COMMENT ON COLUMN sold_trips.is_group_trip IS 'Indicates if this is a group trip with multiple members';
COMMENT ON COLUMN sold_trips.group_split_method IS 'Method for splitting costs: equal, percentage, or fixed';
COMMENT ON COLUMN group_members.is_organizer IS 'Indicates if this member is the group organizer';
COMMENT ON COLUMN group_members.is_payment_responsible IS 'Indicates if member pays their own share or organizer pays for them';
COMMENT ON COLUMN client_payments.group_member_id IS 'Links payment to specific group member who made it';
COMMENT ON COLUMN client_payments.paid_for_member_id IS 'Links payment to the member it was paid for (may differ from who paid)';
