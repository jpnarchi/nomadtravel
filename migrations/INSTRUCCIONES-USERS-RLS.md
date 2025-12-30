# Instrucciones para corregir el error de usuarios

## Problema
Error: "infinite recursion detected in policy for relation users"

Este error ocurre porque hay una política RLS (Row Level Security) en la tabla `users` que hace referencia a sí misma, causando una recursión infinita.

## Solución

### Paso 1: Acceder a Supabase SQL Editor
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a la sección **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el script SQL
1. Abre el archivo `supabase-users-disable-rls.sql` que está en esta carpeta
2. Copia todo el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz click en **Run** o presiona `Ctrl/Cmd + Enter`

### Paso 3: Verificar
Después de ejecutar el script, recarga tu aplicación y el error debería desaparecer.

## ¿Qué hace este script?

El script:
1. Elimina todas las políticas RLS existentes en la tabla `users`
2. Deshabilita completamente RLS en la tabla `users`

Esto es seguro porque:
- Los usuarios están autenticados por Clerk
- La autenticación se maneja a nivel de aplicación, no de base de datos
- La tabla `users` solo necesita ser leída, no modificada directamente por los usuarios finales

## Alternativa (si necesitas RLS)

Si necesitas mantener RLS activo, asegúrate de que las políticas NO hagan referencia a la tabla `users` dentro de las condiciones. Por ejemplo:

**❌ MAL** (causa recursión):
```sql
CREATE POLICY "Users can view their own data" ON users
FOR SELECT USING (
  email = (SELECT email FROM users WHERE auth.uid() = id)  -- ❌ Referencia circular
);
```

**✅ BIEN**:
```sql
CREATE POLICY "Users can view their own data" ON users
FOR SELECT USING (
  email = auth.email()  -- ✅ No hace referencia a la tabla users
);
```
