# Migración Completa de Funcionalidades - Nomad Travel CRM

## Resumen de Cambios

Se han migrado exitosamente las siguientes funcionalidades del repositorio de mariasalinas (Base44) al proyecto de jpnarchi (Supabase + Clerk):

### 1. **Sistema de Viajes Grupales** ✅
Permite gestionar viajes con múltiples participantes, con división de costos flexible.

### 2. **Exportación de Datos** ✅
Permite a los administradores exportar toda la base de datos en formato CSV/ZIP.

---

## Archivos Creados/Modificados

### Nuevos Archivos

#### Migración de Base de Datos
- `migrations/add-group-trips-feature.sql` - Migración SQL para agregar soporte de viajes grupales

#### Componentes
- `src/components/soldtrips/GroupMembersList.jsx` - Gestión de miembros de grupos
- `src/components/soldtrips/GroupBalances.jsx` - Visualización de balances por persona

#### Páginas
- `src/pages/DescargarDatos.jsx` - Exportación de datos del CRM

### Archivos Modificados

- `src/components/soldtrips/SoldTripForm.jsx` - Agregados campos para viajes grupales
- `src/api/supabaseClient.js` - Agregada entidad GroupMember
- `src/pages.config.js` - Agregada página DescargarDatos
- `src/Layout.jsx` - Agregado menú de navegación para DescargarDatos

---

## Pasos para Aplicar la Migración

### 1. Ejecutar Migración de Base de Datos

**IMPORTANTE:** Debes ejecutar este SQL en tu panel de Supabase antes de usar las nuevas funcionalidades.

```bash
# Opción 1: Desde Supabase Dashboard
# 1. Ve a https://supabase.com/dashboard/project/TU_PROJECT_ID/editor
# 2. Copia y pega el contenido de: migrations/add-group-trips-feature.sql
# 3. Ejecuta el script
```

El script creará:
- Tabla `group_members` con todos sus campos
- Campos adicionales en `sold_trips`: `is_group_trip`, `group_split_method`, `travelers`
- Campos adicionales en `client_payments`: `group_member_id`, `paid_for_member_id`
- Índices y políticas RLS necesarias

### 2. Instalar Dependencia JSZip

La funcionalidad de exportación requiere la librería JSZip:

```bash
npm install jszip
```

### 3. Reiniciar Servidor de Desarrollo

```bash
npm run dev
```

---

## Nuevas Funcionalidades

### 1. Viajes Grupales

#### Cómo Crear un Viaje Grupal

1. **Editar un Viaje Vendido:**
   - Ve a "Viajes Vendidos" en el menú
   - Haz clic en un viaje existente
   - En el formulario de edición, verás una nueva sección morada "Este es un viaje grupal"
   - Marca el checkbox

2. **Seleccionar Método de División:**
   - **Igual entre todos:** El costo total se divide equitativamente
   - **Por porcentaje:** Cada miembro paga un porcentaje específico
   - **Montos fijos:** Cada miembro tiene un monto asignado específico

3. **Agregar Miembros del Grupo:**
   - Después de marcar como viaje grupal, verás una nueva pestaña "Miembros"
   - Haz clic en "Agregar Miembro"
   - Completa la información:
     - Nombre completo *
     - Tipo (Adulto/Niño)
     - Email (opcional)
     - Teléfono (opcional)
     - ¿Es el organizador? (checkbox)
     - ¿Responsable de su propio pago? (checkbox)
     - Notas (opcional)

4. **Ver Balances:**
   - En la pestaña "Balances" verás:
     - Total a cobrar
     - Total cobrado
     - Saldo pendiente
     - Balance individual de cada miembro

#### Campos de GroupMember

```sql
- id (UUID)
- sold_trip_id (UUID) - Referencia al viaje vendido
- name (TEXT) - Nombre completo
- type (TEXT) - 'adulto' o 'niño'
- email (TEXT) - Email del miembro
- phone (TEXT) - Teléfono del miembro
- is_organizer (BOOLEAN) - ¿Es el organizador?
- is_payment_responsible (BOOLEAN) - ¿Paga por sí mismo?
- status (TEXT) - 'activo' o 'cancelado'
- percentage (DECIMAL) - Porcentaje a pagar (método percentage)
- fixed_amount (DECIMAL) - Monto fijo a pagar (método fixed)
- notes (TEXT) - Notas adicionales
```

### 2. Exportación de Datos

#### Cómo Exportar Datos

1. **Acceso:** Solo disponible para administradores
2. **Ubicación:** Menú lateral > "Descargar Datos"
3. **Proceso:**
   - Haz clic en "Descargar Todos los Datos"
   - Espera a que se genere el archivo (puede tardar unos segundos)
   - Se descargará un archivo ZIP con formato: `nomad-crm-export-YYYY-MM-DD.zip`

#### Entidades Exportadas

