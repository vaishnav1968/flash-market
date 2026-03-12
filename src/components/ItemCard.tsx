"use client";

import { useState, useEffect } from "react";
import type { Item } from "@/lib/types";
import { useRealTimePrice } from "@/hooks/useRealTimePrice";
import { CATEGORY_COLORS } from "@/lib/constants";

interface Props {
  item: Item;
  onClaim: (itemId: string, price: number, quantity: number) => void;
}

export default function ItemCard({ item, onClaim }: Props) {
  const [qty, setQty] = useState(1);

  // Reset selected qty when available quantity changes
  useEffect(() => {
    setQty((q) => Math.min(q, Math.max(1, item.quantity)));
  }, [item.quantity]);
  const { currentPrice, pctOff, timeRemaining, expired } = useRealTimePrice({
    basePrice: item.basePrice,
    listedAt: item.listedAt,
    expiresAt: item.expiresAt,
    priceFloorPct: item.priceFloorPct,
  });

  const isClaimed = item.status === "claimed" || item.status === "sold" || item.quantity <= 0;
  const isUnavailable = expired || isClaimed;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-100 transition-shadow hover:shadow-lg ${
        isUnavailable ? "opacity-60" : ""
      }`}
    >
      {/* Image placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <span className="text-4xl">
          {item.category === "cooked_meal"
            ? "🍲"
            : item.category === "fresh_produce"
            ? "🥬"
            : item.category === "dairy"
            ? "🧀"
            : "🍞"}
        </span>

        {/* Discount badge */}
        {pctOff > 0 && !expired && !isClaimed && (
          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow">
            -{pctOff}%
          </span>
        )}

        {/* Status badge */}
        {expired && (
          <span className="absolute left-2 top-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs font-bold text-white">
            Expired
          </span>
        )}
        {isClaimed && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            Sold Out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Category pill */}
        <span
          className={`mb-2 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            CATEGORY_COLORS[item.category]
          }`}
        >
          {item.category.replace("_", " ")}
        </span>

        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
          {item.name}
        </h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
          {item.description}
        </p>

        {/* Price + Timer */}
        <div className="mt-auto pt-3">
          {isClaimed ? (
            <div className="flex items-center justify-center py-2">
              <span className="text-sm font-bold text-red-500">Sold Out</span>
            </div>
          ) : (
          <div className="flex items-end justify-between">
            <div>
              {pctOff > 0 && (
                <span className="text-xs text-gray-400 line-through mr-1">
                  ₹{item.basePrice.toFixed(2)}
                </span>
              )}
              <span className="text-lg font-extrabold text-emerald-600">
                ₹{currentPrice.toFixed(2)}
              </span>
              <span className="ml-1 text-xs text-gray-400">/{item.unit}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-medium">
                Time left
              </p>
              <p
                className={`text-sm font-bold ${
                  expired ? "text-red-500" : "text-gray-700"
                }`}
              >
                {timeRemaining}
              </p>
            </div>
          </div>
          )}

          {/* Qty selector + Claim */}
          <div className="mt-3 flex items-center justify-between">
            {item.quantity > 1 && !isUnavailable ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-6 w-6 rounded bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-semibold text-gray-700">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(item.quantity, q + 1))}
                  className="h-6 w-6 rounded bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200"
                >
                  +
                </button>
                <span className="ml-1 text-[10px] text-gray-400">/ {item.quantity}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500">
                Qty: {item.quantity}
              </span>
            )}
            <button
              disabled={isUnavailable}
              onClick={() => onClaim(item.id, currentPrice * qty, qty)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                isUnavailable
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}
            >
              {isClaimed ? "Sold Out" : expired ? "Expired" : "🛒 Claim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
