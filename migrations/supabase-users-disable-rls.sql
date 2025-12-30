-- Deshabilitar RLS en la tabla users para evitar recursión infinita
-- La tabla users debe ser accesible sin políticas RLS complejas

-- Eliminar todas las políticas existentes en users
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Deshabilitar RLS completamente en la tabla users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Nota: Si necesitas seguridad en la tabla users,
-- asegúrate de usar políticas que NO hagan referencia a la misma tabla users
-- para evitar recursión infinita.
