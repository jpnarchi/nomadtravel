-- =================================================================
-- ACTUALIZACIÓN DE TABLA REVIEWS
-- =================================================================
-- Actualiza la tabla reviews para incluir todos los campos
-- que usa ReviewForm.jsx
-- =================================================================

-- Agregar columnas nuevas que faltan
ALTER TABLE reviews
  -- Información básica del review
  ADD COLUMN IF NOT EXISTS content_type TEXT, -- 'fam_trip', 'proveedor', 'hotel', 'destino', etc.
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS hotel_chain TEXT,
  ADD COLUMN IF NOT EXISTS cruise_line TEXT,
  ADD COLUMN IF NOT EXISTS provider_name TEXT,
  ADD COLUMN IF NOT EXISTS experience_date DATE,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,

  -- FAM Trip específico
  ADD COLUMN IF NOT EXISTS fam_type TEXT, -- 'hotelero', 'dmc', 'aerolinea', etc.
  ADD COLUMN IF NOT EXISTS fam_details JSONB, -- Array de detalles del FAM

  -- Contenido del review
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS pros TEXT,
  ADD COLUMN IF NOT EXISTS cons TEXT,
  ADD COLUMN IF NOT EXISTS tips TEXT,
  ADD COLUMN IF NOT EXISTS destination_tips TEXT,

  -- Rating y recomendación
  ADD COLUMN IF NOT EXISTS recommended TEXT, -- 'si', 'no', 'depende'

  -- Archivos
  ADD COLUMN IF NOT EXISTS pdf_files TEXT[], -- URLs de PDFs
  ADD COLUMN IF NOT EXISTS images TEXT[]; -- URLs de imágenes

-- Migrar datos de columna antigua 'content' a 'description' si existe
UPDATE reviews
SET description = COALESCE(description, content)
WHERE description IS NULL AND content IS NOT NULL;

-- Hacer created_by nullable si es necesario
ALTER TABLE reviews ALTER COLUMN created_by DROP NOT NULL;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reviews_content_type ON reviews(content_type);
CREATE INDEX IF NOT EXISTS idx_reviews_country ON reviews(country);
CREATE INDEX IF NOT EXISTS idx_reviews_hotel_chain ON reviews(hotel_chain);
CREATE INDEX IF NOT EXISTS idx_reviews_cruise_line ON reviews(cruise_line);
CREATE INDEX IF NOT EXISTS idx_reviews_fam_type ON reviews(fam_type);
CREATE INDEX IF NOT EXISTS idx_reviews_recommended ON reviews(recommended);

-- Comentarios para documentación
COMMENT ON COLUMN reviews.content_type IS 'Tipo de contenido: fam_trip, proveedor, hotel, destino, aerolinea, crucero, experiencia, otro';
COMMENT ON COLUMN reviews.fam_type IS 'Tipo de FAM Trip: hotelero, dmc, aerolinea, destino, crucero, mixto';
COMMENT ON COLUMN reviews.fam_details IS 'Array JSONB con detalles de cada componente del FAM Trip';
COMMENT ON COLUMN reviews.pdf_files IS 'Array de URLs de archivos PDF en Supabase Storage';
COMMENT ON COLUMN reviews.images IS 'Array de URLs de imágenes en Supabase Storage';
COMMENT ON COLUMN reviews.recommended IS 'Recomendado para clientes: si, no, depende';

-- =================================================================
-- RESULTADO ESPERADO:
-- - Tabla reviews actualizada con todos los campos
-- - Datos migrados de columnas antiguas
-- - Índices creados para mejor rendimiento
-- =================================================================
