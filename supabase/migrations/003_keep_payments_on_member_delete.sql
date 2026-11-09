-- =============================================================================
-- 003: Keep payments when a member is deleted
-- =============================================================================
-- Deleting a member used to cascade to its payments and erase historical
-- income. Payments now stay, anonymized, with member_id set to NULL.
-- Run manually in the Supabase SQL Editor, after 002_remove_client_access.sql.

BEGIN;

ALTER TABLE payments ALTER COLUMN member_id DROP NOT NULL;

ALTER TABLE payments DROP CONSTRAINT payments_member_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

COMMIT;
