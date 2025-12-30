# Solución: Error al guardar servicios en trip_services

## Problema Identificado

El error `PGRST204: Could not find the 'booked_by' column of 'trip_services' in the schema cache` ocurre porque el código está intentando insertar campos que no existen como columnas en la tabla `trip_services`.

### Estructura Esperada vs Actual

**La tabla `trip_services` tiene estas columnas:**
- id, sold_trip_id, service_type, service_name, supplier_name
- cost, **price**, commission, paid_to_agent
- payment_date, start_date, end_date, notes
- is_deleted, created_date, updated_date, created_by
- **metadata** (JSONB) ← Aquí deben ir todos los campos adicionales

**El código está enviando:**
- `total_price` (❌ debería ser `price`)
- `booked_by` (❌ debería estar en `metadata`)
- `reservation_status` (❌ debería estar en `metadata`)
- `local_currency` (❌ debería estar en `metadata`)
- Y muchos otros campos directamente a la tabla

## Solución

### Opción 1: Arreglar la Base de Datos (RECOMENDADO)

Ejecuta el script SQL que creé en Supabase:

1. Ve al **SQL Editor** de tu proyecto en Supabase
2. Abre y ejecuta el archivo: `migrations/fix-trip-services-schema.sql`
3. Este script:
   - Verifica que la tabla existe con la estructura correcta
   - Asegura que el campo `metadata` (JSONB) existe
   - Elimina cualquier columna que no debería existir
   - Migra los datos existentes al campo metadata antes de eliminar columnas
   - Crea índices y triggers necesarios

### Opción 2: Verificar el Código del Formulario

El código en `ServiceForm.jsx` debería estar estructurando los datos correctamente:

**Problema en línea 429:**
```javascript
price: formData.total_price || 0,  // Map total_price to price field
```

Pero según los logs, se está enviando `total_price`, no `price`. Esto sugiere que algo está mal.

**Verifica que `handleSubmit` en ServiceForm.jsx (líneas 384-456) esté así:**

```javascript
const handleSubmit = (e) => {
  e.preventDefault();

  // Campos base que existen en la tabla trip_services
  const baseFields = {
    service_type: formData.service_type,
    service_name: serviceName,
    sold_trip_id: soldTripId,
    price: formData.total_price || 0,  // ⚠️ Mapear total_price a price
    commission: formData.commission || 0,
    notes: formData.notes || '',
    payment_date: formData.commission_payment_date || null,
    start_date: formData.check_in || formData.flight_date || formData.tour_date || /* ... */ null,
    end_date: formData.check_out || formData.cruise_arrival_date || null,
  };

  // TODO lo demás va a metadata
  const metadata = { ...formData };

  // Eliminar campos que ya están en baseFields
  delete metadata.service_type;
  delete metadata.service_name;
  delete metadata.sold_trip_id;
  delete metadata.commission;
  delete metadata.notes;
  delete metadata.commission_payment_date;
  // ⚠️ NO eliminar total_price porque va en metadata para referencia

  const dataToSave = {
    ...baseFields,
    metadata: metadata
  };

  console.log('Guardando servicio:', dataToSave);
  onSave(dataToSave);
};
```

### Opción 3: Debugging

Si después de ejecutar el script SQL el problema persiste:

1. Abre las DevTools del navegador
2. Ve a la consola
3. Busca el log: `"Guardando servicio:"`
4. Expande el objeto y verifica que tenga esta estructura:

```javascript
{
  service_type: "hotel",
  service_name: "Hotel Name",
  sold_trip_id: "uuid-aqui",
  price: 9999.89,              // ✅ price, no total_price
  commission: 999.92,
  notes: "...",
  payment_date: null,
  start_date: "2028-09-20",
  end_date: "2028-09-28",
  metadata: {                  // ✅ Todos los demás campos aquí
    booked_by: "montecito",
    reservation_status: "reservado",
    local_currency: "USD",
    local_amount: 9999.89,
    total_price: 9999.89,      // ✅ También guardarlo aquí para referencia
    vehicle: "...",
    hotel_name: "...",
    // ... todos los demás campos
  }
}
```

## Verificación

Después de aplicar la solución:

1. Intenta crear un nuevo servicio
2. Si funciona, verás el servicio guardado sin errores
3. Puedes verificar en Supabase → Table Editor → trip_services que:
   - Los campos base están en las columnas correspondientes
   - El campo `metadata` contiene un objeto JSON con todos los detalles adicionales

## Próximos Pasos

Si el error persiste después de ejecutar el script SQL, el problema está en el código JavaScript. En ese caso:

1. Revisa que `ServiceForm.jsx` línea 449-455 esté enviando la estructura correcta
2. Verifica que `SoldTripDetail.jsx` línea 221-228 no esté destruyendo la estructura
3. Comparte el output del console.log "Guardando servicio:" para análisis adicional
