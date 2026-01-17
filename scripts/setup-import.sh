#!/bin/bash

# Script de configuración e importación de datos a Supabase
# Este script facilita todo el proceso de importación

set -e  # Salir en caso de error

echo "🚀 Script de Importación de Datos a Supabase"
echo "=============================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto${NC}"
  exit 1
fi

# Función para verificar dependencias
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}❌ $1 no está instalado${NC}"
    return 1
  else
    echo -e "${GREEN}✅ $1 está instalado${NC}"
    return 0
  fi
}

# Paso 1: Verificar dependencias del sistema
echo "📦 Paso 1: Verificando dependencias del sistema..."
echo ""

check_dependency "node" || exit 1
check_dependency "npm" || exit 1
check_dependency "supabase" || {
  echo -e "${YELLOW}⚠️  Supabase CLI no está instalado. Instalando...${NC}"
  brew install supabase/tap/supabase || {
    echo -e "${RED}❌ No se pudo instalar Supabase CLI. Por favor, instálalo manualmente:${NC}"
    echo "npm install -g supabase"
    exit 1
  }
}

echo ""

# Verificar versión de Supabase CLI
SUPABASE_VERSION=$(supabase --version | head -n 1 || echo "unknown")
echo -e "${GREEN}📌 Supabase CLI versión: $SUPABASE_VERSION${NC}"

# Recomendar actualización si es necesario
if [[ "$SUPABASE_VERSION" < "2.70.0" ]]; then
  echo -e "${YELLOW}⚠️  Se recomienda actualizar Supabase CLI:${NC}"
  echo "   brew upgrade supabase"
  echo ""
  read -p "¿Deseas actualizar ahora? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    brew upgrade supabase
  fi
fi

echo ""

# Paso 2: Verificar archivo .env
echo "🔑 Paso 2: Verificando configuración de Supabase..."
echo ""

if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo -e "${RED}❌ No se encontró archivo .env o .env.local${NC}"
  echo ""
  echo "Crea un archivo .env con el siguiente contenido:"
  echo ""
  echo "NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key"
  echo "SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key"
  echo ""
  exit 1
fi

# Cargar variables de entorno
if [ -f ".env.local" ]; then
  source .env.local
elif [ -f ".env" ]; then
  source .env
fi

# Verificar que las variables necesarias estén configuradas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL no está configurado en .env${NC}"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY no está configurado en .env${NC}"
  echo -e "${YELLOW}⚠️  Esta clave es necesaria para importar datos sin restricciones de RLS${NC}"
  echo ""
  echo "Obtén tu Service Role Key desde:"
  echo "Supabase Dashboard → Settings → API → service_role key"
  exit 1
fi

echo -e "${GREEN}✅ Variables de entorno configuradas correctamente${NC}"
echo ""

# Paso 3: Instalar dependencias de Node.js
echo "📦 Paso 3: Instalando dependencias de Node.js..."
echo ""

# Verificar si csv-parse está instalado
if ! npm list csv-parse &> /dev/null; then
  echo "Instalando csv-parse..."
  npm install csv-parse
else
  echo -e "${GREEN}✅ csv-parse ya está instalado${NC}"
fi

# Verificar si @supabase/supabase-js está instalado
if ! npm list @supabase/supabase-js &> /dev/null; then
  echo "Instalando @supabase/supabase-js..."
  npm install @supabase/supabase-js
else
  echo -e "${GREEN}✅ @supabase/supabase-js ya está instalado${NC}"
fi

# Verificar si tsx está instalado (necesario para ejecutar TypeScript)
if ! command -v tsx &> /dev/null && ! npm list -g tsx &> /dev/null; then
  echo "Instalando tsx..."
  npm install -g tsx
else
  echo -e "${GREEN}✅ tsx ya está instalado${NC}"
fi

echo ""

# Paso 4: Extender el schema de Supabase
echo "🗃️  Paso 4: Extendiendo el schema de Supabase..."
echo ""

echo -e "${YELLOW}⚠️  IMPORTANTE: Debes ejecutar el script SQL en Supabase${NC}"
echo ""
echo "Opciones:"
echo ""
echo "1. Desde el Dashboard de Supabase (Recomendado):"
echo "   - Abre: $NEXT_PUBLIC_SUPABASE_URL"
echo "   - Ve a SQL Editor"
echo "   - Copia y pega el contenido de: migrations/extend-schema-for-import.sql"
echo "   - Ejecuta el script"
echo ""
echo "2. Usando Supabase CLI:"
echo "   - supabase db push --db-url 'tu-database-url'"
echo ""

read -p "¿Ya ejecutaste el script SQL de migración? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}⚠️  Por favor, ejecuta el script SQL primero y luego vuelve a ejecutar este script${NC}"
  echo ""
  echo "Archivo de migración: migrations/extend-schema-for-import.sql"
  exit 1
fi

echo -e "${GREEN}✅ Schema extendido${NC}"
echo ""

# Paso 5: Verificar que los CSVs existen
echo "📁 Paso 5: Verificando archivos CSV..."
echo ""

CSV_DIR="/Users/jpnarchi/Desktop/Nueva carpeta con elementos"

if [ ! -d "$CSV_DIR" ]; then
  echo -e "${RED}❌ No se encontró el directorio de CSVs: $CSV_DIR${NC}"
  exit 1
fi

CSV_COUNT=$(ls -1 "$CSV_DIR"/*.csv 2>/dev/null | wc -l | tr -d ' ')

if [ "$CSV_COUNT" -eq "0" ]; then
  echo -e "${RED}❌ No se encontraron archivos CSV en: $CSV_DIR${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Se encontraron $CSV_COUNT archivos CSV${NC}"
echo ""

# Paso 6: Ejecutar importación
echo "🚀 Paso 6: Ejecutando importación de datos..."
echo ""

echo -e "${YELLOW}⚠️  Este proceso puede tardar varios minutos dependiendo de la cantidad de datos${NC}"
echo ""

read -p "¿Deseas iniciar la importación? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Importación cancelada"
  exit 0
fi

echo ""
echo "Importando datos..."
echo ""

# Ejecutar script de importación
if command -v tsx &> /dev/null; then
  tsx scripts/import-csv-to-supabase.ts
elif npx tsx --version &> /dev/null; then
  npx tsx scripts/import-csv-to-supabase.ts
else
  echo -e "${RED}❌ No se pudo ejecutar el script. Instala tsx:${NC}"
  echo "npm install -g tsx"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Importación completada!${NC}"
echo ""

# Paso 7: Verificación
echo "🔍 Paso 7: Verificación (opcional)"
echo ""
echo "Para verificar que los datos se importaron correctamente:"
echo ""
echo "1. Abre Supabase Dashboard: $NEXT_PUBLIC_SUPABASE_URL"
echo "2. Ve a Table Editor"
echo "3. Revisa que las tablas tengan datos"
echo ""
echo "O ejecuta esta query en SQL Editor:"
echo ""
echo "SELECT 'clients' as tabla, COUNT(*) as registros FROM public.clients"
echo "UNION ALL SELECT 'trips', COUNT(*) FROM public.trips"
echo "UNION ALL SELECT 'sold_trips', COUNT(*) FROM public.sold_trips"
echo "UNION ALL SELECT 'trip_services', COUNT(*) FROM public.trip_services;"
echo ""

echo -e "${GREEN}🎉 ¡Proceso completado exitosamente!${NC}"
echo ""
