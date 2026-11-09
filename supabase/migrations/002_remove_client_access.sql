-- =============================================================================
-- 002: Remove database access for Supabase client roles
-- =============================================================================
-- The app only reaches the database from the server with service_role, which
-- has its own grants and bypasses RLS. The anon and authenticated roles are
-- unused, so they get no policies and no table privileges.
-- Run manually in the Supabase SQL Editor, after 001_complete_schema.sql.

BEGIN;

DROP POLICY IF EXISTS public_read_members ON members;
DROP POLICY IF EXISTS authenticated_insert_members ON members;
DROP POLICY IF EXISTS authenticated_update_members ON members;
DROP POLICY IF EXISTS authenticated_delete_members ON members;
DROP POLICY IF EXISTS payments_select ON payments;
DROP POLICY IF EXISTS payments_insert ON payments;

REVOKE ALL ON TABLE members, payments FROM anon, authenticated;

COMMIT;
