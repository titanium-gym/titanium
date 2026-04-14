import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type Member = {
  id: string;
  full_name: string;
  phone: string | null;
  fee_amount: number;
  paid_at: string;
  expires_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationLog = {
  id: string;
  member_id: string;
  notification_type: "warning" | "expired";
  notified_for_date: string;
  sent_at: string;
};
