# Instrucciones para Aplicar Migración de Pagos

## Problema Identificado

Las tablas `client_payments` y `supplier_payments` **ya existen** en Supabase, pero les faltan varias columnas que el código está intentando guardar:

### Campos faltantes en `client_payments`:
- `currency` - Moneda del pago (USD, MXN)
- `amount_original` - Monto en moneda original
- `fx_rate` - Tipo de cambio usado
- `amount_usd_fixed` - Monto convertido a USD
- `bank` - Banco donde se recibió el pago
- `status` - Estado del pago
- `receipt_url` - URL del comprobante
- `created_by` - Usuario que creó el registro

### Campos faltantes en `supplier_payments`:
- `receipt_url` - URL del comprobante
- `created_by` - Usuario que creó el registro
- `currency` - Moneda del pago

## Cómo Aplicar la Migración

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **"New Query"**
4. Copia todo el contenido del archivo `migrations/add-payment-fields.sql`
5. Pégalo en el editor
6. Haz clic en **"Run"** (o presiona Ctrl/Cmd + Enter)
7. Verifica que no haya errores en la consola

### Opción 2: Desde la terminal con Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db push migrations/add-payment-fields.sql
```

## Verificar que la Migración Funcionó

Después de ejecutar la migración, puedes verificar que las columnas se agregaron correctamente ejecutando esta consulta en el SQL Editor:

```sql
-- Verificar columnas de client_payments
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'client_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar columnas de supplier_payments
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'supplier_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

## Qué Hace Esta Migración

1. **Agrega columnas faltantes** a las tablas sin borrar datos existentes
2. **Usa `IF NOT EXISTS`** para evitar errores si ya existen algunas columnas
3. **Actualiza registros existentes** copiando el valor de `amount` a los nuevos campos cuando sea necesario
4. **Agrega comentarios** para documentar el propósito de cada campo

## Después de la Migración

Una vez ejecutada la migración, los formularios de pago deberían funcionar correctamente:

- **PaymentForm.jsx** (Pagos de Cliente) podrá guardar:
  - Moneda (USD/MXN)
  - Monto original
  - Tipo de cambio
  - Banco receptor

- **SupplierPaymentForm.jsx** (Pagos a Proveedores) podrá guardar:
  - Comprobantes de pago
  - Todos los campos del formulario

## En Caso de Problemas

Si encuentras algún error al ejecutar la migración:

1. Revisa el error específico en la consola de Supabase
2. Verifica que tienes permisos de administrador en el proyecto
3. Puedes ejecutar las líneas `ALTER TABLE` una por una para identificar cuál falla

## Archivos Relacionados

- `/migrations/add-payment-fields.sql` - Script de migración
- `/src/components/soldtrips/PaymentForm.jsx` - Formulario de pagos de cliente
- `/src/components/soldtrips/SupplierPaymentForm.jsx` - Formulario de pagos a proveedores
- `/src/pages/SoldTripDetail.jsx` - Página principal que usa estos formularios
