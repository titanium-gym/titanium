-- =============================================================================
-- 005: Keep-alive function for the anon role
-- =============================================================================
-- 002 revoked every table privilege from anon, so the keep-alive workflow got
-- HTTP 401 on its table reads. It now calls this function instead: it runs a
-- query on the database without exposing any data.
-- Run manually in the Supabase SQL Editor, after 004_fix_function_search_path.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.keep_alive()
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT 1;
$$;

REVOKE ALL ON FUNCTION public.keep_alive() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.keep_alive() TO anon;

COMMIT;

-- Make PostgREST expose the new function right away.
NOTIFY pgrst, 'reload schema';
