-- =================================================================
-- OPCIÓN ALTERNATIVA: Deshabilitar RLS completamente en storage
-- =================================================================
-- Si las políticas no funcionan, puedes deshabilitar RLS
-- completamente para el bucket de storage
-- =================================================================

-- Verificar el estado actual de RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Deshabilitar RLS en la tabla storage.objects
-- ADVERTENCIA: Esto permite acceso sin restricciones al storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- =================================================================
-- NOTA: Solo usa esta opción si las políticas permisivas no funcionan
-- En producción, es mejor usar políticas apropiadas
-- =================================================================
