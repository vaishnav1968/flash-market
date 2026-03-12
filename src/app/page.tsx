"use client";

import { useState, useCallback, useEffect } from "react";
import Marketplace from "@/components/Marketplace";
import ClaimModal from "@/components/ClaimModal";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDeliveryFee, calculateDistanceKm } from "@/lib/delivery";
import { getItems, claimItem } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import type { FulfillmentMethod, Item } from "@/lib/types";

export default function HomePage() {
  const { session, signInWithGoogle } = useAuth();
  const { latitude, longitude, error: geolocationError } = useGeolocation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    deliveryDistanceKm: number | null;
    deliveryFee: number | null;
    deliveryUnavailableReason: string | null;
  } | null>(null);

  // Fetch items from Supabase on mount
  useEffect(() => {
    getItems().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const handleClaim = useCallback(
    (itemId: string, price: number, quantity: number) => {
      if (!session) {
        signInWithGoogle();
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      let deliveryDistanceKm: number | null = null;
      let deliveryFee: number | null = null;
      let deliveryUnavailableReason: string | null = null;

      if (item.vendorLatitude == null || item.vendorLongitude == null) {
        deliveryUnavailableReason = "The vendor has not shared a pickup location yet.";
      } else if (latitude == null || longitude == null) {
        deliveryUnavailableReason = geolocationError || "Allow location access to get a delivery quote.";
      } else {
        deliveryDistanceKm = calculateDistanceKm(
          item.vendorLatitude,
          item.vendorLongitude,
          latitude,
          longitude
        );
        deliveryFee = calculateDeliveryFee(deliveryDistanceKm);
      }

      setClaiming({
        itemId,
        name: item.name,
        price,
        quantity,
        deliveryDistanceKm,
        deliveryFee,
        deliveryUnavailableReason,
      });
    },
    [geolocationError, items, latitude, longitude, session, signInWithGoogle]
  );

  const confirmClaim = useCallback(async (fulfillmentMethod: FulfillmentMethod) => {
    if (!claiming || !session) return false;
    const updated = await claimItem(
      claiming.itemId,
      claiming.price,
      claiming.quantity,
      session.access_token,
      {
        fulfillmentMethod,
        buyerLatitude: latitude ?? undefined,
        buyerLongitude: longitude ?? undefined,
      }
    );
    if (updated) {
      setItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      return true;
    }
    return false;
  }, [claiming, latitude, longitude, session]);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-10 sm:px-6">
        {/* Hero section */}
        <div className="mb-8 rounded-lg bg-white shadow-sm border border-gray-100">
          <div className="px-6 py-8 sm:px-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">⚡</span>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Flash<span className="text-[#458B73]">Market</span>
              </h1>
            </div>
            <p className="text-base text-gray-600 mb-4">
              Real-time perishable food flash sales · Prices drop as items approach expiry · Save up to 60%
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  key: "LIVE_ITEMS",
                  value: items.filter((i) => i.status === "available").length,
                  label: "Live Items",
                },
                {
                  key: "CATEGORIES",
                  value: new Set(items.map((i) => i.category)).size,
                  label: "Categories",
                },
                {
                  key: "CLAIMED",
                  value: items.filter(
                    (i) => i.status === "claimed" || i.status === "sold"
                  ).length,
                  label: "Claimed Today",
                },
                {
                  key: "SAVED",
                  value: Math.floor(
                    items.filter((i) => i.status === "claimed").length * 15
                  ),
                  label: "₹ Saved",
                },
              ].map((stat) => (
                <div
                  key={stat.key}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Marketplace items={items} onClaim={handleClaim} loading={loading} />

        {claiming && (
          <ClaimModal
            itemName={claiming.name}
            price={claiming.price}
            quantity={claiming.quantity}
            deliveryDistanceKm={claiming.deliveryDistanceKm}
            deliveryFee={claiming.deliveryFee}
            deliveryUnavailableReason={claiming.deliveryUnavailableReason}
            onConfirm={confirmClaim}
            onCancel={() => setClaiming(null)}
          />
        )}
      </div>
    </div>
  );
}
