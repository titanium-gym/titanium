-- =============================================================================
-- 000_consolidated.sql — Canonical single-file migration for fresh Supabase instances
--
-- This file consolidates migrations 001, 002, and 003 in the correct order.
-- It is fully idempotent and can be run multiple times on any Supabase instance
-- (fresh or already partially migrated) without errors.
--
-- Individual migration files (001–003) are kept for historical reference only.
-- For new environments, run this file instead.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- TABLES
-- (from 001_initial.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  phone       TEXT,
  fee_amount  NUMERIC(8,2) NOT NULL,
  paid_at     DATE NOT NULL,
  expires_at  DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('warning', 'expired')),
  notified_for_date DATE NOT NULL,
  sent_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (member_id, notification_type, notified_for_date)
);


-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- (from 001_initial.sql — enabling RLS is idempotent)
-- ---------------------------------------------------------------------------

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- NOTES COLUMN
-- (from 003_add_notes.sql — ADD COLUMN IF NOT EXISTS is natively idempotent)
-- ---------------------------------------------------------------------------

ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;


-- ---------------------------------------------------------------------------
-- FEE_AMOUNT CONSTRAINT
-- (from 002_fee_amount_constraint.sql)
-- Drop any existing check constraints on fee_amount, then recreate with the
-- canonical name. The DO block makes the whole operation idempotent.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- Abort if any existing row would violate the constraint before we add it.
  IF EXISTS (SELECT 1 FROM members WHERE fee_amount NOT IN (30, 35)) THEN
    RAISE EXCEPTION
      'Dirty data: some rows have fee_amount outside (30, 35). Fix data before running this migration.';
  END IF;

  -- Drop all check constraints on fee_amount (handles any name variant).
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
  END;

  -- Add the canonical constraint.
  ALTER TABLE members
    ADD CONSTRAINT members_fee_amount_check CHECK (fee_amount IN (30, 35));
END $$;


-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION
-- (from 001_initial.sql — CREATE OR REPLACE is natively idempotent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- TRIGGER
-- (from 001_initial.sql — guard via pg_trigger to avoid duplicate-trigger error)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'members_updated_at'
      AND tgrelid = 'members'::regclass
  ) THEN
    CREATE TRIGGER members_updated_at
      BEFORE UPDATE ON members
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
