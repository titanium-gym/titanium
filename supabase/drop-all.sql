-- =============================================================================
-- drop-all.sql
-- ⚠️  DESTRUCTIVE SCRIPT — drops ALL tables, triggers, and functions
-- Run ONLY in local dev. NEVER run against production.
-- Double-check your connection string before executing.
-- NOTE: notification_log table was removed (cron/email feature deleted).
--       If it still exists in your DB, this script will drop it too.
-- =============================================================================

-- Borrar tablas dependientes primero (FK a members)
DROP TABLE IF EXISTS notification_log CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

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
