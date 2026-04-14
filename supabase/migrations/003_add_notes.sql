-- Migration: add notes field to members
-- Run this in Supabase SQL Editor
--
-- NOTE: For fresh Supabase instances use 000_consolidated.sql instead.
-- This file is kept for historical reference only.

ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;
