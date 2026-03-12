import type { CreateItemPayload, Item } from "@/lib/types";

export function rowToItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    vendorId: row.vendor_id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    category: row.category as Item["category"],
    basePrice: Number(row.base_price),
    unit: row.unit as string,
    quantity: Number(row.quantity),
    imageUrl: (row.image_url as string) ?? "",
    tags: (row.tags as string[]) ?? [],
    shelfLifeHours: Number(row.shelf_life_hours),
    listedAt: row.listed_at as string,
    expiresAt: row.expires_at as string,
    priceFloorPct: Number(row.price_floor_pct),
    status: row.status as Item["status"],
    claimedBy: (row.claimed_by as string) ?? undefined,
    claimedAt: (row.claimed_at as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function payloadToInsertRow(payload: CreateItemPayload) {
  const now = new Date();
  const listedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + payload.shelfLifeHours * 3_600_000
  ).toISOString();

  return {
    vendor_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    name: payload.name,
    description: payload.description ?? "",
    category: payload.category,
    base_price: payload.basePrice,
    unit: payload.unit,
    quantity: payload.quantity ?? 1,
    image_url: payload.imageUrl ?? "",
    tags: payload.tags ?? [],
    shelf_life_hours: payload.shelfLifeHours,
    listed_at: listedAt,
    expires_at: expiresAt,
    price_floor_pct: 0.4,
    status: "available" as const,
  };
}