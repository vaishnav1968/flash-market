import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/types";

async function getAuthenticatedUser(request: Request) {
	const authHeader = request.headers.get("authorization");
	const accessToken = authHeader?.replace(/^Bearer\s+/i, "");

	if (!accessToken) {
		return null;
	}

	const { data, error } = await supabase.auth.getUser(accessToken);
	if (error || !data.user) {
		return null;
	}

	return data.user;
}

export async function POST(request: Request) {
	try {
		const user = await getAuthenticatedUser(request);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await request.json()) as {
			role?: UserRole;
			fullName?: string;
			phone?: string;
			shopName?: string;
			shopAddress?: string;
			latitude?: number;
			longitude?: number;
		};

		if (body.role !== "buyer" && body.role !== "vendor") {
			return NextResponse.json({ error: "Invalid role" }, { status: 400 });
		}

		const fullName =
			body.fullName?.trim() ||
			(user.user_metadata?.full_name as string | undefined) ||
			user.email?.split("@")[0] ||
			"FlashMarket User";

		const { data, error } = await supabaseAdmin
			.from("users")
			.upsert(
				{
					id: user.id,
					email: user.email,
					full_name: fullName,
					role: body.role,
					phone: body.phone?.trim() || null,
					shop_name: body.role === "vendor" ? body.shopName?.trim() || null : null,
					shop_address:
						body.role === "vendor" ? body.shopAddress?.trim() || null : null,
					latitude:
						body.latitude == null || !Number.isFinite(Number(body.latitude))
							? null
							: Number(body.latitude),
					longitude:
						body.longitude == null || !Number.isFinite(Number(body.longitude))
							? null
							: Number(body.longitude),
					avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
				},
				{ onConflict: "id" }
			)
			.select("id, role, full_name, shop_name, shop_address")
			.single();

		if (error || !data) {
			console.error("POST /api/users error:", error?.message);
			return NextResponse.json({ error: "Failed to save user profile" }, { status: 500 });
		}

		return NextResponse.json({
			id: data.id,
			role: data.role,
			fullName: data.full_name,
			shopName: data.shop_name,
			shopAddress: data.shop_address,
		});
	} catch (error) {
		console.error("POST /api/users exception:", error);
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
