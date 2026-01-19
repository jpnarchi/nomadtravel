# Nomad Travel CRM

Sistema completo de gestión de relaciones con clientes (CRM) para agencias de viajes de lujo. Gestiona todo el ciclo de vida del cliente, desde la captación de leads hasta viajes completados, con control financiero detallado y herramientas administrativas robustas.

## 🚀 Características Principales

### Gestión de Clientes (CRM)
- Registro completo de clientes con contacto y ubicación
- Tags y categorización personalizada
- Priorización (alta/media/baja)
- Historial completo de viajes
- Preferencias de viaje
- Lista de acompañantes

### Pipeline de Ventas
- Estados del funnel: lead → quote → proposal → negotiation → won/lost
- Probabilidad de cierre (0-100%)
- Presupuestos estimados
- Gestión de fechas y participantes
- Notas y seguimiento detallado

### Gestión de Viajes Vendidos
- **Servicios completos:** hotel, vuelos, tours, transporte, seguros, etc.
- **Pagos de clientes:** múltiples métodos (transferencia, efectivo, tarjeta)
- **Pagos a proveedores:** anticipo, neto, total
- **Viajes grupales:** división de costos, balances individuales
- **Documentación:** notas, archivos, comprobantes
- **Recordatorios:** alertas de pagos y fechas importantes

### Dashboard y Métricas
- Dashboard personal con ventas, comisiones y balance
- Dashboard administrativo con métricas globales
- Estadísticas y análisis de conversión
- Gráficos de rendimiento
- Funnel de conversión

### Control Interno
- Asistencia del equipo
- FAM Trips (viajes de familiarización)
- Ferias del sector
- Material de aprendizaje
- Reviews y mejores prácticas

### Otros Módulos
- **Proveedores:** catálogo completo con contactos y términos
- **Comisiones:** cálculo automático y tracking
- **Credenciales:** compartidas y personales
- **Exportación:** backup completo de datos

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.2** - Biblioteca principal de UI
- **Vite 6.1** - Build tool y bundler
- **React Router 6.26** - Navegación y routing
- **Tailwind CSS 3.4** - Framework CSS utility-first
- **Shadcn/ui** - Sistema de componentes basado en Radix UI
- **React Query 5.84** - Gestión de estado del servidor
- **React Hook Form 7.54** - Manejo de formularios
- **Zod 3.24** - Validación de esquemas
- **Framer Motion 11.16** - Animaciones

### Backend y Servicios
- **Supabase 2.89** - PostgreSQL como servicio
- **Clerk 6.36** - Autenticación y gestión de usuarios
- **Base44 SDK 0.8** - Integración LLM para tipo de cambio

### Librerías de UI/UX
- **Radix UI** - Componentes accesibles (15+ componentes)
- **Lucide React** - Librería de iconos
- **Recharts** - Gráficos y visualización
- **React Leaflet** - Mapas interactivos

### Utilidades
- **jsPDF + html2canvas** - Generación de PDFs
- **date-fns** - Manipulación de fechas
- **Lodash** - Utilidades JavaScript
- **JSZip** - Compresión de archivos

## 📁 Estructura del Proyecto

```
nomadtravel/
├── src/
│   ├── pages/              # 28 páginas de la aplicación
│   ├── components/         # 115+ componentes organizados por módulo
│   │   ├── clients/       # Gestión de clientes
│   │   ├── trips/         # Gestión de viajes (leads)
│   │   ├── soldtrips/     # Gestión de viajes vendidos
│   │   ├── suppliers/     # Proveedores
│   │   ├── statistics/    # Estadísticas y métricas
│   │   ├── dashboard/     # Widgets del dashboard
│   │   ├── commissions/   # Comisiones
│   │   ├── credentials/   # Credenciales
│   │   ├── learning/      # Material de aprendizaje
│   │   ├── reviews/       # Reviews y evaluaciones
│   │   ├── control/       # Control interno
│   │   └── ui/           # Componentes reutilizables
│   ├── api/               # Cliente Supabase y Base44
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Contextos y utilidades
│   ├── config/            # Configuraciones
│   ├── utils/             # Funciones utilitarias
│   └── assets/            # Assets estáticos
├── migrations/            # 38 scripts SQL
├── functions/             # 8 funciones serverless
├── scripts/              # Scripts de importación y utilidad
└── public/               # Archivos públicos
```

