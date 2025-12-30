# Cómo crear la tabla de Credenciales en Supabase

## Pasos para ejecutar el script SQL

### 1. Accede a tu proyecto de Supabase
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

### 2. Abre el SQL Editor
   - En el menú lateral, haz clic en **SQL Editor**
   - Haz clic en **New Query** para crear una nueva consulta

### 3. Ejecuta el script
   - Abre el archivo `supabase-create-credentials-table.sql`
   - Copia todo el contenido del archivo
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **Run** (o presiona Ctrl/Cmd + Enter)

### 4. Verifica que se creó correctamente
   - Ve a **Table Editor** en el menú lateral
   - Deberías ver la tabla `credentials` en la lista
   - La tabla debe tener las siguientes columnas:
     - `id` (UUID)
     - `name` (TEXT)
     - `category` (TEXT)
     - `website` (TEXT)
     - `username` (TEXT)
     - `password` (TEXT)
     - `agent_id` (TEXT)
     - `notes` (TEXT)
     - `is_deleted` (BOOLEAN)
     - `created_date` (TIMESTAMPTZ)
     - `updated_date` (TIMESTAMPTZ)
     - `metadata` (JSONB)

## 5. ¡Listo!
Ya puedes usar el formulario de Credenciales en tu aplicación para guardar contraseñas de portales y servicios.

## Campos del formulario

- **Nombre del sitio/servicio**: Nombre del portal o plataforma (ej: Virtuoso, TBO, Marriott Bonvoy)
- **Categoría**: Tipo de servicio
  - Portal de Agente
  - Aerolínea
  - Hotel / Cadena
  - Plataforma (TBO, RateHawk, etc.)
  - DMC
  - Consolidador
  - Otro
- **URL del sitio**: Dirección web del portal
- **Usuario / Email**: Usuario o correo para acceder
- **Contraseña**: Contraseña del portal
- **ID de Agente / Número de cuenta**: ID de agente o número de cuenta
- **Notas**: Información adicional

## Seguridad

⚠️ **IMPORTANTE**: Las contraseñas se guardan en texto plano por ahora. Para mayor seguridad en producción, considera implementar encriptación.

## Solución de problemas

Si obtienes un error al ejecutar el script:

1. **Error: "function update_updated_date() does not exist"**
   - Primero ejecuta el script principal `SUPABASE_SCHEMA.sql` que crea esta función
   - Luego ejecuta `supabase-create-credentials-table.sql`

2. **Error de permisos RLS** ("new row violates row-level security policy")
   - Ejecuta el script `supabase-credentials-disable-rls.sql`
   - Esto deshabilita RLS ya que la app usa Clerk en lugar de Supabase Auth

3. **La tabla ya existe**
   - El script ya incluye `DROP TABLE IF EXISTS` para recrearla
   - Si prefieres no perder datos, comenta esa línea antes de ejecutar
