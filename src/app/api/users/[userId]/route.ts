import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  const fullProfile = await supabaseAdmin
    .from("users")
    .select("id, role, full_name, shop_name, shop_address, avatar_url, latitude, longitude")
    .eq("id", userId)
    .single();

  let data = fullProfile.data as Record<string, unknown> | null;
  let error = fullProfile.error;

  if (error) {
    const coordsProfile = await supabaseAdmin
      .from("users")
      .select("id, role, full_name, shop_name, avatar_url, latitude, longitude")
      .eq("id", userId)
      .single();

    data = coordsProfile.data as Record<string, unknown> | null;
    error = coordsProfile.error;
  }

  if (error) {
    const basicProfile = await supabaseAdmin
      .from("users")
      .select("id, role, full_name, shop_name, avatar_url")
      .eq("id", userId)
      .single();
    data = basicProfile.data as Record<string, unknown> | null;
    error = basicProfile.error;
  }

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: String(data.id),
    role: data.role,
    fullName: data.full_name,
    shopName: data.shop_name,
    shopAddress: (data.shop_address as string | null | undefined) ?? null,
    latitude:
      data.latitude == null || !Number.isFinite(Number(data.latitude))
        ? null
        : Number(data.latitude),
    longitude:
      data.longitude == null || !Number.isFinite(Number(data.longitude))
        ? null
        : Number(data.longitude),
    avatarUrl: data.avatar_url,
  });
}
