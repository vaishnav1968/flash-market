"use client";

import { useState, useCallback, useEffect } from "react";
import Marketplace from "@/components/Marketplace";
import ClaimModal from "@/components/ClaimModal";
import { getItems, claimItem } from "@/lib/store";
import type { Item } from "@/lib/types";

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<{
    itemId: string;
    name: string;
    price: number;
  } | null>(null);

  // Fetch items from Supabase on mount
  useEffect(() => {
    getItems().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const handleClaim = useCallback(
    (itemId: string, price: number) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      setClaiming({ itemId, name: item.name, price });
    },
    [items]
  );

  const confirmClaim = useCallback(async () => {
    if (!claiming) return;
    const updated = await claimItem(
      claiming.itemId,
      "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      claiming.price
    );
    if (updated) {
      setItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
    }
  }, [claiming]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          ⚡ Fresh Deals, <span className="text-emerald-600">Dropping Fast</span>
        </h1>
        <p className="mt-2 text-gray-500 sm:text-lg">
          Claim surplus perishable food at dynamically-dropping prices. The
          longer it sits, the cheaper it gets — but don&apos;t wait too long!
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Live Items",
            value: items.filter((i) => i.status === "available").length,
            icon: "🟢",
          },
          {
            label: "Categories",
            value: new Set(items.map((i) => i.category)).size,
            icon: "📂",
          },
          {
            label: "Claimed",
            value: items.filter(
              (i) => i.status === "claimed" || i.status === "sold"
            ).length,
            icon: "🛒",
          },
          { label: "Price Floor", value: "40%", icon: "🛡️" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
          >
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Marketplace items={items} onClaim={handleClaim} loading={loading} />

      {claiming && (
        <ClaimModal
          itemName={claiming.name}
          price={claiming.price}
          onConfirm={confirmClaim}
          onCancel={() => setClaiming(null)}
        />
      )}
    </div>
  );
}
