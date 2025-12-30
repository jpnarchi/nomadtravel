-- =================================================================
-- CREACIÓN DE TABLA LEARNING MATERIALS
-- =================================================================
-- Tabla para almacenar materiales de aprendizaje (guías, manuales,
-- presentaciones, videos, PDFs, etc.) para el equipo
-- =================================================================

CREATE TABLE IF NOT EXISTS public.learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'guia', 'manual', 'presentacion', 'video', 'link', 'pdf', 'notas', 'otro'
  destination TEXT, -- Destino relacionado (opcional)
  provider_type TEXT DEFAULT 'general', -- 'general', 'dmc', 'hotel', 'aerolinea', 'transporte', 'cruise', 'experiencia', 'otro'
  description TEXT,
  external_link TEXT, -- URL externa (YouTube, Google Drive, etc.)
  pdf_files TEXT[], -- Array de URLs de PDFs en Supabase Storage
  images TEXT[], -- Array de URLs de imágenes en Supabase Storage
  tags TEXT[], -- Tags para búsqueda
  is_deleted BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_learning_materials_category ON public.learning_materials(category);
CREATE INDEX IF NOT EXISTS idx_learning_materials_destination ON public.learning_materials(destination);
CREATE INDEX IF NOT EXISTS idx_learning_materials_provider_type ON public.learning_materials(provider_type);
CREATE INDEX IF NOT EXISTS idx_learning_materials_tags ON public.learning_materials USING GIN(tags);

-- Comentarios para documentación
COMMENT ON TABLE public.learning_materials IS 'Materiales de aprendizaje para el equipo (guías, manuales, presentaciones, etc.)';
COMMENT ON COLUMN public.learning_materials.category IS 'Tipo de material: guia, manual, presentacion, video, link, pdf, notas, otro';
COMMENT ON COLUMN public.learning_materials.destination IS 'Destino relacionado con el material (opcional)';
COMMENT ON COLUMN public.learning_materials.provider_type IS 'Tipo de proveedor relacionado: general, dmc, hotel, aerolinea, etc.';
COMMENT ON COLUMN public.learning_materials.pdf_files IS 'Array de URLs de archivos PDF almacenados en Supabase Storage';
COMMENT ON COLUMN public.learning_materials.images IS 'Array de URLs de imágenes almacenadas en Supabase Storage';
COMMENT ON COLUMN public.learning_materials.tags IS 'Array de tags para facilitar búsqueda y categorización';

-- =================================================================
-- RESULTADO ESPERADO:
-- - Tabla learning_materials creada
-- - Índices para búsqueda optimizada
-- - Estructura compatible con LearningForm.jsx
-- =================================================================
