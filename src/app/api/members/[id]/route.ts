import { requireAuth } from "@/lib/require-auth";
import { getSupabaseClient } from "@/lib/supabase";
import { memberUpdateSchema } from "@/lib/schemas/member";
import { NextResponse } from "next/server";

const MEMBER_ID_RE = /^\d+$/;

function validateId(id: string) {
  if (!MEMBER_ID_RE.test(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const idError = validateId(id);
  if (idError) return idError;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const idError = validateId(id);
  if (idError) return idError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = memberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Only pass fields that were actually provided — avoids touching columns
  // that may not exist yet (e.g. notes before migration 003 is applied).
  const updateData = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("members")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const idError = validateId(id);
  if (idError) return idError;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

