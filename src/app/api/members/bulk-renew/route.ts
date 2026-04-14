import { auth } from "@/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { format, addMonths } from "date-fns";
import { z } from "zod";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bulkRenewSchema = z.object({
  ids: z
    .array(z.string().regex(UUID_RE, "Invalid UUID"))
    .min(1, "At least one id required")
    .max(200, "Too many ids"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bulkRenewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids } = parsed.data;
  const today = format(new Date(), "yyyy-MM-dd");
  const newExpiry = format(addMonths(new Date(), 1), "yyyy-MM-dd");

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("members")
    .update({ paid_at: today, expires_at: newExpiry })
    .in("id", ids)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: data });
}
