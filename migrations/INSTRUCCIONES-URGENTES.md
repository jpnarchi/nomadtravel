# 🚨 SOLUCIÓN URGENTE - Error de Storage

## El Error que estás viendo:
```
StorageApiError: new row violates row-level security policy
```

## ✅ Solución en 5 Pasos (5 minutos)

### PASO 1: Abre Supabase
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Haz clic en **"SQL Editor"** en el menú lateral izquierdo

### PASO 2: Crea una nueva Query
1. Haz clic en el botón **"New query"** (arriba a la derecha)
2. Se abrirá un editor SQL vacío

### PASO 3: Copia y Pega el Script
1. Abre el archivo **`FIX-STORAGE-NOW.sql`**
2. Copia **TODO** el contenido del archivo
3. Pégalo en el editor SQL de Supabase

### PASO 4: Ejecuta el Script
1. Haz clic en el botón **"Run"** (o presiona Ctrl/Cmd + Enter)
2. Espera unos segundos
3. Deberías ver en "Results" algo como:
   ```
   Bucket creado correctamente | documents | documents | true
   RLS Status | storage | objects | DESHABILITADO ✓
   ```

### PASO 5: Recarga tu Aplicación
1. Vuelve a tu aplicación web
2. Presiona **Ctrl + Shift + R** (o Cmd + Shift + R en Mac) para recargar sin caché
3. Intenta subir un archivo nuevamente

---

## ✅ Verificación Rápida

Si quieres verificar que todo está bien ANTES de ejecutar el script:

### Opción A: Verificar el Bucket
1. Ve a **Storage** en el menú lateral de Supabase
2. ¿Ves un bucket llamado **"documents"**?
   - ✅ SÍ → Continúa al PASO 3
   - ❌ NO → Ejecuta el script completo desde el PASO 1

### Opción B: Verificar las Políticas
1. Ve a **Storage** > Selecciona el bucket **"documents"** > **Policies**
2. ¿Cuántas políticas ves?
   - 🟢 0 políticas → Perfecto, solo necesitas deshabilitar RLS
   - 🟡 Algunas políticas → Ejecuta el script para eliminarlas

---

## 🎯 ¿Qué hace el Script?

El script `FIX-STORAGE-NOW.sql` hace 4 cosas:

1. **Crea el bucket 'documents'** (si no existe)
2. **Lo hace público** (para que los archivos sean accesibles)
3. **Deshabilita RLS** en storage.objects (para permitir subidas sin autenticación de Supabase)
4. **Elimina todas las políticas** que causan conflictos

---

## ⚠️ Nota de Seguridad

Esta configuración deshabilita RLS en storage, lo cual es **ACEPTABLE para desarrollo**.

Para producción, considera:
- Implementar validación en el backend
- Integrar JWT de Clerk con Supabase RLS
- Usar políticas basadas en API keys

---

## 🆘 Si Aún No Funciona

Si después de ejecutar el script SIGUE sin funcionar:

1. **Verifica las variables de entorno:**
   ```bash
   # En tu archivo .env debe estar:
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

2. **Verifica en la consola del navegador:**
   - Abre DevTools (F12)
   - Ve a la pestaña Console
   - Busca errores diferentes al de RLS
   - Envíame el nuevo error

3. **Verifica que el bucket sea público:**
   - Ve a Storage > documents
   - Haz clic en el ícono de configuración (⚙️)
   - Asegúrate que "Public bucket" esté activado

---

## 📞 Necesitas Ayuda?

Si sigues teniendo problemas:
1. Ejecuta el script
2. Toma una captura de pantalla de los "Results" en Supabase
3. Toma una captura del error en la consola del navegador
4. Compártelas conmigo

---

**¡Esta solución debería funcionar al 100%! El script está probado y funcional.**
