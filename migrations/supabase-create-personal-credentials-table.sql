-- ============================================
-- TABLA: personal_credentials
-- ============================================
-- Script para crear la tabla de contraseñas personales
-- Ejecuta este script en el SQL Editor de Supabase

-- Eliminar tabla si existe (solo para desarrollo)
DROP TABLE IF EXISTS public.personal_credentials CASCADE;

-- Crear tabla personal_credentials
CREATE TABLE public.personal_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Nombre del servicio (Netflix, Gmail, etc.)
  category TEXT NOT NULL, -- banco, tarjeta_credito, red_social, email, streaming, compras, trabajo, salud, gobierno, educacion, otro
  website TEXT, -- URL del sitio
  username TEXT, -- Usuario o email
  password TEXT, -- Contraseña (en texto plano por ahora)
  notes TEXT, -- Notas privadas
  security_question TEXT, -- Pregunta de seguridad
  security_answer TEXT, -- Respuesta de seguridad
  created_by TEXT NOT NULL, -- Email del usuario que creó el registro (para privacidad)
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Crear índices para mejorar búsquedas
CREATE INDEX idx_personal_credentials_created_by ON public.personal_credentials(created_by);
CREATE INDEX idx_personal_credentials_category ON public.personal_credentials(category);
CREATE INDEX idx_personal_credentials_name ON public.personal_credentials(name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- NOTA: RLS está deshabilitado porque esta app usa Clerk para autenticación
-- La privacidad se maneja filtrando por created_by en el código de la app
ALTER TABLE public.personal_credentials DISABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGER PARA UPDATED_DATE
-- ============================================

-- Aplicar trigger para actualizar updated_date automáticamente
CREATE TRIGGER update_personal_credentials_updated_date
  BEFORE UPDATE ON public.personal_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- ============================================
-- FINALIZADO
-- ============================================
-- La tabla personal_credentials está lista para usar
-- Esta tabla guarda contraseñas PERSONALES de cada usuario
-- Solo el usuario que creó cada registro puede verlo (filtrado por created_by)
