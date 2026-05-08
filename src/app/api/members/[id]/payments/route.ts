import { requireAuth } from "@/lib/require-auth";
import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

const MEMBER_ID_RE = /^\d+$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!MEMBER_ID_RE.test(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, member_id, fee_amount, paid_at, expires_at, created_at")
    .eq("member_id", id)
    .order("paid_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  return NextResponse.json(data ?? []);
}
