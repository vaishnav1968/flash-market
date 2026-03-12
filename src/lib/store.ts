// ── FlashMarket — Supabase-backed store (with local fallback) ──

import type { CreateItemPayload, Item } from "@/lib/types";

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

export async function addItem(payload: CreateItemPayload): Promise<Item | null> {
  const response = await fetch("/api/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  buyerId: string,
  claimedPrice: number,
  claimQty: number = 1
): Promise<Item | null> {
  const response = await fetch(`/api/items/${itemId}/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ buyerId, claimedPrice, claimQty }),
  });

  if (!response.ok) {
    const error = await parseJson<{ error?: string }>(response);
    console.error("claimItem error:", error?.error ?? response.statusText);
    return null;
  }

  return await parseJson<Item>(response);
}
