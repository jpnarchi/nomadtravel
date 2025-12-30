# Guía de Correcciones para Proveedores

## 🔍 Análisis Realizado

Se comparó la implementación de **Trips** (que funciona correctamente) con **Suppliers** para identificar y corregir problemas.

---

## ✅ Correcciones Aplicadas

### 1. **SupplierForm.jsx - Subida de Imágenes**

**Problema:** Línea 81 usaba `base44.integrations.Core.UploadFile` que no existe.

**Solución:** Reemplazado por `supabaseAPI.storage.uploadFile`

```javascript
// ANTES (❌ No funcionaba):
const { file_url } = await base44.integrations.Core.UploadFile({ file });

// AHORA (✅ Funciona):
const { file_url } = await supabaseAPI.storage.uploadFile(file, 'documents', 'supplier-imports');
```

### 2. **SupplierForm.jsx - Smart Import con AI**

**Problema:** Líneas 100 y 173 usaban `base44.integrations.Core.InvokeLLM` que no está disponible.

**Solución:** Comentado temporalmente con mensaje informativo al usuario.

```javascript
// Ahora muestra un mensaje claro:
toast.error('Smart Import con AI aún no está disponible. Por favor, ingresa los datos manualmente.');
```

### 3. **Tabla `suppliers` en Supabase**

**Problema CRÍTICO:** La tabla `suppliers` tiene un esquema desactualizado que no coincide con los campos del formulario.

**Campos que faltaban:**
- `type` - Tipo de proveedor
- `representative_agency_id` - Agencia representante
- `contact1_name, contact1_phone, contact1_email` - Contacto 1
- `contact2_name, contact2_phone, contact2_email` - Contacto 2
- `internal_notes` - Notas internas
- `destinations[]` - Destinos (array)
- `services[]` - Servicios (array)
- `commission, currency` - Comisiones
- `response_time` - Tiempos de respuesta
- `agent_portal, agent_id, documents_folder` - Links y portales
- `payment_methods[]` - Métodos de pago (array)
- `policies, business_hours, confirmation_time` - Operativa
- `team_comments, issues` - Historial

**Solución:** Script SQL creado: `supabase-update-suppliers-table.sql`

---

## 🚀 Pasos para Aplicar las Correcciones

### Paso 1: Actualizar la Tabla en Supabase

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `supabase-update-suppliers-table.sql`
5. Haz clic en **Run**

### Paso 2: Verificar que el Storage esté Configurado

Si aún no lo has hecho, asegúrate de ejecutar también:
- `FIX-STORAGE-SIN-PERMISOS.sql` (para configurar el bucket de storage)

### Paso 3: Probar la Funcionalidad

1. Recarga tu aplicación (Ctrl+Shift+R)
2. Ve a **Proveedores**
3. Haz clic en **"Nuevo Proveedor"**
4. Llena el formulario y guarda
5. Verifica que se guarde correctamente en Supabase

---

## 📋 Verificación de Funcionamiento

### ✅ Lista de Verificación:

- [ ] Ejecutaste `supabase-update-suppliers-table.sql` en Supabase
- [ ] Ejecutaste `FIX-STORAGE-SIN-PERMISOS.sql` para el storage
- [ ] Puedes crear un nuevo proveedor
- [ ] Los datos se guardan correctamente
- [ ] Puedes editar un proveedor existente
- [ ] Puedes ver los proveedores en la lista

---

## 🎯 Comparación: Trips vs Suppliers

### **TripForm.jsx** (Funciona correctamente):
✅ Usa `supabaseAPI` correctamente
✅ Guarda con `supabaseAPI.entities.Trip.create(data)`
✅ Actualiza con `supabaseAPI.entities.Trip.update(id, data)`
✅ Esquema de tabla coincide con el formulario

### **SupplierForm.jsx** (Ahora corregido):
✅ Usa `supabaseAPI.storage.uploadFile` para imágenes
✅ Guarda con `supabaseAPI.entities.Supplier.create(data)`
✅ Actualiza con `supabaseAPI.entities.Supplier.update(id, data)`
✅ Esquema de tabla actualizado (después de ejecutar el script)

---

## 🔧 Estructura Correcta del Flujo

```
Usuario llena formulario
        ↓
SupplierForm.jsx recopila datos
        ↓
onSave(data) se ejecuta
        ↓
Suppliers.jsx recibe los datos
        ↓
createMutation.mutate(data)
        ↓
supabaseAPI.entities.Supplier.create(data)
        ↓
Supabase guarda en la tabla suppliers
        ↓
queryClient invalida queries
        ↓
Lista se actualiza automáticamente
```

---

## ⚠️ Notas Importantes

### Smart Import con AI
La funcionalidad de **Smart Import** que usa AI para extraer datos de imágenes y texto **no está disponible** porque requiere:
- Integración con un servicio de LLM (OpenAI, Claude, etc.)
- Configuración de API keys
- Implementación de la lógica de extracción

**Por ahora:** Los usuarios deben ingresar los datos manualmente.

**Para el futuro:** Se puede implementar usando:
- OpenAI API
- Anthropic Claude API
- Vercel AI SDK
- Otra solución de AI

### Storage de Imágenes
Las imágenes se guardan en `documents/supplier-imports/` en Supabase Storage.
Asegúrate de que el bucket esté configurado correctamente.

---

## 🐛 Solución de Problemas

### Error: "Column does not exist"
**Causa:** No ejecutaste el script SQL de actualización.
**Solución:** Ejecuta `supabase-update-suppliers-table.sql`

### Error: "Storage API error"
**Causa:** El bucket de storage no está configurado o no tienes permisos.
**Solución:** Ejecuta `FIX-STORAGE-SIN-PERMISOS.sql`

### Los datos no se guardan
**Causa:** Puede haber errores en la consola del navegador.
**Solución:**
1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Busca errores en rojo
4. Compártelos para diagnóstico

---

## ✨ Resultado Final

Después de aplicar todas las correcciones:

✅ Los proveedores se guardan correctamente en Supabase
✅ Todos los campos del formulario se almacenan
✅ La subida de imágenes funciona (para futuras implementaciones)
✅ El código sigue el mismo patrón que Trips (buenas prácticas)
✅ La tabla está optimizada con índices para mejor rendimiento

---

**¡Ahora tu sistema de Proveedores funciona igual de bien que el de Trips!** 🎉
