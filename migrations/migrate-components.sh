#!/bin/bash

# Script para migrar componentes de base44 a Supabase

find src/components -name "*.jsx" -o -name "*.js" | while read file; do
  # Reemplazar import de base44Client por supabaseClient
  sed -i '' "s/import { base44 } from '@\/api\/base44Client';/import { supabaseAPI } from '@\/api\/supabaseClient';/g" "$file"

  # Reemplazar import de AuthContext por SupabaseAuthContext
  sed -i '' "s/import { useAuth } from '@\/lib\/AuthContext';/import { useAuth } from '@\/lib\/SupabaseAuthContext';/g" "$file"

  # Reemplazar todas las llamadas base44.entities por supabaseAPI.entities
  sed -i '' 's/base44\.entities\./supabaseAPI.entities./g' "$file"
done

echo "✅ Componentes actualizados"
