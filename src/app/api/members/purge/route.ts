import { requireAuth } from "@/lib/require-auth";
import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { z } from "zod";
import { daysSchema } from "@/lib/utils/purge";

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
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, full_name, expires_at")
    .lte("expires_at", thresholdDate(parsed.data))
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
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const threshold = thresholdDate(parsed.data.days);
  const supabase = getSupabaseClient();

  // Single atomic DELETE ... WHERE ... RETURNING — avoids the race where a
  // member gets renewed between a separate "select ids" step and the delete
  // that would otherwise remove them anyway.
  const { data: deleted, error: delErr } = await supabase
    .from("members")
    .delete()
    .lte("expires_at", threshold)
    .select("id");

  if (delErr) return NextResponse.json({ error: "Error al eliminar socios" }, { status: 500 });

  return NextResponse.json({ deleted: (deleted ?? []).length });
}
