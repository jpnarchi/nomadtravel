#!/bin/bash

# Script para migrar todas las referencias de base44 a supabaseAPI

# Directorio de páginas
PAGES_DIR="src/pages"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Iniciando migración de base44 a Supabase...${NC}"
echo

# Función para procesar un archivo
process_file() {
  local file=$1
  local filename=$(basename "$file")

  echo -e "${GREEN}Procesando: $filename${NC}"

  # 1. Reemplazar import de base44Client por supabaseClient
  sed -i '' "s/import { base44 } from '@\/api\/base44Client';/import { supabaseAPI } from '@\/api\/supabaseClient';/g" "$file"

  # 2. Reemplazar import de AuthContext por SupabaseAuthContext
  sed -i '' "s/import { useAuth } from '@\/lib\/AuthContext';/import { useAuth } from '@\/lib\/SupabaseAuthContext';/g" "$file"

  # 3. Reemplazar todas las llamadas base44.entities por supabaseAPI.entities
  sed -i '' 's/base44\.entities\./supabaseAPI.entities./g' "$file"

  # 4. Reemplazar base44.auth.me() por useAuth hook
  # Este necesita manejo especial

  echo "  ✓ Actualizado"
}

# Procesar todos los archivos .jsx en src/pages
find "$PAGES_DIR" -name "*.jsx" -type f | while read file; do
  process_file "$file"
done

echo
echo -e "${GREEN}✅ Migración completada!${NC}"
echo
echo "Recuerda:"
echo "1. Revisar los archivos manualmente para verificar los cambios"
echo "2. Asegurarte de que las tablas en Supabase estén creadas"
echo "3. Configurar las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env"
