-- ============================================
-- FIX: trip_services table schema
-- ============================================
-- Este script verifica y corrige la tabla trip_services
-- para asegurar que tiene la estructura correcta

-- Primero, verificar si la tabla existe y su estructura
DO $$
BEGIN
    -- Si la tabla no existe, crearla
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trip_services') THEN
        CREATE TABLE public.trip_services (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sold_trip_id UUID REFERENCES public.sold_trips(id) ON DELETE CASCADE,
            service_type TEXT NOT NULL,
            service_name TEXT NOT NULL,
            supplier_name TEXT,
            cost DECIMAL(10,2) DEFAULT 0,
            price DECIMAL(10,2) DEFAULT 0,
            commission DECIMAL(10,2) DEFAULT 0,
            paid_to_agent BOOLEAN DEFAULT false,
            payment_date DATE,
            start_date DATE,
            end_date DATE,
            notes TEXT,
            is_deleted BOOLEAN DEFAULT false,
            created_date TIMESTAMPTZ DEFAULT NOW(),
            updated_date TIMESTAMPTZ DEFAULT NOW(),
            created_by TEXT NOT NULL,
            metadata JSONB
        );

        RAISE NOTICE 'Table trip_services created successfully';
    ELSE
        RAISE NOTICE 'Table trip_services already exists';
    END IF;

    -- Asegurar que existe el campo metadata (JSONB)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'trip_services'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.trip_services ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Added metadata column to trip_services';
    END IF;

    -- Verificar y eliminar columnas que no deberían existir
    -- Estas columnas deberían estar en metadata, no como columnas separadas
    DECLARE
        unwanted_columns TEXT[] := ARRAY[
            'booked_by', 'reservation_status', 'local_currency', 'local_amount',
            'total_price', 'vehicle', 'hotel_name', 'hotel_city', 'hotel_chain',
            'hotel_brand', 'hotel_chain_other', 'hotel_brand_other', 'check_in',
            'check_out', 'nights', 'room_type', 'num_rooms', 'meal_plan',
            'payment_due_date', 'reserved_by', 'reservation_number',
            'quote_exchange_rate', 'quote_date', 'payment_type'
        ];
        col TEXT;
    BEGIN
        FOREACH col IN ARRAY unwanted_columns
        LOOP
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'trip_services'
                AND column_name = col
            ) THEN
                -- Antes de eliminar, migrar datos existentes a metadata
                EXECUTE format('
                    UPDATE public.trip_services
                    SET metadata = COALESCE(metadata, ''{}''::jsonb) || jsonb_build_object(%L, %I)
                    WHERE %I IS NOT NULL
                ', col, col, col);

                -- Ahora eliminar la columna
                EXECUTE format('ALTER TABLE public.trip_services DROP COLUMN IF EXISTS %I', col);
                RAISE NOTICE 'Removed column % (data migrated to metadata)', col;
            END IF;
        END LOOP;
    END;

    -- Crear índice para el campo sold_trip_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'trip_services'
        AND indexname = 'idx_trip_services_sold_trip_id'
    ) THEN
        CREATE INDEX idx_trip_services_sold_trip_id ON public.trip_services(sold_trip_id);
        RAISE NOTICE 'Created index idx_trip_services_sold_trip_id';
    END IF;

    -- Crear trigger para updated_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_trip_services_updated_date'
    ) THEN
        CREATE TRIGGER update_trip_services_updated_date
            BEFORE UPDATE ON public.trip_services
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_date();
        RAISE NOTICE 'Created trigger update_trip_services_updated_date';
    END IF;

END $$;

-- Verificar la estructura final
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'trip_services'
ORDER BY ordinal_position;
