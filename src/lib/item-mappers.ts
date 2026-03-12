import type { Item, ItemCategory, ItemStatus } from "@/lib/types";

interface ItemRow {
	id: string;
	vendor_id: string;
	users?:
		| {
		full_name: string | null;
		shop_name: string | null;
		shop_address: string | null;
		latitude: number | string | null;
		longitude: number | string | null;
	  }
		| Array<{
			full_name: string | null;
			shop_name: string | null;
			shop_address: string | null;
			latitude: number | string | null;
			longitude: number | string | null;
		  }>
		| null;
	name: string;
	description: string | null;
	category: ItemCategory;
	base_price: number;
	unit: string;
	quantity: number;
	image_url: string | null;
	tags: string[] | null;
	shelf_life_hours: number;
	listed_at: string;
	expires_at: string;
	price_floor_pct: number;
	status: ItemStatus;
	claimed_by: string | null;
	claimed_at: string | null;
	created_at: string;
	updated_at: string;
}

export function mapItemRow(row: ItemRow): Item {
	const vendorProfile = Array.isArray(row.users) ? row.users[0] : row.users;

	return {
		id: row.id,
		vendorId: row.vendor_id,
		vendorName: vendorProfile?.full_name ?? undefined,
		vendorShopName: vendorProfile?.shop_name ?? undefined,
		vendorAddress: vendorProfile?.shop_address ?? undefined,
		vendorLatitude:
			vendorProfile?.latitude == null ? undefined : Number(vendorProfile.latitude),
		vendorLongitude:
			vendorProfile?.longitude == null ? undefined : Number(vendorProfile.longitude),
		name: row.name,
		description: row.description ?? undefined,
		category: row.category,
		basePrice: Number(row.base_price),
		unit: row.unit,
		quantity: row.quantity,
		imageUrl: row.image_url ?? undefined,
		tags: row.tags ?? [],
		shelfLifeHours: Number(row.shelf_life_hours),
		listedAt: row.listed_at,
		expiresAt: row.expires_at,
		priceFloorPct: Number(row.price_floor_pct),
		status: row.status,
		claimedBy: row.claimed_by ?? undefined,
		claimedAt: row.claimed_at ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}
