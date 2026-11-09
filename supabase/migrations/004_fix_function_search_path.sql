-- =============================================================================
-- 004: Pin the search_path of trigger functions
-- =============================================================================
-- Fixes the Supabase "function_search_path_mutable" warning. The function body
-- only uses pg_catalog, which is always searched. update_updated_at had no
-- trigger attached, so it is removed instead.
-- Run manually in the Supabase SQL Editor, after 003_keep_payments_on_member_delete.sql.

BEGIN;

ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

DROP FUNCTION IF EXISTS public.update_updated_at();

COMMIT;
