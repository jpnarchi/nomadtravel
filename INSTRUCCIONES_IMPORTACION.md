# 📋 Guía de Importación de CSVs a Supabase

Esta guía te ayudará a importar todos los datos de tus archivos CSV a tu base de datos de Supabase.

## 📦 Archivos Generados

1. **`migrations/extend-schema-for-import.sql`** - Script SQL para extender el schema de Supabase
2. **`scripts/import-csv-to-supabase.ts`** - Script de importación de datos
3. Este archivo de instrucciones

## 🗂️ Mapeo de CSVs a Tablas

| CSV | Tabla Supabase | Notas |
|-----|----------------|-------|
| Client_export (1).csv | clients | Tabla principal de clientes |
| Trip_export.csv | trips | Viajes (leads/cotizaciones) |
| SoldTrip_export.csv | sold_trips | Viajes vendidos/confirmados |
| TripService_export.csv | trip_services | Servicios de viaje (hotel, vuelos, etc.) |
| ClientPayment_export.csv | client_payments | Pagos recibidos de clientes |
| ClientPaymentPlan_export.csv | client_payment_plans | Planes de pago (nueva tabla) |
| SupplierPayment_export.csv | supplier_payments | Pagos a proveedores |
| Supplier_export.csv | suppliers | Catálogo de proveedores |
| Task_export.csv | tasks | Tareas |
| TripReminder_export.csv | reminders | Recordatorios de viajes |
| TripNote_export.csv | trip_notes | Notas de viajes (nueva tabla) |
| TripDocumentFile_export.csv | trip_document_files | Archivos de documentos (nueva tabla) |
| TravelDocument_export.csv | travel_documents | Documentos de viaje (nueva tabla) |
| Credential_export.csv | credentials | Credenciales de plataformas |
| PersonalCredential_export.csv | credentials | Credenciales personales |
| Review_export.csv | reviews | Reseñas y evaluaciones |
| Attendance_export.csv | attendance | Asistencia de eventos |
| IndustryFair_export.csv | industry_fairs | Ferias del sector |

**Nota:** Los archivos `SupplierContact_export.csv` y `SupplierDocument_export.csv` están vacíos y no se importarán.

---

## 🚀 Pasos para la Importación

### Paso 1: Instalar Supabase CLI

```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# O con Homebrew (en macOS)
brew install supabase/tap/supabase

# Verificar instalación
supabase --version
```

### Paso 2: Configurar Variables de Entorno

Asegúrate de tener las siguientes variables en tu archivo `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

**⚠️ IMPORTANTE:** Necesitas el `SUPABASE_SERVICE_ROLE_KEY` para poder importar datos sin restricciones de RLS.

Para obtener estas credenciales:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings → API
3. Copia las claves necesarias

### Paso 3: Extender el Schema de la Base de Datos

Primero, necesitas ejecutar el script SQL que extiende el schema para incluir todas las columnas y tablas necesarias.

**Opción A: Desde el Dashboard de Supabase**

1. Abre tu proyecto en Supabase
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `migrations/extend-schema-for-import.sql`
5. Ejecuta el script

**Opción B: Usando Supabase CLI**

```bash
# Login en Supabase CLI
supabase login

# Ejecutar migración
supabase db push --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

### Paso 4: Instalar Dependencias del Script

El script de importación necesita algunas dependencias de Node.js:

```bash
cd /Users/jpnarchi/Desktop/COSAS/Astra-Projects/nomadtravel

# Instalar dependencias
npm install csv-parse
npm install @supabase/supabase-js

# O con pnpm
pnpm add csv-parse @supabase/supabase-js
```

### Paso 5: Ejecutar el Script de Importación

```bash
# Ejecutar el script de importación
npx tsx scripts/import-csv-to-supabase.ts

# O si tienes tsx instalado globalmente
tsx scripts/import-csv-to-supabase.ts

# O compilar y ejecutar con Node
npx tsc scripts/import-csv-to-supabase.ts
node scripts/import-csv-to-supabase.js
```

El script importará los datos en el siguiente orden (respetando dependencias):

1. ✅ Clientes
2. ✅ Viajes (Trips)
3. ✅ Viajes Vendidos (Sold Trips)
4. ✅ Proveedores
5. ✅ Servicios de Viaje
6. ✅ Pagos de Clientes
7. ✅ Pagos a Proveedores
8. ✅ Tareas
9. ✅ Recordatorios
10. ✅ Planes de Pago
11. ✅ Notas de Viajes
12. ✅ Archivos de Documentos
13. ✅ Documentos de Viaje

---

## 🔍 Verificación Post-Importación

Después de ejecutar el script, verifica que los datos se importaron correctamente:

