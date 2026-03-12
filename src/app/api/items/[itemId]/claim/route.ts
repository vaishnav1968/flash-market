import { NextResponse } from "next/server";
import { PLATFORM_COMMISSION_PCT } from "@/lib/constants";
import { calculateDeliveryFee, calculateDistanceKm } from "@/lib/delivery";
import { mapItemRow } from "@/lib/item-mappers";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ITEM_SELECT =
	"id, vendor_id, name, description, category, base_price, unit, quantity, image_url, tags, shelf_life_hours, listed_at, expires_at, price_floor_pct, status, claimed_by, claimed_at, created_at, updated_at";

async function getVendorProfile(vendorId: string) {
	const fullProfileQuery = await supabaseAdmin
		.from("users")
		.select("id, full_name, shop_name, shop_address, latitude, longitude")
		.eq("id", vendorId)
		.single();

	if (!fullProfileQuery.error && fullProfileQuery.data) {
		return fullProfileQuery.data as Record<string, unknown>;
	}

	const basicProfileQuery = await supabaseAdmin
			.from("users")
			.select("id, full_name, shop_name")
			.eq("id", vendorId)
			.single();

	if (basicProfileQuery.error || !basicProfileQuery.data) {
		return null;
	}

	return basicProfileQuery.data as Record<string, unknown>;
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

export async function POST(
	request: Request,
	context: { params: Promise<{ itemId: string }> }
) {
	try {
		const userId = await getAuthenticatedUserId(request);
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { itemId } = await context.params;
		const body = (await request.json()) as {
			claimedPrice?: number;
			claimQty?: number;
			fulfillmentMethod?: "pickup" | "delivery";
			buyerLatitude?: number;
			buyerLongitude?: number;
		};

		const claimQty = Math.max(1, Math.floor(body.claimQty ?? 1));
		const claimedPrice = Number(body.claimedPrice ?? 0);
		const fulfillmentMethod = body.fulfillmentMethod ?? "pickup";
		const buyerLatitude =
			body.buyerLatitude == null ? null : Number(body.buyerLatitude);
		const buyerLongitude =
			body.buyerLongitude == null ? null : Number(body.buyerLongitude);

		if (!Number.isFinite(claimedPrice) || claimedPrice <= 0) {
			return NextResponse.json({ error: "Invalid claimed price" }, { status: 400 });
		}

		if (fulfillmentMethod !== "pickup" && fulfillmentMethod !== "delivery") {
			return NextResponse.json({ error: "Invalid fulfillment method" }, { status: 400 });
		}

		const { data: item, error: itemError } = await supabaseAdmin
			.from("items")
			.select(ITEM_SELECT)
			.eq("id", itemId)
			.single();

		if (itemError || !item) {
			return NextResponse.json({ error: "Item not found" }, { status: 404 });
		}

		if (item.status !== "available") {
			return NextResponse.json({ error: "Item is no longer available" }, { status: 409 });
		}

		if (item.quantity < claimQty) {
			return NextResponse.json({ error: "Not enough quantity available" }, { status: 409 });
		}

		const vendorProfile = await getVendorProfile(item.vendor_id);

		let deliveryDistanceKm: number | null = null;
		let deliveryFee: number | null = null;

		if (fulfillmentMethod === "delivery") {
			const vendorLatitude =
				vendorProfile?.latitude == null ? null : Number(vendorProfile.latitude);
			const vendorLongitude =
				vendorProfile?.longitude == null ? null : Number(vendorProfile.longitude);

			if (
				vendorLatitude == null ||
				vendorLongitude == null ||
				buyerLatitude == null ||
				buyerLongitude == null ||
				!Number.isFinite(buyerLatitude) ||
				!Number.isFinite(buyerLongitude)
			) {
				return NextResponse.json(
					{ error: "Delivery requires both buyer and vendor location" },
					{ status: 400 }
				);
			}

			deliveryDistanceKm = calculateDistanceKm(
				vendorLatitude,
				vendorLongitude,
				buyerLatitude,
				buyerLongitude
			);
			deliveryFee = calculateDeliveryFee(deliveryDistanceKm);
		}

		const nextQuantity = item.quantity - claimQty;
		const nextStatus = nextQuantity === 0 ? "claimed" : item.status;

		const { data: updatedItem, error: updateError } = await supabaseAdmin
			.from("items")
			.update({
				quantity: nextQuantity,
				status: nextStatus,
				claimed_by: userId,
				claimed_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq("id", itemId)
			.select(ITEM_SELECT)
			.single();

		if (updateError || !updatedItem) {
			console.error("POST /api/items/[itemId]/claim update error:", updateError?.message);
			return NextResponse.json({ error: "Failed to claim item" }, { status: 500 });
		}

		const platformFee = Number((claimedPrice * PLATFORM_COMMISSION_PCT).toFixed(2));
		const vendorPayout = Number((claimedPrice - platformFee).toFixed(2));

		const { data: claim, error: claimError } = await supabaseAdmin
			.from("claims")
			.insert({
			item_id: itemId,
			buyer_id: userId,
			vendor_id: item.vendor_id,
			claimed_price: claimedPrice,
			platform_fee: platformFee,
			vendor_payout: vendorPayout,
			})
			.select("id")
			.single();

		if (claimError || !claim) {
			console.error("POST /api/items/[itemId]/claim insert error:", claimError?.message);
			return NextResponse.json({ error: "Failed to record claim" }, { status: 500 });
		}

		if (fulfillmentMethod === "delivery" && deliveryDistanceKm != null && deliveryFee != null) {
			const vendorLatitude = Number(vendorProfile?.latitude);
			const vendorLongitude = Number(vendorProfile?.longitude);

			const { error: deliveryError } = await supabaseAdmin.from("deliveries").insert({
				claim_id: claim.id,
				deliverer_id: null,
				vendor_id: item.vendor_id,
				credit_reward: deliveryFee,
				status: "available",
				pickup_lat: vendorLatitude,
				pickup_lon: vendorLongitude,
				dropoff_lat: buyerLatitude,
				dropoff_lon: buyerLongitude,
			});

			if (deliveryError) {
				console.error(
					"POST /api/items/[itemId]/claim delivery insert error:",
					deliveryError.message
				);
			}
		}

		return NextResponse.json({
			item: mapItemRow({
				...updatedItem,
				users: vendorProfile as
					| {
						full_name: string | null;
						shop_name: string | null;
						shop_address: string | null;
						latitude: number | string | null;
						longitude: number | string | null;
					  }
					| null,
			}),
			fulfillmentMethod,
			deliveryDistanceKm,
			deliveryFee,
		});
	} catch (error) {
		console.error("POST /api/items/[itemId]/claim exception:", error);
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
