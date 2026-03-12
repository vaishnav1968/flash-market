// ── FlashMarket — Local mock store (replaces Supabase during dev) ──

import type { Item, CreateItemPayload } from "@/lib/types";
import seedData from "@/data/perishable-items.json";

// Hydrate seed data with dynamic fields
function hydrateItems(): Item[] {
  const now = new Date();
  return seedData.map((raw) => {
    const listedAt = new Date(
      now.getTime() - Math.random() * raw.shelfLifeHours * 3_600_000 * 0.5
    );
    const expiresAt = new Date(
      listedAt.getTime() + raw.shelfLifeHours * 3_600_000
    );
    return {
      id: raw.id,
      vendorId: "vendor_demo_001",
      name: raw.name,
      description: raw.description,
      category: raw.category as Item["category"],
      basePrice: raw.basePrice,
      unit: raw.unit,
      quantity: Math.floor(Math.random() * 10) + 1,
      imageUrl: raw.imageUrl,
      tags: raw.tags,
      shelfLifeHours: raw.shelfLifeHours,
      listedAt: listedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      priceFloorPct: 0.2,
      status: "available" as const,
      createdAt: listedAt.toISOString(),
      updatedAt: listedAt.toISOString(),
    };
  });
}

let items: Item[] = [];

export function getItems(): Item[] {
  if (items.length === 0) items = hydrateItems();
  return items;
}

export function getItemById(id: string): Item | undefined {
  return getItems().find((i) => i.id === id);
}

export function addItem(payload: CreateItemPayload): Item {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + payload.shelfLifeHours * 3_600_000
  );
  const item: Item = {
    id: `item_${String(getItems().length + 1).padStart(3, "0")}`,
    vendorId: "vendor_demo_001",
    ...payload,
    quantity: payload.quantity ?? 1,
    imageUrl: payload.imageUrl ?? "",
    tags: payload.tags ?? [],
    shelfLifeHours: payload.shelfLifeHours,
    listedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    priceFloorPct: 0.2,
    status: "available",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  items = [item, ...items];
  return item;
}

export function claimItem(
  itemId: string,
  buyerId: string,
  claimedPrice: number
): Item | null {
  const idx = getItems().findIndex((i) => i.id === itemId);
  if (idx === -1) return null;
  items[idx] = {
    ...items[idx],
    status: "claimed",
    claimedBy: buyerId,
    claimedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return items[idx];
}
