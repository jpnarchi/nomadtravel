-- ============================================================================
-- Row Level Security (RLS) Policies Setup
-- Execute este script en Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. TRIP_NOTES - Políticas para notas de viajes
-- ============================================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE trip_notes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Users can view all trip notes" ON trip_notes;
DROP POLICY IF EXISTS "Users can create trip notes" ON trip_notes;
DROP POLICY IF EXISTS "Users can update their own trip notes" ON trip_notes;
DROP POLICY IF EXISTS "Users can delete their own trip notes" ON trip_notes;

-- Política: Todos pueden ver todas las notas
CREATE POLICY "Users can view all trip notes"
ON trip_notes FOR SELECT
USING (true);

-- Política: Todos pueden crear notas
CREATE POLICY "Users can create trip notes"
ON trip_notes FOR INSERT
WITH CHECK (true);

-- Política: Todos pueden actualizar cualquier nota
CREATE POLICY "Users can update their own trip notes"
ON trip_notes FOR UPDATE
USING (true);

-- Política: Todos pueden eliminar cualquier nota
CREATE POLICY "Users can delete their own trip notes"
ON trip_notes FOR DELETE
USING (true);


-- ============================================================================
-- 2. TRIP_DOCUMENT_FILES - Políticas para documentos de viajes
-- ============================================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE trip_document_files ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view all trip documents" ON trip_document_files;
DROP POLICY IF EXISTS "Users can create trip documents" ON trip_document_files;
DROP POLICY IF EXISTS "Users can update trip documents" ON trip_document_files;
DROP POLICY IF EXISTS "Users can delete trip documents" ON trip_document_files;

-- Política: Todos pueden ver todos los documentos
CREATE POLICY "Users can view all trip documents"
ON trip_document_files FOR SELECT
USING (true);

-- Política: Todos pueden crear documentos
CREATE POLICY "Users can create trip documents"
ON trip_document_files FOR INSERT
WITH CHECK (true);

-- Política: Todos pueden actualizar documentos
CREATE POLICY "Users can update trip documents"
ON trip_document_files FOR UPDATE
USING (true);

-- Política: Todos pueden eliminar documentos
CREATE POLICY "Users can delete trip documents"
ON trip_document_files FOR DELETE
USING (true);


-- ============================================================================
-- 3. TRIP_REMINDERS - Políticas para recordatorios de viajes
-- ============================================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE trip_reminders ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view all trip reminders" ON trip_reminders;
DROP POLICY IF EXISTS "Users can create trip reminders" ON trip_reminders;
DROP POLICY IF EXISTS "Users can update trip reminders" ON trip_reminders;
DROP POLICY IF EXISTS "Users can delete trip reminders" ON trip_reminders;

-- Política: Todos pueden ver todos los recordatorios
CREATE POLICY "Users can view all trip reminders"
ON trip_reminders FOR SELECT
USING (true);

-- Política: Todos pueden crear recordatorios
CREATE POLICY "Users can create trip reminders"
ON trip_reminders FOR INSERT
WITH CHECK (true);

-- Política: Todos pueden actualizar recordatorios
CREATE POLICY "Users can update trip reminders"
ON trip_reminders FOR UPDATE
USING (true);

-- Política: Todos pueden eliminar recordatorios
CREATE POLICY "Users can delete trip reminders"
ON trip_reminders FOR DELETE
USING (true);


-- ============================================================================
-- 4. SUPPLIER_PAYMENTS - Verificar políticas para pagos a proveedores
-- ============================================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view all supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can create supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can update supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can delete supplier payments" ON supplier_payments;

-- Política: Todos pueden ver todos los pagos
CREATE POLICY "Users can view all supplier payments"
ON supplier_payments FOR SELECT
USING (true);

-- Política: Todos pueden crear pagos
CREATE POLICY "Users can create supplier payments"
ON supplier_payments FOR INSERT
WITH CHECK (true);

-- Política: Todos pueden actualizar pagos
CREATE POLICY "Users can update supplier payments"
ON supplier_payments FOR UPDATE
USING (true);

-- Política: Todos pueden eliminar pagos
CREATE POLICY "Users can delete supplier payments"
ON supplier_payments FOR DELETE
USING (true);


-- ============================================================================
-- VERIFICACIÓN - Consulta para ver las políticas creadas
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('trip_notes', 'trip_document_files', 'trip_reminders', 'supplier_payments')
ORDER BY tablename, policyname;
