import { NextResponse } from "next/server";

import { rowToItem } from "@/lib/item-mappers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await context.params;
  const { buyerId, claimedPrice, claimQty } = (await request.json()) as {
    buyerId: string;
    claimedPrice: number;
    claimQty: number;
  };

  const quantityToClaim = Math.max(1, Number(claimQty) || 1);

  const { data: current, error: currentError } = await supabaseAdmin
    .from("items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (currentError || !current) {
    return NextResponse.json(
      { error: currentError?.message ?? "Item not found" },
      { status: 404 }
    );
  }

  const availableQty = Number(current.quantity);
  if (quantityToClaim > availableQty) {
    return NextResponse.json(
      { error: "Requested quantity exceeds available stock" },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  const nextQty = Math.max(0, availableQty - quantityToClaim);

  const { data, error } = await supabaseAdmin
    .from("items")
    .update({
      quantity: nextQty,
      status: nextQty === 0 ? "claimed" : "available",
      claimed_by: nextQty === 0 ? buyerId : null,
      claimed_at: nextQty === 0 ? nowIso : null,
      updated_at: nowIso,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update item" },
      { status: 500 }
    );
  }

  const { error: claimError } = await supabaseAdmin.from("claims").insert({
    item_id: itemId,
    buyer_id: buyerId,
    vendor_id: data.vendor_id,
    claimed_price: claimedPrice,
    status: "pending",
  });

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  return NextResponse.json(rowToItem(data));
}