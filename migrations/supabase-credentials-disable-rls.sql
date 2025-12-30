-- =================================================================
-- DISABLE RLS PARA TABLA CREDENTIALS
-- =================================================================
-- Deshabilita Row Level Security para la tabla credentials
-- Ya que la app usa Clerk para autenticación, no Supabase Auth
-- =================================================================

-- Deshabilitar RLS en la tabla credentials
ALTER TABLE credentials DISABLE ROW LEVEL SECURITY;

-- Eliminar las políticas existentes (si las hay)
DROP POLICY IF EXISTS "Authenticated users can view credentials" ON credentials;
DROP POLICY IF EXISTS "Authenticated users can insert credentials" ON credentials;
DROP POLICY IF EXISTS "Authenticated users can update credentials" ON credentials;
DROP POLICY IF EXISTS "Authenticated users can delete credentials" ON credentials;

-- =================================================================
-- LISTO
-- =================================================================
-- Ahora puedes insertar, actualizar y eliminar credenciales sin problemas
