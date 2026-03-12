// ── FlashMarket — Supabase-backed store (with local fallback) ──

import { supabase } from "@/lib/supabase";
import type { Item, CreateItemPayload } from "@/lib/types";
import localItems from "@/data/perishable-items.json";

// ── In-memory cache shared across pages (persists during session) ──
let cachedItems: Item[] | null = null;

/** Convert a seed JSON entry into a full Item with generated timestamps */
function seedToItem(raw: (typeof localItems)[number]): Item {
  const now = new Date();
  const listedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + raw.shelfLifeHours * 3_600_000
  ).toISOString();
  return {
    id: raw.id,
    vendorId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    name: raw.name,
    description: raw.description ?? "",
    category: raw.category as Item["category"],
    basePrice: raw.basePrice,
    unit: raw.unit,
    quantity: 1,
    imageUrl: raw.imageUrl ?? "",
    tags: raw.tags ?? [],
    shelfLifeHours: raw.shelfLifeHours,
    listedAt,
    expiresAt,
    priceFloorPct: 0.4,
    status: "available",
    createdAt: listedAt,
    updatedAt: listedAt,
  };
}

/** Map Supabase snake_case row → camelCase Item */
function rowToItem(row: Record<string, unknown>): Item {
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

/** Fetch all available items from Supabase, falling back to local JSON */
export async function getItems(): Promise<Item[]> {
  // Return cached items if already loaded (includes vendor-added items)
  if (cachedItems) return cachedItems;

  try {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      cachedItems = localItems.map(seedToItem);
      return cachedItems;
    }
    cachedItems = data.map(rowToItem);
    return cachedItems;
  } catch {
    cachedItems = localItems.map(seedToItem);
    return cachedItems;
  }
}

/** Fetch a single item by id */
export async function getItemById(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToItem(data);
}

/** Insert a new item into Supabase, with local fallback */
export async function addItem(payload: CreateItemPayload): Promise<Item | null> {
  const now = new Date();
  const listedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + payload.shelfLifeHours * 3_600_000
  );

  const row = {
    vendor_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", // demo vendor
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
    expires_at: expiresAt.toISOString(),
    price_floor_pct: 0.4,
    status: "available",
  };

  try {
    const { data, error } = await supabase
      .from("items")
      .insert(row)
      .select()
      .single();

    if (!error && data) {
      const item = rowToItem(data);
      if (cachedItems) cachedItems = [item, ...cachedItems];
      return item;
    }
  } catch {
    // Supabase unavailable — fall through to local item
  }

  // Local fallback: return an in-memory Item
  const id = `local_${Date.now()}`;
  const newItem: Item = {
    id,
    vendorId: row.vendor_id,
    name: row.name,
    description: row.description,
    category: row.category as Item["category"],
    basePrice: row.base_price,
    unit: row.unit,
    quantity: row.quantity,
    imageUrl: row.image_url,
    tags: row.tags,
    shelfLifeHours: row.shelf_life_hours,
    listedAt,
    expiresAt: row.expires_at,
    priceFloorPct: row.price_floor_pct,
    status: "available",
    createdAt: listedAt,
    updatedAt: listedAt,
  };
  if (cachedItems) cachedItems = [newItem, ...cachedItems];
  return newItem;
}

/** Claim an item — decrement quantity, mark sold out only when 0 */
export async function claimItem(
  itemId: string,
  buyerId: string,
  claimedPrice: number,
  claimQty: number = 1
): Promise<Item | null> {
  try {
    // First fetch current quantity
    const { data: current } = await supabase
      .from("items")
      .select("quantity")
      .eq("id", itemId)
      .single();

    const newQty = Math.max(0, (current?.quantity ?? 1) - claimQty);
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("items")
      .update({
        quantity: newQty,
        status: newQty <= 0 ? "claimed" : "available",
        claimed_by: newQty <= 0 ? buyerId : null,
        claimed_at: newQty <= 0 ? nowIso : null,
        updated_at: nowIso,
      })
      .eq("id", itemId)
      .select()
      .single();

    if (!error && data) {
      await supabase.from("claims").insert({
        item_id: itemId,
        buyer_id: buyerId,
        vendor_id: data.vendor_id,
        claimed_price: claimedPrice,
        status: "pending",
      });

      const item = rowToItem(data);
      if (cachedItems) cachedItems = cachedItems.map((i) => (i.id === itemId ? item : i));
      return item;
    }
    // Supabase returned an error — fall through to local fallback
  } catch {
    // Supabase unavailable — fall through to local fallback
  }

  // Local fallback: update the cached item
  const nowIso = new Date().toISOString();
  if (cachedItems) {
    const found = cachedItems.find((i) => i.id === itemId);
    if (found) {
      const newQty = Math.max(0, found.quantity - claimQty);
      const updated: Item = {
        ...found,
        quantity: newQty,
        status: newQty <= 0 ? "claimed" : "available",
        claimedBy: newQty <= 0 ? buyerId : undefined,
        claimedAt: newQty <= 0 ? nowIso : undefined,
        updatedAt: nowIso,
      };
      cachedItems = cachedItems.map((i) => (i.id === itemId ? updated : i));
      return updated;
    }
  }
  return null;
}
