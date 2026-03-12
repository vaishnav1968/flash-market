// ── FlashMarket — Supabase-backed store (with local fallback) ──

import type { CreateItemPayload, FulfillmentMethod, Item } from "@/lib/types";

interface ClaimItemOptions {
  fulfillmentMethod: FulfillmentMethod;
  buyerLatitude?: number;
  buyerLongitude?: number;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getItems(): Promise<Item[]> {
  const response = await fetch("/api/items", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("getItems error:", response.statusText);
    return [];
  }

  return (await parseJson<Item[]>(response)) ?? [];
}

export async function addItem(
  payload: CreateItemPayload,
  accessToken: string
): Promise<Item | null> {
  const response = await fetch("/api/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseJson<{ error?: string }>(response);
    console.error("addItem error:", error?.error ?? response.statusText);
    return null;
  }

  return await parseJson<Item>(response);
}

export async function claimItem(
  itemId: string,
  claimedPrice: number,
  claimQty: number = 1,
  accessToken?: string,
  options?: ClaimItemOptions
): Promise<Item | null> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const response = await fetch(`/api/items/${itemId}/claim`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      claimedPrice,
      claimQty,
      fulfillmentMethod: options?.fulfillmentMethod ?? "pickup",
      buyerLatitude: options?.buyerLatitude,
      buyerLongitude: options?.buyerLongitude,
    }),
  });

  if (!response.ok) {
    const error = await parseJson<{ error?: string }>(response);
    console.error("claimItem error:", error?.error ?? response.statusText);
    return null;
  }

  const data = await parseJson<unknown>(response);
  if (!data) return null;
  if (typeof data === "object" && data !== null && "item" in data) {
    return (data as { item?: Item }).item ?? null;
  }
  return data as Item;
}
