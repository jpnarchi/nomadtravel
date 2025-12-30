-- Nomad Travel CRM - Database Schema for Supabase
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/pgcvzbihzftpcxxckuvq/editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Trips table (cotizaciones/propuestas)
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    client_name TEXT,
    destination TEXT,
    start_date DATE,
    end_date DATE,
    num_passengers INTEGER,
    budget DECIMAL(10, 2),
    status TEXT DEFAULT 'lead',
    notes TEXT,
    created_by TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Sold Trips table (viajes vendidos)
CREATE TABLE IF NOT EXISTS sold_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id),
    client_id UUID REFERENCES clients(id),
    client_name TEXT,
    destination TEXT,
    start_date DATE,
    end_date DATE,
    num_passengers INTEGER,
    total_price DECIMAL(10, 2),
    total_commission DECIMAL(10, 2),
    total_paid_by_client DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    created_by TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Trip Services table (servicios del viaje)
CREATE TABLE IF NOT EXISTS trip_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sold_trip_id UUID REFERENCES sold_trips(id) ON DELETE CASCADE,
    service_type TEXT,
    supplier TEXT,
    description TEXT,
    cost DECIMAL(10, 2),
    price DECIMAL(10, 2),
    commission DECIMAL(10, 2),
    paid_to_agent BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Client Payments table
CREATE TABLE IF NOT EXISTS client_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sold_trip_id UUID REFERENCES sold_trips(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    method TEXT,
    confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sold_trip_id UUID REFERENCES sold_trips(id) ON DELETE CASCADE,
    trip_service_id UUID REFERENCES trip_services(id) ON DELETE SET NULL,
    supplier TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    method TEXT,
    payment_type TEXT,
    confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    priority TEXT,
    created_by TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Credentials table
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    username TEXT,
    password TEXT,
    url TEXT,
    notes TEXT,
    is_personal BOOLEAN DEFAULT FALSE,
    created_by TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_sold_trips_created_by ON sold_trips(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_trip_services_sold_trip ON trip_services(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_sold_trip ON client_payments(sold_trip_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_sold_trip ON supplier_payments(sold_trip_id);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE sold_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for authenticated users for now)
-- You can customize these policies based on your security requirements

CREATE POLICY "Allow all for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON trips
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON sold_trips
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON trip_services
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON client_payments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON supplier_payments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON tasks
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON suppliers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON credentials
    FOR ALL USING (auth.role() = 'authenticated');
