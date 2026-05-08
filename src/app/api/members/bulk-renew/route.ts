import { requireAuth } from "@/lib/require-auth";
import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { z } from "zod";
import { nextMonthSameDay } from "@/lib/utils/date";

const bulkRenewSchema = z.object({
  ids: z
    .array(z.string().regex(/^\d+$/, "Invalid id"))
    .min(1, "At least one id required")
    .max(200, "Too many ids"),
});

export async function POST(req: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bulkRenewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { ids } = parsed.data;
  const today = format(new Date(), "yyyy-MM-dd");
  const supabase = getSupabaseClient();

  // Fetch current expires_at to preserve prepaid time
  const { data: members, error: fetchErr } = await supabase
    .from("members")
    .select("id, expires_at")
    .in("id", ids);

  if (fetchErr) return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });

  // Renew each member using MAX(expires_at, today) as the base
  const updates = await Promise.all(
    (members ?? []).map((member) => {
      const base = member.expires_at > today ? member.expires_at : today;
      const newExpiry = nextMonthSameDay(base);
      return supabase
        .from("members")
        .update({ paid_at: today, expires_at: newExpiry })
        .eq("id", member.id)
        .select()
        .single();
    })
  );

  const failed = updates.filter((u) => u.error);
  if (failed.length > 0) {
    return NextResponse.json({ error: "Failed to renew some members" }, { status: 500 });
  }

  const renewed = updates.map((u) => u.data!);

  // Register payments in history (best-effort)
  await supabase.from("payments").insert(
    renewed.map((m) => ({
      member_id: m.id,
      fee_amount: m.fee_amount,
      paid_at: m.paid_at,
      expires_at: m.expires_at,
    }))
  );

  return NextResponse.json({ updated: renewed });
}
