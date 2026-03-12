import { NextResponse } from "next/server";

import { payloadToInsertRow, rowToItem } from "@/lib/item-mappers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CreateItemPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(rowToItem));
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateItemPayload;
  const row = payloadToInsertRow(payload);

  const { data, error } = await supabaseAdmin
    .from("items")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(rowToItem(data));
}