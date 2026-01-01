-- =================================================================
-- CREAR TABLAS RELACIONADAS CON SUPPLIERS
-- =================================================================
-- Este script crea las tablas supplier_contacts y supplier_documents
-- que se usan en SupplierDetail.jsx
-- =================================================================

-- ============================================
-- SUPPLIER_CONTACTS: Contactos de proveedores
-- ============================================
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  timezone TEXT,
  priority INTEGER, -- 1 = emergencia, 2+ = normal
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- ============================================
-- SUPPLIER_DOCUMENTS: Documentos de proveedores
-- ============================================
CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- tarifario, politicas, comisiones, presentacion, otro
  file_url TEXT,
  file_path TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id ON public.supplier_contacts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier_id ON public.supplier_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_priority ON public.supplier_contacts(priority);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir acceso a usuarios autenticados
CREATE POLICY "Allow all for authenticated users" ON public.supplier_contacts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.supplier_documents
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- FINISHED
-- ============================================
