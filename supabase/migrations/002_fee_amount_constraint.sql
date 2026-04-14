-- Migration: restrict fee_amount to allowed values (30, 35)
-- Run this in Supabase SQL Editor if you already applied migration 001
--
-- NOTE: For fresh Supabase instances use 000_consolidated.sql instead.
-- This file is kept for historical reference only.
--
-- Before running, verify existing constraint names with:
--   SELECT conname FROM pg_constraint WHERE conrelid = 'members'::regclass AND contype = 'c';

BEGIN;

  -- Abort if any existing row violates the new constraint
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM members WHERE fee_amount NOT IN (30, 35)) THEN
      RAISE EXCEPTION 'Dirty data found: some rows have fee_amount outside (30, 35). Fix data before running this migration.';
    END IF;
  END $$;

  -- Drop any existing check constraints on fee_amount (handles both named and auto-named variants)
  DO $$
  DECLARE
    r RECORD;
  BEGIN
    FOR r IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'members'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%fee_amount%'
    LOOP
      EXECUTE format('ALTER TABLE members DROP CONSTRAINT %I', r.conname);
    END LOOP;
  END $$;

  ALTER TABLE members
    ADD CONSTRAINT members_fee_amount_check CHECK (fee_amount IN (30, 35));

COMMIT;
