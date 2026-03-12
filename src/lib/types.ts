// ── FlashMarket — Core TypeScript Types ──

export type UserRole = "vendor" | "buyer";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  shopName?: string;
  shopAddress?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemCategory =
  | "cooked_meal"
  | "fresh_produce"
  | "dairy"
  | "baked_goods";

export type ItemStatus = "available" | "claimed" | "sold" | "expired";

export type FulfillmentMethod = "pickup" | "delivery";

export interface Item {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorShopName?: string;
  vendorAddress?: string;
  vendorLatitude?: number;
  vendorLongitude?: number;
  name: string;
  description?: string;
  category: ItemCategory;
  basePrice: number;
  unit: string;
  quantity: number;
  imageUrl?: string;
  tags: string[];

  // dynamic pricing
  shelfLifeHours: number;
  listedAt: string; // ISO
  expiresAt: string; // ISO
  priceFloorPct: number; // 0.20 = 20%

  // claim flow
  status: ItemStatus;
  claimedBy?: string;
  claimedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  itemId: string;
  buyerId: string;
  vendorId: string;
  claimedPrice: number;
  fulfillmentMethod?: FulfillmentMethod;
  status: "pending" | "completed" | "cancelled";
  claimedAt: string;
  completedAt?: string;
}

/** Payload for creating a new item from the Vendor Dashboard */
export interface CreateItemPayload {
  name: string;
  description?: string;
  category: ItemCategory;
  basePrice: number;
  unit: string;
  quantity: number;
  shelfLifeHours: number;
  imageUrl?: string;
  tags: string[];
}

// ── P2P Delivery System ──

export type DeliveryStatus = "available" | "picked_up" | "completed" | "cancelled";

export interface Delivery {
  id: string;
  claimId: string;
  delivererId?: string; // null if still available
  vendorId: string;
  creditReward: number;
  status: DeliveryStatus;
  pickupLat: number;
  pickupLon: number;
  dropoffLat: number;
  dropoffLon: number;
  createdAt: string;
  pickedUpAt?: string;
  completedAt?: string;
}

export interface NearbyDelivery extends Delivery {
  itemName: string;
  vendorName: string;
  claimedPrice: number;
  distance: number; // in kilometers
}
