-- =================================================================
-- ACTUALIZACIÓN DE TABLA SUPPLIERS
-- =================================================================
-- Este script actualiza la tabla suppliers para que coincida
-- con los campos que usa el formulario SupplierForm.jsx
-- =================================================================

-- Agregar columnas nuevas que faltan
ALTER TABLE suppliers
  -- Información básica actualizada
  ADD COLUMN IF NOT EXISTS type TEXT, -- dmc, hotel_directo, cadena_hotelera, etc.
  ADD COLUMN IF NOT EXISTS representative_agency_id UUID REFERENCES suppliers(id),

  -- Contactos estructurados (contacto 1 y 2)
  ADD COLUMN IF NOT EXISTS contact1_name TEXT,
  ADD COLUMN IF NOT EXISTS contact1_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact1_email TEXT,
  ADD COLUMN IF NOT EXISTS contact2_name TEXT,
  ADD COLUMN IF NOT EXISTS contact2_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact2_email TEXT,

  -- Notas internas
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,

  -- Destinos y servicios (arrays de texto)
  ADD COLUMN IF NOT EXISTS destinations TEXT[],
  ADD COLUMN IF NOT EXISTS services TEXT[],

  -- Comisiones
  ADD COLUMN IF NOT EXISTS commission TEXT, -- Texto libre como "10-15%"
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',

  -- Tiempos de respuesta
  ADD COLUMN IF NOT EXISTS response_time TEXT,

  -- Links y portales
  ADD COLUMN IF NOT EXISTS agent_portal TEXT,
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS documents_folder TEXT,

  -- Operativa
  ADD COLUMN IF NOT EXISTS payment_methods TEXT[], -- Array de métodos de pago
  ADD COLUMN IF NOT EXISTS policies TEXT,
  ADD COLUMN IF NOT EXISTS business_hours TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_time TEXT,

  -- Historial y evaluación
  ADD COLUMN IF NOT EXISTS team_comments TEXT,
  ADD COLUMN IF NOT EXISTS issues TEXT;

-- Agregar columna created_by si no tiene valor por defecto
ALTER TABLE suppliers ALTER COLUMN created_by DROP NOT NULL;

-- Migrar datos existentes si es necesario
-- Si ya tenías datos en columnas antiguas, migra aquí:
UPDATE suppliers
SET
  contact1_name = COALESCE(contact1_name, contact_name),
  contact1_email = COALESCE(contact1_email, email),
  contact1_phone = COALESCE(contact1_phone, phone),
  type = COALESCE(type, category),
  internal_notes = COALESCE(internal_notes, notes)
WHERE contact1_name IS NULL OR contact1_email IS NULL OR contact1_phone IS NULL OR type IS NULL;

-- Hacer NOT NULL los campos críticos (solo si ya tienes datos migrados)
-- ALTER TABLE suppliers ALTER COLUMN type SET NOT NULL;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(type);
CREATE INDEX IF NOT EXISTS idx_suppliers_representative_agency_id ON suppliers(representative_agency_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_destinations ON suppliers USING GIN(destinations);
CREATE INDEX IF NOT EXISTS idx_suppliers_services ON suppliers USING GIN(services);

-- Agregar comentarios para documentación
COMMENT ON COLUMN suppliers.type IS 'Tipo de proveedor: dmc, hotel_directo, cadena_hotelera, aerolinea, plataforma, transporte, tours, agencia_representante, otro';
COMMENT ON COLUMN suppliers.representative_agency_id IS 'ID de la agencia representante si aplica';
COMMENT ON COLUMN suppliers.destinations IS 'Array de destinos donde opera el proveedor';
COMMENT ON COLUMN suppliers.services IS 'Array de servicios que ofrece';
COMMENT ON COLUMN suppliers.payment_methods IS 'Array de métodos de pago aceptados';

-- =================================================================
-- RESULTADO ESPERADO:
-- - Tabla suppliers actualizada con todos los campos necesarios
-- - Datos migrados de campos antiguos a nuevos
-- - Índices creados para mejor rendimiento
-- =================================================================