```sql
-- Contar registros en cada tabla
SELECT 'clients' as tabla, COUNT(*) as registros FROM public.clients
UNION ALL
SELECT 'trips', COUNT(*) FROM public.trips
UNION ALL
SELECT 'sold_trips', COUNT(*) FROM public.sold_trips
UNION ALL
SELECT 'trip_services', COUNT(*) FROM public.trip_services
UNION ALL
SELECT 'client_payments', COUNT(*) FROM public.client_payments
UNION ALL
SELECT 'supplier_payments', COUNT(*) FROM public.supplier_payments
UNION ALL
SELECT 'suppliers', COUNT(*) FROM public.suppliers
UNION ALL
SELECT 'tasks', COUNT(*) FROM public.tasks
UNION ALL
SELECT 'reminders', COUNT(*) FROM public.reminders
UNION ALL
SELECT 'client_payment_plans', COUNT(*) FROM public.client_payment_plans
UNION ALL
SELECT 'trip_notes', COUNT(*) FROM public.trip_notes
UNION ALL
SELECT 'trip_document_files', COUNT(*) FROM public.trip_document_files
UNION ALL
SELECT 'travel_documents', COUNT(*) FROM public.travel_documents;
```

---

## ⚠️ Solución de Problemas

### Error: "Module not found: csv-parse"

```bash
npm install csv-parse
```

### Error: "Cannot find module '@supabase/supabase-js'"

```bash
npm install @supabase/supabase-js
```

### Error: "tsx: command not found"

```bash
# Instalar tsx globalmente
npm install -g tsx

# O usar npx
npx tsx scripts/import-csv-to-supabase.ts
```

### Error: "SUPABASE_SERVICE_ROLE_KEY no está configurado"

Asegúrate de tener el archivo `.env` con la clave correcta. También puedes ejecutar el script con las variables inline:

```bash
SUPABASE_SERVICE_ROLE_KEY=tu-key npx tsx scripts/import-csv-to-supabase.ts
```

### Error: "Foreign key constraint violation"

Esto puede ocurrir si:
1. Los IDs de referencia no existen en las tablas relacionadas
2. El orden de importación es incorrecto

El script ya maneja el orden correcto, pero si encuentras este error, verifica que todas las dependencias se importaron correctamente primero.

### Errores de duplicados

El script usa `upsert` con `onConflict: 'id'`, lo que significa que si ejecutas el script múltiples veces, actualizará los registros existentes en lugar de crear duplicados.

---

## 📊 Notas Importantes

### IDs y Relaciones

- Los IDs de los CSVs se mantienen tal cual para preservar las relaciones entre tablas
- Se usan los IDs originales de MongoDB/ObjectId
- Las foreign keys se manejan automáticamente

### Datos Faltantes

- Los campos vacíos se convierten en `null`
- Los arrays vacíos `[]` se convierten en `null`
- Las fechas inválidas se convierten en `null`

### Tipos de Datos

- **Fechas**: Se convierten a formato ISO (YYYY-MM-DD)
- **Timestamps**: Se convierten a ISO 8601
- **Decimales**: Se parsean como números con hasta 2 decimales
- **Booleanos**: "true", "false", true, false, "1", "0" se convierten correctamente
- **JSON**: Se parsean arrays y objetos JSON

### Tablas Nuevas Creadas

El script de extensión de schema crea 4 tablas nuevas que no existían en el schema original:

1. **`client_payment_plans`** - Planes de pago para viajes vendidos
2. **`trip_notes`** - Notas asociadas a viajes vendidos
3. **`trip_document_files`** - Archivos de documentos de viajes
4. **`travel_documents`** - Documentos de viaje de clientes (pasaportes, visas, etc.)

---

## 🎯 Próximos Pasos

Después de importar los datos:

1. ✅ Verifica que los datos se importaron correctamente
2. ✅ Revisa las relaciones entre tablas
3. ✅ Actualiza los índices si es necesario
4. ✅ Configura las políticas de RLS adicionales si es necesario
5. ✅ Prueba tu aplicación con los datos importados

---

## 📞 Soporte

Si encuentras problemas durante la importación, revisa:

1. Los logs del script de importación
2. Los errores en la consola de Supabase
3. Las políticas de RLS que podrían estar bloqueando inserts

---

## 🔒 Seguridad

**⚠️ IMPORTANTE:**

- El `SUPABASE_SERVICE_ROLE_KEY` es muy sensible y **nunca debe compartirse públicamente**
- Después de la importación, considera rotar las claves si es necesario
- Las contraseñas en el CSV de `credentials` están en texto plano - considera encriptarlas después de la importación

---

## ✅ Checklist de Importación

- [ ] Supabase CLI instalado
- [ ] Variables de entorno configuradas en `.env`
- [ ] Script SQL de extensión ejecutado
- [ ] Dependencias de Node.js instaladas
- [ ] Script de importación ejecutado exitosamente
- [ ] Verificación de datos completada
- [ ] Aplicación probada con datos importados

---

**¡Buena suerte con la importación!** 🚀
