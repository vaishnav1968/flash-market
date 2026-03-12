import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapItemRow } from "@/lib/item-mappers";
import type { CreateItemPayload } from "@/lib/types";

const ITEM_SELECT =
	"id, vendor_id, name, description, category, base_price, unit, quantity, image_url, tags, shelf_life_hours, listed_at, expires_at, price_floor_pct, status, claimed_by, claimed_at, created_at, updated_at";

async function attachVendorProfiles<T extends { vendor_id: string }>(rows: T[]) {
	if (rows.length === 0) {
		return rows;
	}

	const vendorIds = [...new Set(rows.map((row) => row.vendor_id))];

	let profileData: Array<Record<string, unknown>> | null = null;

	const fullProfileQuery = await supabaseAdmin
		.from("users")
		.select("id, full_name, shop_name, shop_address, latitude, longitude")
		.in("id", vendorIds);

	if (!fullProfileQuery.error && fullProfileQuery.data) {
		profileData = fullProfileQuery.data as Array<Record<string, unknown>>;
	} else {
		const basicProfileQuery = await supabaseAdmin
			.from("users")
			.select("id, full_name, shop_name")
			.in("id", vendorIds);

		if (!basicProfileQuery.error && basicProfileQuery.data) {
			profileData = basicProfileQuery.data as Array<Record<string, unknown>>;
		} else {
			console.warn(
				"Vendor profile enrichment skipped:",
				fullProfileQuery.error?.message ?? basicProfileQuery.error?.message
			);
			return rows;
		}
	}

	const profiles = new Map(profileData.map((profile) => [String(profile.id), profile]));

	return rows.map((row) => ({
		...row,
		users: profiles.get(row.vendor_id) ?? null,
	}));
}

async function getAuthenticatedUserId(request: Request) {
	const authHeader = request.headers.get("authorization");
	const accessToken = authHeader?.replace(/^Bearer\s+/i, "");

	if (!accessToken) {
		return null;
	}

	const { data, error } = await supabase.auth.getUser(accessToken);
	if (error || !data.user) {
		return null;
	}

	return data.user.id;
}

export async function GET() {
	try {
		const { data, error } = await supabaseAdmin
			.from("items")
			.select(ITEM_SELECT)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("GET /api/items error:", error.message);
			return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
		}

		const itemsWithProfiles = await attachVendorProfiles(data ?? []);

		return NextResponse.json(itemsWithProfiles.map(mapItemRow));
	} catch (error) {
		console.error("GET /api/items exception:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const userId = await getAuthenticatedUserId(request);
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const payload = (await request.json()) as CreateItemPayload;

		const { data, error } = await supabaseAdmin
			.from("items")
			.insert({
				vendor_id: userId,
				name: payload.name,
				description: payload.description ?? null,
				category: payload.category,
				base_price: payload.basePrice,
				unit: payload.unit,
				quantity: payload.quantity,
				image_url: payload.imageUrl ?? null,
				tags: payload.tags,
				shelf_life_hours: payload.shelfLifeHours,
			})
			.select(ITEM_SELECT)
			.single();

		if (error || !data) {
			console.error("POST /api/items error:", error?.message);
			return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
		}

		const [itemWithProfile] = await attachVendorProfiles([data]);

		return NextResponse.json(mapItemRow(itemWithProfile), { status: 201 });
	} catch (error) {
		console.error("POST /api/items exception:", error);
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
