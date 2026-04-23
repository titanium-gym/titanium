-- =============================================================================
-- drop-all.sql
-- Borra TODA la base de datos (tablas, triggers, funciones)
-- ⚠️ DESTRUCTIVO - Úsalo solo si sabes qué haces
-- =============================================================================

-- Borrar tabla dependiente primero (notification_log)
DROP TABLE IF EXISTS notification_log CASCADE;

-- Deshabilitar RLS en members
ALTER TABLE IF EXISTS members DISABLE ROW LEVEL SECURITY;

-- Borrar políticas de RLS
DROP POLICY IF EXISTS public_read_members ON members;
DROP POLICY IF EXISTS authenticated_insert_members ON members;
DROP POLICY IF EXISTS authenticated_update_members ON members;
DROP POLICY IF EXISTS authenticated_delete_members ON members;

-- Borrar triggers
DROP TRIGGER IF EXISTS update_members_updated_at ON members;

-- Borrar tabla members
DROP TABLE IF EXISTS members CASCADE;

-- Borrar funciones
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Confirmación
SELECT 'Base de datos limpiada - listo para reconstruir ✅' as status;
