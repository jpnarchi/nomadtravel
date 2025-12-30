# Guía de Configuración de Storage en Supabase

## 📁 Configuración del Almacenamiento de Archivos

Esta guía te ayudará a configurar correctamente el almacenamiento de archivos en Supabase para que la funcionalidad de subida de documentos funcione correctamente.

---

## 🔧 Pasos de Configuración

### 1. Ejecutar el Script SQL

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo `supabase-setup-storage.sql`
5. Haz clic en **Run** para ejecutar el script

Este script creará:
- ✅ Tabla `travel_documents` para almacenar la información de los documentos
- ✅ Bucket de storage llamado `documents`
- ✅ Políticas de seguridad para el acceso a los archivos

### 2. Verificar el Bucket de Storage

1. Ve a **Storage** en el menú lateral de Supabase
2. Deberías ver un bucket llamado `documents`
3. Si no existe, créalo manualmente:
   - Haz clic en **New bucket**
   - Nombre: `documents`
   - **Public bucket**: Activa esta opción ✅
   - Haz clic en **Create bucket**

### 3. Configurar Políticas de Seguridad (si es necesario)

Si el bucket ya existía o tuviste problemas con las políticas, configúralas manualmente:

1. Ve a **Storage** > Haz clic en el bucket `documents` > **Policies**
2. Asegúrate de tener las siguientes políticas:

#### Para usuarios autenticados:
```sql
-- Política de lectura
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Política de inserción
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Política de actualización
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Política de eliminación
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

#### Para acceso público (opcional):
```sql
-- Permite que cualquier persona pueda ver los archivos
CREATE POLICY "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

---

## ✅ Verificación

Para verificar que todo funciona correctamente:

1. Inicia tu aplicación
2. Ve a un cliente
3. Intenta subir un documento (pasaporte o visa)
4. Si el archivo se sube correctamente, verás:
   - El nombre del archivo en el formulario
   - Un link "Ver archivo actual" que funciona
5. Ve a **Storage** > `documents` en Supabase y verás el archivo en la carpeta `travel-documents/`

---

## 🐛 Solución de Problemas

### Error: "new row violates row-level security policy" ⚠️ COMÚN
Este es el error más común cuando usas Clerk para autenticación.

**Causa:** Las políticas de RLS de Supabase Storage requieren usuarios autenticados con Supabase Auth, pero tu app usa Clerk.

**Solución (Recomendada):**
1. Ve a **SQL Editor** en Supabase
2. Ejecuta el archivo `supabase-fix-storage-policies.sql`
3. Esto creará políticas permisivas que funcionan sin autenticación de Supabase

**Solución Alternativa (si la anterior no funciona):**
1. Ejecuta el archivo `supabase-disable-storage-rls.sql`
2. Esto deshabilitará completamente RLS en storage (solo para desarrollo)

### Error: "Bucket not found"
**Solución:** Crea el bucket manualmente siguiendo el paso 2.

### Error: "Permission denied"
**Solución:** Verifica que las políticas de seguridad estén configuradas correctamente (paso 3).

### Error: "File upload failed"
**Solución:**
- Verifica que las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas en tu archivo `.env`
- Ejecuta `supabase-fix-storage-policies.sql` para corregir las políticas

### Los archivos se suben pero no se pueden ver
**Solución:**
- Verifica que el bucket sea público (paso 2)
- Verifica las políticas de lectura pública (paso 3)

---

## 📝 Tipos de Archivos Permitidos

El formulario acepta los siguientes tipos de archivos:
- PDF (`.pdf`)
- Imágenes JPG (`.jpg`, `.jpeg`)
- Imágenes PNG (`.png`)

---

## 🔐 Seguridad

- Los archivos se almacenan en un bucket público, lo que significa que cualquier persona con el URL puede acceder a ellos
- Si necesitas más seguridad, considera:
  1. Hacer el bucket privado
  2. Generar URLs firmadas con tiempo de expiración
  3. Implementar políticas de RLS más estrictas

---

## 📦 Estructura de Archivos

Los archivos se organizan de la siguiente manera:

```
documents/
└── travel-documents/
    ├── 1640995200000-abc123.pdf
    ├── 1640995201000-xyz789.jpg
    └── ...
```

Cada archivo tiene un nombre único generado con timestamp + ID aleatorio para evitar colisiones.

---

## ✨ Mejoras Futuras

Considera implementar:
- Validación de tamaño máximo de archivo
- Optimización de imágenes antes de subir
- Vista previa de archivos PDF e imágenes
- Eliminación automática de archivos cuando se elimina un documento
- Versionado de documentos