## 🗄️ Base de Datos

### Entidades Principales (25+)
- `users` - Usuarios del sistema
- `clients` - Clientes del CRM
- `trips` - Viajes en proceso (leads)
- `sold_trips` - Viajes confirmados
- `trip_services` - Servicios de viajes
- `client_payments` - Pagos de clientes
- `supplier_payments` - Pagos a proveedores
- `group_members` - Miembros de viajes grupales
- `suppliers` - Proveedores
- `commissions` - Comisiones
- `credentials` - Credenciales compartidas
- `personal_credentials` - Credenciales personales
- `reviews` - Reviews y aprendizaje
- `attendance` - Asistencia
- `fam_trips` - FAM Trips
- `industry_fairs` - Ferias

### Características de la BD
- Row Level Security (RLS) habilitado
- Soft deletes (campo `is_deleted`)
- Timestamps automáticos
- Políticas por usuario y admin
- Índices optimizados

## 👥 Roles y Permisos

- **Admin:** Acceso completo a todos los datos y exportación
- **Usuario:** Solo datos propios
- **Supervisor:** Acceso a control interno
- Switch de vista para administradores

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk (Autenticación)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key

# Base44
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_SERVER_URL=your_server_url
VITE_BASE44_TOKEN=your_token
VITE_BASE44_FUNCTIONS_VERSION=your_version

# Modo desarrollo
VITE_DEV_MODE=false
BASE44_LEGACY_SDK_IMPORTS=false
```

## 🚀 Inicio Rápido

### Instalación

```bash
# Clonar el repositorio
git clone [repository-url]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Ejecutar linter
```

## 📊 Dimensiones del Proyecto

- **28 páginas**
- **115+ componentes**
- **25+ entidades de base de datos**
- **38 migraciones SQL**
- **17+ dependencias principales**

## 🎨 Diseño

### Colores Personalizados
- `--nomad-green: #2D4629` - Verde principal
- `--luxury-gold: #D4AF37` - Dorado de lujo

### Tipografías
- **The Seasons** - Headings
- **Cormorant Garamond** - Body text
- **Montserrat** - UI elements

## 🏗️ Arquitectura

### Patrón de Arquitectura
Single Page Application (SPA) con:
- Routing del lado del cliente (React Router)
- Arquitectura basada en componentes
- Separación clara de responsabilidades

### Gestión de Estado
- **Server State:** React Query (datos del servidor)
- **UI State:** React useState/Context (estado local)
- **Form State:** React Hook Form (formularios)
- **Auth State:** Clerk Provider (autenticación)

### Flujo de Datos
```
Usuario → Clerk Auth → React App → Supabase Client → PostgreSQL
                                  ↓
                           React Query (Cache)
                                  ↓
                              Components
```

## 📚 Documentación Adicional

- `INSTRUCCIONES_IMPORTACION.md` - Guía de importación de datos
- `MIGRACION_COMPLETA.md` - Migración de Base44 a Supabase
- `SOLUCION_TRIP_SERVICES.md` - Solución de problemas
- `INSTRUCCIONES-EJECUTAR-SQL.md` - Ejecución de scripts SQL

## 🔐 Seguridad

- Autenticación mediante Clerk
- Row Level Security en Supabase
- Políticas de acceso por rol
- Validación de datos con Zod
- Variables de entorno para credenciales

## 📝 Licencia

Proyecto propietario de Nomad Travel

---

Desarrollado con ❤️ para Nomad Travel
