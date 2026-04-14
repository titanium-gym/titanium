-- Migration: initial schema
-- Run this in Supabase SQL Editor
--
-- NOTE: For fresh Supabase instances use 000_consolidated.sql instead.
-- This file is kept for historical reference only.

CREATE TABLE IF NOT EXISTS members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  phone       TEXT,
  fee_amount  NUMERIC(8,2) NOT NULL CHECK (fee_amount IN (30, 35)),
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

-- Enable RLS on both tables (service_role bypasses RLS by default)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on members
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
