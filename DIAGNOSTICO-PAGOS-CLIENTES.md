# 🔍 DIAGNÓSTICO: Pagos Internos Clientes

## Paso 1: Abrir la página
1. Ve al menú lateral → **"Pagos Internos Clientes"**
2. Abre la consola del navegador (presiona `F12` o `Cmd+Option+I` en Mac)
3. Ve a la pestaña **Console**

## Paso 2: Ejecutar diagnóstico completo

Copia y pega este código en la consola:

```javascript
(async () => {
  console.log('🔍 INICIANDO DIAGNÓSTICO...\n');

  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando conexión a Supabase...');
    const allPayments = await supabaseAPI.entities.ClientPayment.list('-date');
    console.log(`✅ Conexión exitosa. Total de pagos en BD: ${allPayments.length}\n`);

    // 2. Analizar tipos de pago
    console.log('2️⃣ Analizando tipos de pago:');
    const paymentsByMethod = allPayments.reduce((acc, p) => {
      acc[p.method || 'sin_metodo'] = (acc[p.method || 'sin_metodo'] || 0) + 1;
      return acc;
    }, {});
    console.table(paymentsByMethod);

    // 3. Pagos filtrados (excluyendo tarjeta_cliente)
    const filteredPayments = allPayments.filter(p => p.method !== 'tarjeta_cliente');
    console.log(`\n3️⃣ Pagos visibles (sin tarjeta_cliente): ${filteredPayments.length}`);
    console.log(`   Pagos ocultos (tarjeta_cliente): ${allPayments.length - filteredPayments.length}\n`);

    // 4. Últimos 5 pagos visibles
    if (filteredPayments.length > 0) {
      console.log('4️⃣ Últimos 5 pagos visibles:');
      console.table(filteredPayments.slice(0, 5).map(p => ({
        Fecha: p.date,
        Monto_USD: p.amount_usd_fixed || p.amount,
        Moneda: p.currency || 'USD',
        Método: p.method,
        Status: p.status || 'sin_status',
        Creado_por: p.created_by
      })));
    } else {
      console.log('⚠️ No hay pagos visibles en esta página');
    }

    // 5. Verificar viajes
    console.log('\n5️⃣ Verificando viajes vendidos...');
    const soldTrips = await supabaseAPI.entities.SoldTrip.list();
    console.log(`✅ Total de viajes vendidos: ${soldTrips.length}`);

    // 6. Resumen final
    console.log('\n📊 RESUMEN:');
    console.log(`- Total pagos en BD: ${allPayments.length}`);
    console.log(`- Pagos visibles: ${filteredPayments.length}`);
    console.log(`- Pagos con tarjeta_cliente (ocultos): ${allPayments.filter(p => p.method === 'tarjeta_cliente').length}`);
    console.log(`- Viajes vendidos: ${soldTrips.length}`);

    // 7. Sugerencias
    console.log('\n💡 SUGERENCIAS:');
    if (filteredPayments.length === 0 && allPayments.length === 0) {
      console.log('❌ No hay pagos registrados. Registra un pago de prueba.');
    } else if (filteredPayments.length === 0 && allPayments.length > 0) {
      console.log('⚠️ Todos tus pagos son "tarjeta_cliente" (se ocultan automáticamente).');
      console.log('   Registra un pago con método "transferencia" o "efectivo" para verlo aquí.');
    } else {
      console.log('✅ La página está funcionando correctamente.');
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.log('Verifica que estés conectado a Supabase correctamente.');
  }
})();
```

## Paso 3: Interpretar resultados

### ✅ Si todo funciona correctamente verás:
- Total de pagos en BD > 0
- Pagos visibles > 0
- Una tabla con tus últimos pagos

### ⚠️ Si no ves pagos:

**Caso A: "Total pagos en BD: 0"**
- No hay pagos registrados en absoluto
- Solución: Registra un pago de prueba en algún viaje

**Caso B: "Pagos visibles: 0" pero "Total pagos > 0"**
- Todos tus pagos son "tarjeta_cliente" (se ocultan automáticamente)
- Solución: Estos pagos se ven en la pestaña "Pagos Cliente" de cada viaje individual

**Caso C: Error de conexión**
- Problema con Supabase
- Verifica las credenciales en `.env`

## Paso 4: Registrar un pago de prueba

Si no tienes pagos visibles, registra uno de prueba:

1. Ve a **Viajes Vendidos**
2. Entra a cualquier viaje
3. Tab **"Pagos Cliente"**
4. Click **"Registrar Pago"**
5. Llena el formulario:
   - Monto: 1000
   - Método: **Transferencia** (NO "tarjeta_cliente")
   - Fecha: hoy
6. Guarda
7. Vuelve a **"Pagos Internos Clientes"**
8. Deberías ver el pago

## Paso 5: Verificar estados

Los pagos deben tener uno de estos estados:
- **Reportado** (naranja) - Recién registrado
- **Confirmado** (verde) - Ya está en tu cuenta bancaria
- **Cambiado a USD** (morado) - Para pagos en MXN ya convertidos

Cambia el estado desde el dropdown en cada fila.
