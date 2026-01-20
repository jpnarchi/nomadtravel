# Instrucciones de Configuración de Supabase

## Problema Actual
Los errores que estás viendo se deben a que las tablas en Supabase tienen habilitado **Row Level Security (RLS)** pero no tienen políticas configuradas. Esto bloquea todas las operaciones de inserción, actualización y eliminación.

## Solución: Configurar RLS y Storage

### Paso 1: Configurar las Políticas de RLS

1. **Abre tu proyecto en Supabase Dashboard**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

2. **Ejecuta el script de políticas RLS**
   - En el menú lateral, ve a **SQL Editor**
   - Haz clic en **New query**
   - Abre el archivo `setup-rls-policies.sql` que he creado
   - Copia TODO el contenido del archivo
   - Pégalo en el editor SQL
   - Haz clic en **Run** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

3. **Verifica que se crearon correctamente**
   - Al final del script hay una consulta de verificación
   - Deberías ver las políticas creadas para las tablas:
     - `trip_notes`
     - `trip_document_files`
     - `trip_reminders`
     - `supplier_payments`

### Paso 2: Configurar el Storage Bucket

**⚠️ IMPORTANTE: Debes crear el bucket ANTES de ejecutar el script SQL**

1. **Crear el bucket manualmente PRIMERO**
   - En el menú lateral de Supabase, ve a **Storage**
   - Haz clic en **New bucket**
   - Nombre: `trip-documents`
   - **Marca como Public bucket** ✓ (para que los documentos sean accesibles)
   - Haz clic en **Create bucket**

2. **DESPUÉS configura las políticas del bucket**
   - Ve a **SQL Editor** nuevamente
   - Haz clic en **New query**
   - Abre el archivo `setup-storage-bucket.sql`
   - Copia TODO el contenido
   - Pégalo en el editor
   - Haz clic en **Run**

   **Nota:** Si ves un error sobre "column definition does not exist", ignóralo. Es solo en la consulta de verificación al final, las políticas sí se crean correctamente.

### Paso 3: Verificar la Configuración

1. **Verifica que el bucket existe**
   - Ve a **Storage** en el menú lateral
   - Deberías ver el bucket `trip-documents`
   - Debe estar marcado como **Public**

2. **Prueba la aplicación**
   - Recarga tu aplicación web
   - Intenta crear una nota en un viaje
   - Intenta subir un documento
   - No deberías ver más errores de RLS

## Archivos Creados

1. **`setup-rls-policies.sql`** - Script para crear las políticas de RLS
2. **`setup-storage-bucket.sql`** - Script para configurar el bucket de storage
3. **`INSTRUCCIONES-SUPABASE.md`** - Este archivo con las instrucciones

## Cambios en el Código

He actualizado los siguientes componentes:

1. **`TripNotesList.jsx`**
   - ✅ Eliminé el campo `is_urgent` que no existe en la tabla
   - ✅ Agregué el campo `created_by` a las notas

2. **`TripDocumentsList.jsx`**
   - ✅ Cambié de `base44.integrations.Core.UploadFile` a `supabaseAPI.storage.uploadFile`
   - ✅ Agregué el campo `created_by` a los documentos

3. **`useTripMutations.js`**
   - ✅ Agregué `created_by` a las mutaciones de notas, documentos y recordatorios

4. **`SupplierPaymentForm.jsx`**
   - ✅ Corregí el problema con `trip_service_id` vacío (ahora se convierte a `null`)

## Solución de Problemas

### Error: "new row violates row-level security policy"
- **Causa**: Las políticas RLS no están configuradas
- **Solución**: Ejecuta el script `setup-rls-policies.sql`

### Error: "bucket 'trip-documents' does not exist"
- **Causa**: El bucket no ha sido creado
- **Solución**: Sigue el Paso 2 para crear el bucket

### Los documentos no se suben
- **Causa**: Las políticas del bucket no están configuradas
- **Solución**: Ejecuta el script `setup-storage-bucket.sql`

### Error: "Could not find the 'is_urgent' column"
- **Causa**: La tabla `trip_notes` no tiene esa columna
- **Solución**: Ya corregido en el código, recarga la aplicación

## Próximos Pasos

Una vez completados estos pasos, deberías poder:
- ✅ Crear y editar notas en los viajes
- ✅ Subir documentos (vouchers, reservas, etc.)
- ✅ Gestionar recordatorios automáticos para clientes
- ✅ Registrar pagos a proveedores sin errores

Si sigues teniendo problemas después de ejecutar estos scripts, revisa:
1. Que las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctas
2. Que el usuario que estás usando tenga permisos en Supabase
3. Los logs en la consola del navegador para más detalles del error
