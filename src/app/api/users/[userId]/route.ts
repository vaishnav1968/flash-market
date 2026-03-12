import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, role, full_name, shop_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    role: data.role,
    fullName: data.full_name,
    shopName: data.shop_name,
    avatarUrl: data.avatar_url,
  });
}
