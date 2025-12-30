-- ============================================
-- TABLA: credentials
-- ============================================
-- Script para crear/actualizar la tabla de credenciales
-- Ejecuta este script en el SQL Editor de Supabase

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS public.credentials CASCADE;

-- Crear tabla credentials con los campos correctos
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Nombre del sitio/servicio
  category TEXT NOT NULL, -- portal_agente, aerolinea, hotel, plataforma, dmc, consolidador, otro
  website TEXT, -- URL del sitio
  username TEXT, -- Usuario o email
  password TEXT, -- Contraseña (en texto plano por ahora, se puede encriptar después)
  agent_id TEXT, -- ID de agente o número de cuenta
  notes TEXT, -- Notas adicionales
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Crear índice para mejorar búsquedas
CREATE INDEX idx_credentials_category ON public.credentials(category);
CREATE INDEX idx_credentials_name ON public.credentials(name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- NOTA: RLS está deshabilitado porque esta app usa Clerk para autenticación
-- Si necesitas habilitar RLS en el futuro, ejecuta supabase-credentials-enable-rls.sql
ALTER TABLE public.credentials DISABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGER PARA UPDATED_DATE
-- ============================================

-- Aplicar trigger para actualizar updated_date automáticamente
CREATE TRIGGER update_credentials_updated_date
  BEFORE UPDATE ON public.credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- ============================================
-- FINALIZADO
-- ============================================
-- La tabla credentials está lista para usar
