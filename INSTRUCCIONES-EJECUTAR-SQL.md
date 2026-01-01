# 📋 Instrucciones: Arreglar Pagos en Supabase

## ✅ Problemas Detectados y Solucionados

### 1️⃣ **Problema: Pagos a Proveedores y Clientes no Funcionaban**

**Causa:** Las tablas `client_payments` y `supplier_payments` **NO tienen** la columna `is_deleted`, pero el código intentaba filtrar por ella.

**Solución:**
- ✅ Actualizado `supabaseClient.js` para configurar correctamente las entidades
- ✅ Mejorado el método `list()` para aceptar parámetros de ordenamiento (ej: `-date`)
- ✅ Mejorado el método `delete()` para hacer hard delete cuando no hay `is_deleted`

### 2️⃣ **Problema: SupplierDetail.jsx Falla**

**Causa:** Las tablas `supplier_contacts` y `supplier_documents` **no existían**.

**Solución:**
- ✅ Creado archivo SQL: `migrations/create-supplier-relations.sql`
- ✅ Agregadas las entidades `SupplierContact` y `SupplierDocument` en `supabaseClient.js`

---

## 🚀 Pasos para Ejecutar

### Paso 1: Ejecutar SQL en Supabase

1. Ve al **SQL Editor** de Supabase:
   ```
   https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql
   ```

2. Ejecuta el siguiente archivo SQL:
   ```sql
   -- Copia y pega el contenido de:
   migrations/create-supplier-relations.sql
   ```

   Este SQL creará las tablas:
   - `supplier_contacts`
   - `supplier_documents`

### Paso 2: Verificar que las Tablas Existan

1. Ve a **Table Editor** en Supabase
2. Verifica que las siguientes tablas existan:
   - ✅ `client_payments`
   - ✅ `supplier_payments`
   - ✅ `supplier_contacts` (nueva)
   - ✅ `supplier_documents` (nueva)

### Paso 3: Verificar RLS (Row Level Security)

Las políticas RLS ya están incluidas en el SQL. Verifica que las políticas estén activas:

1. Ve a **Authentication > Policies** en Supabase
2. Verifica que cada tabla tenga la política:
   ```
   "Allow all for authenticated users"
   ```

---

## 📊 Resumen de Cambios en el Código

### `supabaseClient.js`
- ✅ **Método `list()`**: Ahora acepta parámetro de ordenamiento opcional
  - Ejemplo: `list('-date')` ordena por fecha descendente
- ✅ **Método `delete()`**: Detecta automáticamente si la tabla tiene `is_deleted`
  - Si NO tiene: hace **hard delete** (elimina permanentemente)
  - Si SÍ tiene: hace **soft delete** (marca como eliminado)
- ✅ **Entidades configuradas correctamente**:
  - `ClientPayment` → `hasIsDeleted: false`
  - `SupplierPayment` → `hasIsDeleted: false`
  - `TripService` → `hasIsDeleted: false`
  - `Task` → `hasIsDeleted: false`
  - `SupplierContact` → agregada (nueva)
  - `SupplierDocument` → agregada (nueva)

---

## 🧪 Prueba que Todo Funciona

### Probar Pagos a Proveedores
1. Ve a la página **Internal Payments**
2. Deberías ver la lista de pagos a proveedores
3. Intenta:
   - ✅ Cambiar el estado de un pago (Hecho → Confirmado)
   - ✅ Editar un pago
   - ✅ Eliminar un pago

### Probar Pagos de Clientes
1. Ve a la página **Internal Client Payments**
2. Deberías ver la lista de pagos de clientes
3. Intenta:
   - ✅ Cambiar el estado (Reportado → Confirmado → Cambiado a USD)
   - ✅ Editar un pago
   - ✅ Eliminar un pago

### Probar Detalles de Proveedor
1. Ve a **Suppliers** y abre cualquier proveedor
2. Deberías ver las pestañas:
   - ✅ **Contactos** (ahora funciona)
   - ✅ **Documentos** (ahora funciona)
   - ✅ Info Operativa
   - ✅ Historial

---

## ⚠️ Notas Importantes

### Tablas SIN `is_deleted` (Hard Delete)
Estas tablas eliminan registros **permanentemente**:
- `client_payments`
- `supplier_payments`
- `trip_services`
- `tasks`
- `supplier_contacts`
- `supplier_documents`

### Tablas CON `is_deleted` (Soft Delete)
Estas tablas solo **marcan** registros como eliminados:
- `clients`
- `trips`
- `sold_trips`
- `suppliers`
- `credentials`
- `client_payment_plan`
- `trip_notes`
- `trip_document_files`
- `trip_reminders`

---

## 📝 Si Encuentras Errores

Si después de ejecutar el SQL sigues viendo errores:

1. **Verifica la consola del navegador** (F12 → Console)
2. **Busca errores de permisos** → Verifica las políticas RLS
3. **Verifica que las variables de entorno estén configuradas**:
   ```bash
   VITE_SUPABASE_URL=tu_url
   VITE_SUPABASE_ANON_KEY=tu_key
   ```

---

## ✅ Checklist Final

- [ ] Ejecuté `create-supplier-relations.sql` en Supabase
- [ ] Verifiqué que las tablas `supplier_contacts` y `supplier_documents` existen
- [ ] Verifiqué que las políticas RLS están activas
- [ ] Probé los pagos a proveedores (Internal Payments)
- [ ] Probé los pagos de clientes (Internal Client Payments)
- [ ] Probé abrir un proveedor y ver contactos/documentos

---

**¡Listo! Ahora los pagos deberían funcionar correctamente.** 🎉