El archivo ZIP contiene un CSV por cada una de estas entidades:

- Clientes
- Viajes
- Viajes Vendidos
- Servicios de Viajes
- Pagos de Clientes
- Planes de Pago
- Pagos a Proveedores
- **Miembros de Grupos** (NUEVO)
- Comisiones Internas
- Asistencia
- Ferias
- FAM Trips
- Documentos de Viajes
- Notas de Viajes
- Recordatorios
- Documentos de Viaje
- Tareas
- Proveedores
- Contactos de Proveedores
- Documentos de Proveedores
- Reviews
- Material de Aprendizaje
- Credenciales
- Credenciales Personales
- Recordatorios Generales

---

## Uso en Código

### Ejemplo: Usar GroupMembers en un Componente

```jsx
import { supabaseAPI } from '@/api/supabaseClient';

// Obtener todos los miembros de un viaje grupal
const members = await supabaseAPI.entities.GroupMember.filter({
  sold_trip_id: 'uuid-del-viaje'
});

// Crear un nuevo miembro
const newMember = await supabaseAPI.entities.GroupMember.create({
  sold_trip_id: 'uuid-del-viaje',
  name: 'Juan Pérez',
  type: 'adulto',
  is_organizer: false,
  is_payment_responsible: true,
  status: 'activo',
  email: 'juan@ejemplo.com'
});

// Actualizar un miembro
await supabaseAPI.entities.GroupMember.update('uuid-del-miembro', {
  status: 'cancelado'
});

// Eliminar un miembro (hard delete)
await supabaseAPI.entities.GroupMember.hardDelete('uuid-del-miembro');
```

### Ejemplo: Verificar si es Viaje Grupal

```jsx
const soldTrip = await supabaseAPI.entities.SoldTrip.get('uuid-del-viaje');

if (soldTrip.is_group_trip) {
  console.log('Método de división:', soldTrip.group_split_method);

  // Obtener miembros
  const members = await supabaseAPI.entities.GroupMember.filter({
    sold_trip_id: soldTrip.id,
    status: 'activo'
  });
}
```

---

## Próximos Pasos Opcionales

### 1. Actualizar PaymentForm (Pendiente)

Si deseas que el formulario de pagos permita seleccionar un miembro del grupo, puedes:

1. Agregar un selector en `src/components/soldtrips/PaymentForm.jsx`
2. Al crear/editar pagos, incluir el campo `group_member_id`
3. Esto permite rastrear qué miembro del grupo realizó cada pago

### 2. Integración con Detalles de Viaje

Considera agregar las pestañas "Miembros" y "Balances" en la página de detalle del viaje vendido (`src/pages/SoldTripDetail.jsx`) para una mejor UX.

### 3. Supabase Edge Function (Opcional)

La exportación actual funciona desde el cliente. Para mejorar rendimiento en grandes volúmenes, puedes crear una Edge Function en Supabase que genere el ZIP en el servidor.

---

## Soporte y Mantenimiento

### Verificar que todo funcione

1. Ejecuta la migración SQL
2. Instala jszip
3. Reinicia el servidor
4. Crea un viaje vendido y márcalo como grupal
5. Agrega algunos miembros
6. Verifica que aparezcan los balances
7. Prueba la exportación de datos

### Troubleshooting

**Error: "relation group_members does not exist"**
- Solución: Ejecuta la migración SQL en Supabase

**Error: "JSZip is not defined"**
- Solución: Ejecuta `npm install jszip`

**No aparece "Descargar Datos" en el menú**
- Solución: Verifica que estés logueado como administrador

**Los balances no se calculan correctamente**
- Solución: Verifica que los pagos tengan el campo `group_member_id` o `paid_for_member_id` correctamente asignado

---

## Estructura de la Base de Datos

```
sold_trips
├── id
├── ...campos existentes...
├── is_group_trip (NUEVO)
├── group_split_method (NUEVO)
└── travelers (NUEVO)

group_members (NUEVA TABLA)
├── id
├── sold_trip_id → sold_trips.id
├── name
├── type
├── email
├── phone
├── is_organizer
├── is_payment_responsible
├── status
├── percentage
├── fixed_amount
├── notes
├── created_date
└── updated_date

client_payments
├── ...campos existentes...
├── group_member_id (NUEVO) → group_members.id
└── paid_for_member_id (NUEVO) → group_members.id
```

---

## Conclusión

La migración está completa y lista para usar. Todas las funcionalidades han sido adaptadas para funcionar con Supabase + Clerk sin afectar la estructura existente de tu proyecto.

Funcionalidades migradas:
- ✅ Sistema de viajes grupales completo
- ✅ Gestión de miembros
- ✅ Cálculo de balances
- ✅ Exportación de datos
- ⏳ Integración de pagos por miembro (pendiente/opcional)

Si tienes alguna duda o necesitas ayuda, revisa este documento o contacta al desarrollador.
