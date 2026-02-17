-- Add file_number field to sold_trips for easy trip identification
-- Format: NMD-YYYY-NNN (e.g. NMD-2026-001)

ALTER TABLE public.sold_trips
  ADD COLUMN IF NOT EXISTS file_number TEXT;

-- Create a sequence for file numbers
CREATE SEQUENCE IF NOT EXISTS sold_trips_file_number_seq START 1;

-- Function to generate the next file number in format NMD-YYYY-NNN
CREATE OR REPLACE FUNCTION generate_file_number()
RETURNS TEXT AS $$
DECLARE
  year_str TEXT;
  seq_val  INTEGER;
BEGIN
  year_str := to_char(NOW(), 'YYYY');
  seq_val  := nextval('sold_trips_file_number_seq');
  RETURN 'NMD-' || year_str || '-' || lpad(seq_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign file_number on insert if not provided
CREATE OR REPLACE FUNCTION set_file_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.file_number IS NULL OR NEW.file_number = '' THEN
    NEW.file_number := generate_file_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_file_number ON public.sold_trips;
CREATE TRIGGER trigger_set_file_number
  BEFORE INSERT ON public.sold_trips
  FOR EACH ROW
  EXECUTE FUNCTION set_file_number();

-- Backfill existing records that don't have a file_number (ordered by created_date)
UPDATE public.sold_trips
SET file_number = generate_file_number()
WHERE id IN (
  SELECT id FROM public.sold_trips
  WHERE file_number IS NULL
  ORDER BY created_date ASC
);

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_sold_trips_file_number
  ON public.sold_trips (file_number)
  WHERE file_number IS NOT NULL;
