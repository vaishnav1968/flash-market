import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch claims for this vendor with item name + buyer full name
  const { data, error } = await supabaseAdmin
    .from("claims")
    .select(
      `id, item_id, claimed_price, platform_fee, vendor_payout, claimed_at, status,
       items ( name ),
       users!claims_buyer_id_fkey ( full_name )`
    )
    .eq("vendor_id", user.id)
    .order("claimed_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = (data ?? []).map((row: any) => ({
    id: row.id as string,
    itemId: row.item_id as string,
    itemName:
      (Array.isArray(row.items) ? row.items[0]?.name : row.items?.name) ?? "Unknown item",
    claimedPrice: row.claimed_price as number,
    platformFee: (row.platform_fee as number | null) ?? parseFloat(((row.claimed_price as number) * 0.035).toFixed(2)),
    vendorPayout: (row.vendor_payout as number | null) ?? parseFloat(((row.claimed_price as number) * 0.965).toFixed(2)),
    claimedAt: row.claimed_at as string,
    status: row.status as string,
    buyerName:
      (Array.isArray(row.users) ? row.users[0]?.full_name : row.users?.full_name) ?? "A buyer",
  }));

  return NextResponse.json(notifications);
}
