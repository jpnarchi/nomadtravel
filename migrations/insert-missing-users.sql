-- ============================================
-- Migration: Insert missing users from trips
-- ============================================
-- Execute this in Supabase SQL Editor

-- Insert users that exist in trips.created_by but not in users table
INSERT INTO public.users (id, email, full_name, role, custom_role)
VALUES
  (gen_random_uuid(), 'alejandra.garza@nomadtravel.mx', 'Alejandra Garza', 'user', NULL),
  (gen_random_uuid(), 'alicia.rdz@nomadtravel.mx', 'Alicia Rodríguez', 'user', NULL),
  (gen_random_uuid(), 'anapau.delateja@nomadtravel.mx', 'Ana Paula de la Teja', 'user', NULL),
  (gen_random_uuid(), 'andrea.lozano@nomadtravel.mx', 'Andrea Lozano', 'user', NULL),
  (gen_random_uuid(), 'christel.belden@nomadtravel.mx', 'Christel Belden', 'user', NULL),
  (gen_random_uuid(), 'claudia.camarillo@nomadtravel.mx', 'Claudia Camarillo', 'user', NULL),
  (gen_random_uuid(), 'jimena.obregon@nomadtravel.mx', 'Jimena Obregón', 'user', NULL),
  (gen_random_uuid(), 'jimena.villarreal@nomadtravel.mx', 'Jimena Villarreal', 'user', NULL),
  (gen_random_uuid(), 'maria.salinas@nomadtravel.mx', 'María Salinas', 'user', NULL),
  (gen_random_uuid(), 'mauricio.gutierrez@nomadtravel.mx', 'Mauricio Gutiérrez', 'user', NULL),
  (gen_random_uuid(), 'natalia.palma@nomadtravel.mx', 'Natalia Palma', 'user', NULL),
  (gen_random_uuid(), 'paulina.yutani@nomadtravel.mx', 'Paulina Yutani', 'user', NULL),
  (gen_random_uuid(), 'priscila.trevino@nomadtravel.mx', 'Priscila Treviño', 'user', NULL),
  (gen_random_uuid(), 'rodrigo.deandres@nomadtravel.mx', 'Rodrigo de Andrés', 'user', NULL),
  (gen_random_uuid(), 'valeria.munoz@nomadtravel.mx', 'Valeria Muñoz', 'user', NULL),
  (gen_random_uuid(), 'narchijuanpablo@gmail.com', 'Juan Pablo Narchi', 'admin', NULL),
  (gen_random_uuid(), 'terrenomomo@gmail.com', 'Terreno Momo', 'user', NULL),
  (gen_random_uuid(), 'a01781518@tec.mx', 'Usuario Tec', 'user', NULL)
ON CONFLICT (email) DO NOTHING;

-- Verify the insert
SELECT
  email,
  full_name,
  role
FROM users
ORDER BY email;
