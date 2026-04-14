-- =============================================================================
-- schema.sql — Canonical idempotent schema for Titanium
--
-- Safe to run multiple times on any Supabase instance (fresh or existing).
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================


-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  phone       TEXT,
  fee_amount  NUMERIC(8,2) NOT NULL,
  paid_at     DATE NOT NULL,
  expires_at  DATE NOT NULL,
  notes       TEXT,
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
-- ---------------------------------------------------------------------------

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- COLUMNS — add if not present (idempotent)
-- ---------------------------------------------------------------------------

ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;


-- ---------------------------------------------------------------------------
-- FEE CONSTRAINT — drop any existing variant, recreate canonical
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Validate existing data before adding constraint
  IF EXISTS (SELECT 1 FROM members WHERE fee_amount NOT IN (30, 35)) THEN
    RAISE EXCEPTION 'Dirty data: fee_amount values outside (30, 35) exist. Fix data first.';
  END IF;

  -- Drop all check constraints on fee_amount (any name)
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'members'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%fee_amount%'
  LOOP
    EXECUTE format('ALTER TABLE members DROP CONSTRAINT %I', r.conname);
  END LOOP;

  -- Add canonical constraint
  ALTER TABLE members
    ADD CONSTRAINT members_fee_amount_check CHECK (fee_amount IN (30, 35));
END $$;


-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- TRIGGER — guard against duplicate
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
