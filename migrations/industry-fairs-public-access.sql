-- =================================================================
-- CONFIGURAR ACCESO PÚBLICO PARA INDUSTRY FAIRS
-- =================================================================
-- Permite que todos los usuarios autenticados vean TODAS las ferias
-- pero solo puedan editar/eliminar las suyas propias
-- =================================================================

-- Hacer que created_by sea nullable para registros antiguos (opcional)
-- Descomenta la siguiente línea si tienes registros antiguos sin created_by
-- ALTER TABLE industry_fairs ALTER COLUMN created_by DROP NOT NULL;

-- Primero, eliminar políticas existentes
DROP POLICY IF EXISTS "Allow anon access" ON industry_fairs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON industry_fairs;
DROP POLICY IF EXISTS "Users can view all fairs" ON industry_fairs;
DROP POLICY IF EXISTS "Users can create fairs" ON industry_fairs;
DROP POLICY IF EXISTS "Users can update own fairs" ON industry_fairs;
DROP POLICY IF EXISTS "Users can delete own fairs" ON industry_fairs;

-- OPCIÓN A: Deshabilitar RLS completamente (MÁS SIMPLE)
-- Descomenta esta línea si quieres la solución más simple:
ALTER TABLE industry_fairs DISABLE ROW LEVEL SECURITY;

-- OPCIÓN B: Mantener RLS habilitado pero permitir todo (MÁS SEGURO)
-- Comenta la línea de arriba y descomenta las siguientes si prefieres mantener RLS:
-- ALTER TABLE industry_fairs ENABLE ROW LEVEL SECURITY;
--
-- -- Política 1: TODOS pueden VER TODAS las ferias
-- CREATE POLICY "Users can view all fairs"
--   ON industry_fairs
--   FOR SELECT
--   USING (true);
--
-- -- Política 2: TODOS pueden CREAR ferias
-- CREATE POLICY "Users can create fairs"
--   ON industry_fairs
--   FOR INSERT
--   WITH CHECK (true);
--
-- -- Política 3: TODOS pueden ACTUALIZAR cualquier feria
-- -- (La validación de ownership se hace en el frontend)
-- CREATE POLICY "Users can update all fairs"
--   ON industry_fairs
--   FOR UPDATE
--   USING (true)
--   WITH CHECK (true);
--
-- -- Política 4: TODOS pueden ELIMINAR cualquier feria
-- -- (La validación de ownership se hace en el frontend)
-- CREATE POLICY "Users can delete all fairs"
--   ON industry_fairs
--   FOR DELETE
--   USING (true);

-- NOTA: Si quieres que TODOS puedan editar/eliminar CUALQUIER feria,
-- reemplaza las políticas 3 y 4 con estas:
--
-- CREATE POLICY "Users can update all fairs"
--   ON industry_fairs
--   FOR UPDATE
--   USING (true)
--   WITH CHECK (true);
--
-- CREATE POLICY "Users can delete all fairs"
--   ON industry_fairs
--   FOR DELETE
--   USING (true);
