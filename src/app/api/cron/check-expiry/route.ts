import { getSupabaseClient } from "@/lib/supabase";
import { sendExpiryDigest, ExpiryMemberInfo } from "@/lib/email";
import { NextResponse } from "next/server";
import { format, addDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const warningDays = Number(process.env.EXPIRY_WARNING_DAYS ?? 3);
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const warningDateStr = format(addDays(today, warningDays), "yyyy-MM-dd");

  try {
    const supabase = getSupabaseClient();
    // Fetch members expiring today or in warningDays
    const { data: members, error } = await supabase
      .from("members")
      .select("id, full_name, phone, fee_amount, expires_at")
      .in("expires_at", [todayStr, warningDateStr]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: Record<string, string> = {};

    for (const type of ["expired", "warning"] as const) {
      const targetDate = type === "expired" ? todayStr : warningDateStr;
      const eligible = members?.filter((m) => m.expires_at === targetDate) ?? [];

      if (eligible.length === 0) {
        results[type] = "no members";
        continue;
      }

      // Check which ones haven't been notified yet
      const memberIds = eligible.map((m) => m.id);
      const { data: alreadyNotified } = await supabase
        .from("notification_log")
        .select("member_id")
        .eq("notification_type", type)
        .eq("notified_for_date", targetDate)
        .in("member_id", memberIds);

      const notifiedIds = new Set(
        (alreadyNotified ?? []).map((n: { member_id: string }) => n.member_id)
      );
      const toNotify = eligible.filter((m) => !notifiedIds.has(m.id));

      if (toNotify.length === 0) {
        results[type] = "already notified";
        continue;
      }

      // Send digest email
      await sendExpiryDigest(toNotify as ExpiryMemberInfo[], type);

      // Log notifications
      await supabase.from("notification_log").insert(
        toNotify.map((m) => ({
          member_id: m.id,
          notification_type: type,
          notified_for_date: targetDate,
        }))
      );

      results[type] = `notified ${toNotify.length} member(s)`;
    }

    return NextResponse.json({ ok: true, date: todayStr, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
