"use client";

import { useState } from "react";
import VendorDashboard from "@/components/VendorDashboard";
import { addItem, getItems } from "@/lib/store";
import type { CreateItemPayload, Item } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/constants";
import { calculateDynamicPrice, formatTimeRemaining } from "@/lib/pricing";

export default function VendorPage() {
  const [items, setItems] = useState<Item[]>(() =>
    getItems().filter((i) => i.vendorId === "vendor_demo_001")
  );

  function handleSubmit(payload: CreateItemPayload) {
    const newItem = addItem(payload);
    setItems((prev) => [newItem, ...prev]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">
          📦 Vendor Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          List surplus perishable items. Prices auto-decay over the shelf-life
          window.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Upload form */}
        <div className="lg:col-span-2">
          <VendorDashboard onSubmit={handleSubmit} />
        </div>

        {/* Live listings */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Your Live Listings ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 py-16 text-gray-400">
              <span className="text-4xl mb-2">📋</span>
              <p className="text-sm">No items listed yet. Upload your first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const pricing = calculateDynamicPrice(
                  item.basePrice,
                  item.listedAt,
                  item.expiresAt,
                  item.priceFloorPct
                );
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {item.category === "cooked_meal"
                          ? "🍲"
                          : item.category === "fresh_produce"
                          ? "🥬"
                          : item.category === "dairy"
                          ? "🧀"
                          : "🍞"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              CATEGORY_COLORS[item.category]
                            }`}
                          >
                            {item.category.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-400">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {pricing.pctOff > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            ${item.basePrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-sm font-bold text-emerald-600">
                          ${pricing.currentPrice.toFixed(2)}
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          pricing.expired
                            ? "font-semibold text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {formatTimeRemaining(pricing.timeRemainingMs)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
