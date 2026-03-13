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

		const requestedLatitude =
			body.latitude == null || !Number.isFinite(Number(body.latitude))
				? null
				: Number(body.latitude);
		const requestedLongitude =
			body.longitude == null || !Number.isFinite(Number(body.longitude))
				? null
				: Number(body.longitude);

		const basePayload = {
			id: user.id,
			email: user.email,
			full_name: fullName,
			role: body.role,
			phone: body.phone?.trim() || null,
			shop_name: body.role === "vendor" ? body.shopName?.trim() || null : null,
			shop_address: body.role === "vendor" ? body.shopAddress?.trim() || null : null,
			latitude: requestedLatitude,
			longitude: requestedLongitude,
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

		if (
			body.role === "vendor" &&
			requestedLatitude != null &&
			requestedLongitude != null
		) {
			const { error: coordUpdateError } = await supabaseAdmin
				.from("users")
				.update({
					latitude: requestedLatitude,
					longitude: requestedLongitude,
					updated_at: new Date().toISOString(),
				})
				.eq("id", user.id);

			if (coordUpdateError) {
				console.error(
					"POST /api/users coordinate update error:",
					coordUpdateError.message
				);
			}
		}

		const verifyFull = await supabaseAdmin
			.from("users")
			.select("id, role, full_name, shop_name, shop_address, latitude, longitude")
			.eq("id", user.id)
			.single();

		let saved = verifyFull.data as Record<string, unknown> | null;
		let verifyError = verifyFull.error;

		if (verifyError) {
			const verifyCoords = await supabaseAdmin
				.from("users")
				.select("id, role, full_name, shop_name, latitude, longitude")
				.eq("id", user.id)
				.single();
			saved = verifyCoords.data as Record<string, unknown> | null;
			verifyError = verifyCoords.error;
		}

		if (verifyError || !saved) {
			return NextResponse.json(
				{ error: "Profile saved but verification failed. Please retry." },
				{ status: 500 }
			);
		}

		const savedLatitude =
			saved.latitude == null || !Number.isFinite(Number(saved.latitude))
				? null
				: Number(saved.latitude);
		const savedLongitude =
			saved.longitude == null || !Number.isFinite(Number(saved.longitude))
				? null
				: Number(saved.longitude);

		if (
			body.role === "vendor" &&
			requestedLatitude != null &&
			requestedLongitude != null &&
			(savedLatitude == null || savedLongitude == null)
		) {
			return NextResponse.json(
				{
					error:
						"Coordinates could not be saved in Supabase. Check that users.latitude and users.longitude columns exist and redeploy.",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			id: user.id,
			role: saved.role,
			fullName: saved.full_name,
			shopName: saved.shop_name,
			shopAddress: (saved.shop_address as string | null | undefined) ?? null,
			latitude: savedLatitude,
			longitude: savedLongitude,
		});
	} catch (error) {
		console.error("POST /api/users exception:", error);
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
