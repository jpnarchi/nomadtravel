# Cómo crear la tabla de Contraseñas Personales en Supabase

## ¿Qué es esta tabla?

La tabla `personal_credentials` permite a cada usuario guardar sus **contraseñas personales** de forma privada. A diferencia de `credentials` (que es para contraseñas del trabajo compartidas con el equipo), estas son **completamente privadas** para cada usuario.

## Pasos para ejecutar el script SQL

### 1. Accede a tu proyecto de Supabase
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

### 2. Abre el SQL Editor
   - En el menú lateral, haz clic en **SQL Editor**
   - Haz clic en **New Query** para crear una nueva consulta

### 3. Ejecuta el script
   - Abre el archivo `supabase-create-personal-credentials-table.sql`
   - Copia todo el contenido del archivo
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **Run** (o presiona Ctrl/Cmd + Enter)

### 4. Verifica que se creó correctamente
   - Ve a **Table Editor** en el menú lateral
   - Deberías ver la tabla `personal_credentials` en la lista
   - La tabla debe tener las siguientes columnas:
     - `id` (UUID)
     - `name` (TEXT)
     - `category` (TEXT)
     - `website` (TEXT)
     - `username` (TEXT)
     - `password` (TEXT)
     - `notes` (TEXT)
     - `security_question` (TEXT)
     - `security_answer` (TEXT)
     - `created_by` (TEXT) - Email del usuario
     - `is_deleted` (BOOLEAN)
     - `created_date` (TIMESTAMPTZ)
     - `updated_date` (TIMESTAMPTZ)
     - `metadata` (JSONB)

## 5. ¡Listo!
Ya puedes usar la página de Contraseñas Personales en tu aplicación.

## Categorías disponibles

La tabla soporta estas categorías:

- 🏦 **Banco** - Cuentas bancarias
- 💳 **Tarjeta de Crédito** - Tarjetas de crédito/débito
- 📱 **Red Social** - Facebook, Instagram, Twitter, etc.
- 📧 **Email** - Cuentas de correo
- 🎬 **Streaming** - Netflix, Spotify, HBO, etc.
- 🛒 **Compras Online** - Amazon, MercadoLibre, etc.
- 💼 **Trabajo** - Portales de trabajo, LinkedIn, etc.
- 🏥 **Salud** - Seguros médicos, portales de salud
- 🏛️ **Gobierno** - SAT, IMSS, trámites gubernamentales
- 🎓 **Educación** - Plataformas educativas, universidades
- 📂 **Otro** - Cualquier otra categoría

## Diferencias con `credentials`

| Característica | `credentials` | `personal_credentials` |
|---------------|--------------|----------------------|
| **Propósito** | Contraseñas del trabajo | Contraseñas personales |
| **Visibilidad** | Todo el equipo | Solo el usuario |
| **Ejemplos** | Virtuoso, TBO, Marriott | Netflix, Gmail, Banco |
| **Categorías** | Portales de agente, Aerolíneas, DMCs | Bancos, Redes sociales, Streaming |

## Privacidad

🔒 **PRIVACIDAD GARANTIZADA**:
- Solo tú puedes ver tus contraseñas personales
- Se filtran por `created_by` (tu email)
- Nadie más del equipo tiene acceso
- Ideal para guardar cosas como:
  - Cuentas bancarias personales
  - Tarjetas de crédito
  - Redes sociales personales
  - Streaming (Netflix, Spotify)
  - Email personal

## Seguridad

⚠️ **IMPORTANTE**: Las contraseñas se guardan en texto plano por ahora. Para mayor seguridad en producción, considera implementar encriptación.

## Solución de problemas

Si obtienes un error al ejecutar el script:

1. **Error: "function update_updated_date() does not exist"**
   - Primero ejecuta el script principal `SUPABASE_SCHEMA.sql` que crea esta función
   - Luego ejecuta `supabase-create-personal-credentials-table.sql`

2. **Error de permisos RLS** ("new row violates row-level security policy")
   - El script ya deshabilita RLS por defecto
   - Si aún tienes problemas, ejecuta: `ALTER TABLE personal_credentials DISABLE ROW LEVEL SECURITY;`

3. **La tabla ya existe**
   - El script ya incluye `DROP TABLE IF EXISTS` para recrearla
   - Si prefieres no perder datos, comenta esa línea antes de ejecutar
