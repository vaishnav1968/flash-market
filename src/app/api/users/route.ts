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

		const basePayload = {
			id: user.id,
			email: user.email,
			full_name: fullName,
			role: body.role,
			phone: body.phone?.trim() || null,
			shop_name: body.role === "vendor" ? body.shopName?.trim() || null : null,
			shop_address: body.role === "vendor" ? body.shopAddress?.trim() || null : null,
			latitude:
				body.latitude == null || !Number.isFinite(Number(body.latitude))
					? null
					: Number(body.latitude),
			longitude:
				body.longitude == null || !Number.isFinite(Number(body.longitude))
					? null
					: Number(body.longitude),
			avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
		};

		const payloadAttempts: Array<Record<string, unknown>> = [
			basePayload,
			// Older schema without shop_address column: keep coordinates.
			(({ shop_address: _shopAddress, ...rest }) => rest)(basePayload),
			// Older schema without location columns
			(({
				latitude: _latitude,
				longitude: _longitude,
				...rest
			}) => rest)(basePayload),
			// Older schema without both shop_address and location columns
			(({
				shop_address: _shopAddress,
				latitude: _latitude,
				longitude: _longitude,
				...rest
			}) => rest)(basePayload),
			// Older schema without phone/shop fields
			(({
				phone: _phone,
				shop_name: _shopName,
				shop_address: _shopAddress,
				latitude: _latitude,
				longitude: _longitude,
				...rest
			}) => rest)(basePayload),
		];

		let upsertError: { message: string } | null = null;
		let usedPayload: Record<string, unknown> | null = null;

		for (const payload of payloadAttempts) {
			const { error } = await supabaseAdmin
				.from("users")
				.upsert(payload, { onConflict: "id" });

			if (!error) {
				usedPayload = payload;
				upsertError = null;
				break;
			}

			upsertError = error;
		}

		if (!usedPayload) {
			console.error("POST /api/users error:", upsertError?.message);
			return NextResponse.json(
				{ error: upsertError?.message || "Failed to save user profile" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			id: user.id,
			role: usedPayload.role,
			fullName: usedPayload.full_name,
			shopName: usedPayload.shop_name,
			shopAddress: usedPayload.shop_address,
		});
	} catch (error) {
		console.error("POST /api/users exception:", error);
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
