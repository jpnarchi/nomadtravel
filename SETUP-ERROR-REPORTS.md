# Setup del Sistema de Reporte de Errores

## Pasos para configurar en Supabase

### 1. Crear la tabla `error_reports`

Ve al **SQL Editor** en tu dashboard de Supabase y ejecuta este query:

```sql
-- Create error_reports table
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  reported_by VARCHAR(255) NOT NULL,
  reporter_email VARCHAR(255) NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_error_reports_created_date ON error_reports(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_reported_by ON error_reports(reported_by);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER error_reports_updated_at
  BEFORE UPDATE ON error_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_error_reports_updated_at();
```

### 2. Configurar Row Level Security (RLS)

Ejecuta este query en el SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read error reports
CREATE POLICY "Allow authenticated users to read error reports"
  ON error_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert error reports
CREATE POLICY "Allow authenticated users to insert error reports"
  ON error_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to update error reports (for status changes)
CREATE POLICY "Allow authenticated users to update error reports"
  ON error_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 3. Crear Storage Bucket para capturas de pantalla

#### Opción A: Desde la UI de Supabase (RECOMENDADO)

1. Ve a **Storage** en el menú lateral
2. Click en **New bucket**
3. Nombre del bucket: `error-reports`
4. Marca como **Public bucket** ✅
5. Click en **Create bucket**

#### Opción B: Desde SQL Editor

```sql
-- Create storage bucket for error report screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('error-reports', 'error-reports', true)
ON CONFLICT (id) DO NOTHING;
```

### 4. Configurar políticas de Storage

Ve a **Storage** → **Policies** (para el bucket `error-reports`) y ejecuta en el SQL Editor:

```sql
-- Allow authenticated users to upload screenshots
CREATE POLICY "Allow authenticated users to upload error screenshots"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'error-reports');

-- Allow public read access to screenshots
CREATE POLICY "Allow public read access to error screenshots"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'error-reports');

-- Allow authenticated users to delete screenshots
CREATE POLICY "Allow authenticated users to delete error screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'error-reports');
```

## Verificar instalación

Una vez que hayas ejecutado todos los scripts, verifica que:

1. ✅ La tabla `error_reports` existe en **Database** → **Tables**
2. ✅ El bucket `error-reports` existe en **Storage** y es público
3. ✅ Las políticas de RLS están activas en ambos lugares

## Acceso a la página

Una vez configurado, puedes acceder a:
- **Ver reportes**: `http://localhost:5173/ErrorReports` (solo accesible via URL directa, no está en el nav)
- **Reportar error**: Botón rojo "Reportar Error" en la esquina superior derecha de todas las páginas

## Troubleshooting

Si sigues teniendo errores de "row-level security policy":

1. Verifica que las políticas de RLS estén creadas correctamente
2. Asegúrate de que el bucket `error-reports` sea público
3. Verifica que estés autenticado con Clerk
