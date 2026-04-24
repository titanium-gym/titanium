import { requireAuth } from "@/lib/require-auth";
import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { z } from "zod";

const MIN_DAYS = 7;
const MAX_DAYS = 3650;

const daysSchema = z
  .number()
  .int("Debe ser un número entero")
  .min(MIN_DAYS, `Mínimo ${MIN_DAYS} días`)
  .max(MAX_DAYS, `Máximo ${MAX_DAYS} días`);

function thresholdDate(days: number): string {
  return format(subDays(new Date(), days), "yyyy-MM-dd");
}

/** GET /api/members/purge?days=N — preview affected members */
export async function GET(req: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const raw = Number(searchParams.get("days"));
  const parsed = daysSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, full_name, expires_at, phone")
    .lt("expires_at", thresholdDate(parsed.data))
    .order("expires_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Error al consultar socios" }, { status: 500 });

  return NextResponse.json({ members: data ?? [], count: (data ?? []).length });
}

/** POST /api/members/purge — execute deletion */
export async function POST(req: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = z.object({ days: daysSchema }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const threshold = thresholdDate(parsed.data.days);
  const supabase = getSupabaseClient();

  // Fetch IDs first so we can return the exact count deleted
  const { data: targets, error: fetchErr } = await supabase
    .from("members")
    .select("id")
    .lt("expires_at", threshold);

  if (fetchErr) return NextResponse.json({ error: "Error al consultar socios" }, { status: 500 });

  const count = (targets ?? []).length;
  if (count === 0) return NextResponse.json({ deleted: 0 });

  const { error: delErr } = await supabase
    .from("members")
    .delete()
    .lt("expires_at", threshold);

  if (delErr) return NextResponse.json({ error: "Error al eliminar socios" }, { status: 500 });

  return NextResponse.json({ deleted: count });
}
