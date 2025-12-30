# 🚨 EJECUTAR ESTOS SCRIPTS SQL EN SUPABASE

## ⚠️ ERROR ACTUAL
```
Error creating reviews: new row violates row-level security policy for table "reviews"
```

**Causa**: Las tablas tienen RLS (Row-Level Security) habilitado, pero la app usa Clerk (no Supabase Auth), entonces las políticas bloquean los inserts.

---

## 📋 ORDEN DE EJECUCIÓN

### **1. FIX RLS POLICIES** ⭐ **EJECUTAR PRIMERO**
**Archivo**: `supabase-fix-rls.sql`

Este script crea políticas permisivas para todas las tablas que funcionan con Clerk authentication.

```sql
-- Copiar y pegar el contenido de supabase-fix-rls.sql
-- en el SQL Editor de Supabase
```

**Qué hace**:
- ✅ Elimina políticas restrictivas antiguas
- ✅ Crea políticas permisivas para anon/authenticated roles
- ✅ Funciona para TODAS las tablas (clients, trips, reviews, learning_materials, etc.)

---

### **2. FIX STORAGE POLICIES**
**Archivo**: `FIX-STORAGE-SIN-PERMISOS.sql`

```sql
-- Copiar y pegar el contenido de FIX-STORAGE-SIN-PERMISOS.sql
-- en el SQL Editor de Supabase
```

**Qué hace**:
- ✅ Arregla políticas de Supabase Storage
- ✅ Permite subir archivos al bucket 'documents'

---

### **3. UPDATE REVIEWS TABLE**
**Archivo**: `supabase-update-reviews-table.sql`

```sql
-- Copiar y pegar el contenido de supabase-update-reviews-table.sql
-- en el SQL Editor de Supabase
```

**Qué hace**:
- ✅ Agrega columnas faltantes: content_type, country, city, hotel_chain, etc.
- ✅ Agrega arrays: pdf_files, images, tags
- ✅ Agrega JSONB: fam_details
- ✅ Crea índices para búsqueda rápida

---

### **4. CREATE LEARNING MATERIALS TABLE**
**Archivo**: `supabase-create-learning-materials.sql`

```sql
-- Copiar y pegar el contenido de supabase-create-learning-materials.sql
-- en el SQL Editor de Supabase
```

**Qué hace**:
- ✅ Crea tabla learning_materials si no existe
- ✅ Incluye columnas para PDFs, imágenes, tags
- ✅ Crea índices

---

### **5. UPDATE SUPPLIERS TABLE**
**Archivo**: `supabase-update-suppliers-table.sql`

```sql
-- Copiar y pegar el contenido de supabase-update-suppliers-table.sql
-- en el SQL Editor de Supabase
```

**Qué hace**:
- ✅ Agrega 20+ columnas faltantes (destinations, services, contact info, etc.)
- ✅ Crea índices
- ✅ Migra datos antiguos

---

### **6. UPDATE CLIENTS TABLE**
**Archivo**: `supabase-add-client-jsonb-columns.sql`

```sql
-- Copiar y pegar el contenido de supabase-add-client-jsonb-columns.sql
-- en el SQL Editor de Supabase
```

**Qué hace**:
- ✅ Agrega columnas JSONB: companions, preferences, trip_requests
- ✅ Permite guardar datos de acompañantes

---

## 🎯 PASOS PARA EJECUTAR

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **SQL Editor** en el menú izquierdo
3. Click en **New Query**
4. **Copia y pega** el contenido de cada archivo SQL en orden
5. Click en **Run** (o presiona Cmd/Ctrl + Enter)
6. Verifica que diga "Success. No rows returned"

---

## 🔍 VERIFICAR QUE FUNCIONÓ

Después de ejecutar todos los scripts:

1. **Verifica RLS Policies**:
   - Ve a **Database** → **Tables**
   - Click en cualquier tabla (ej: reviews)
   - Ve a la pestaña **Policies**
   - Debes ver la política "Allow anon access"

2. **Verifica Storage**:
   - Ve a **Storage** → **Buckets**
   - Click en el bucket "documents"
   - Ve a **Policies**
   - Debes ver políticas que permitan INSERT/SELECT/UPDATE/DELETE para anon

3. **Prueba en la app**:
   - Intenta crear un nuevo Review
   - Intenta subir archivos
   - Intenta crear un Learning Material
   - No debes ver errores 401/403

---

## ⚡ ALTERNATIVA RÁPIDA (NO RECOMENDADA PARA PRODUCCIÓN)

Si necesitas una solución súper rápida para desarrollo:

**Archivo**: `supabase-disable-rls.sql`

```sql
-- ADVERTENCIA: Esto desactiva completamente RLS
-- Solo para desarrollo, NO para producción
```

Esto desactiva RLS completamente, pero es menos seguro. **Usa `supabase-fix-rls.sql` en su lugar**.

---

## 📊 RESUMEN

| Script | Prioridad | Qué arregla |
|--------|-----------|-------------|
| `supabase-fix-rls.sql` | 🔴 CRÍTICO | Error 401 al crear reviews/learning materials |
| `FIX-STORAGE-SIN-PERMISOS.sql` | 🔴 CRÍTICO | Error al subir archivos |
| `supabase-update-reviews-table.sql` | 🟡 IMPORTANTE | Columnas faltantes en reviews |
| `supabase-create-learning-materials.sql` | 🟡 IMPORTANTE | Tabla learning_materials no existe |
| `supabase-update-suppliers-table.sql` | 🟡 IMPORTANTE | Columnas faltantes en suppliers |
| `supabase-add-client-jsonb-columns.sql` | 🟡 IMPORTANTE | Guardar companions en clients |

---

## ❓ SI HAY ERRORES

**Error: "relation does not exist"**
- Significa que la tabla no existe todavía
- Verifica que el schema esté creado correctamente
- Ejecuta primero los scripts CREATE TABLE

**Error: "policy already exists"**
- No es problema, el script usa `IF EXISTS`
- Continúa con el siguiente script

**Error: "permission denied"**
- Verifica que estés usando una cuenta con permisos de admin en Supabase
- Debes ser el owner del proyecto

---

## ✅ DESPUÉS DE EJECUTAR TODO

Tu app debería poder:
- ✅ Crear y editar Reviews sin errores
- ✅ Crear y editar Learning Materials
- ✅ Subir PDFs e imágenes
- ✅ Guardar datos de Suppliers con todos los campos
- ✅ Guardar companions en Clients
- ✅ Sin errores 401 Unauthorized
- ✅ Sin errores de RLS policy violations
