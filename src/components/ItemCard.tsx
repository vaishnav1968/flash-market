"use client";

import { useState, useEffect } from "react";
import type { Item } from "@/lib/types";
import { useRealTimePrice } from "@/hooks/useRealTimePrice";
import { CATEGORY_COLORS } from "@/lib/constants";
import { LivePriceTicker } from "./LivePriceTicker";

interface Props {
  item: Item;
  onClaim: (itemId: string, price: number, quantity: number) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  cooked_meal: "🍲",
  fresh_produce: "🥬",
  dairy: "🧀",
  baked_goods: "🍞",
};

export default function ItemCard({ item, onClaim }: Props) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty((q) => Math.min(q, Math.max(1, item.quantity)));
  }, [item.quantity]);

  const { currentPrice, pctOff, timeRemaining, timeRemainingMs, expired } =
    useRealTimePrice({
      basePrice: item.basePrice,
      listedAt: item.listedAt,
      expiresAt: item.expiresAt,
      priceFloorPct: item.priceFloorPct,
    });

  const atFloor = currentPrice <= item.basePrice * item.priceFloorPct + 0.01;
  const isClaimed =
    item.status === "claimed" || item.status === "sold" || item.quantity <= 0;
  const isUnavailable = expired || isClaimed;
  // Urgent = less than 30 minutes remaining
  const isUrgent = !expired && !isClaimed && timeRemainingMs < 30 * 60 * 1000;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-lg border transition-all duration-150 ${
        isUnavailable
          ? "border-gray-200 bg-gray-100 opacity-60"
          : isUrgent
          ? "border-[#F26076]/50 bg-white hover:shadow-lg"
          : "border-gray-200 bg-white hover:border-[#458B73] hover:shadow-md"
      }`}
    >
      {/* Header with emoji and status */}
      <div className="flex items-start gap-3 p-4 pb-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl">
          {CATEGORY_EMOJI[item.category] ?? "🍱"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                {item.name}
              </h3>
              <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                {item.description}
              </p>
            </div>
            {pctOff > 0 && !expired && !isClaimed && (
              <span className="shrink-0 rounded bg-[#F26076] px-2 py-1 text-xs font-bold text-white">
                -{pctOff}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isClaimed || expired
              ? "bg-gray-400"
              : isUrgent
              ? "animate-pulse bg-[#F26076]"
              : "bg-[#39D353]"
          }`}
        />
        <span className="text-xs font-medium uppercase text-gray-600">
          {isClaimed ? "Sold out" : expired ? "Expired" : isUrgent ? "Hurry!" : "Available"}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
          {item.category.replace(/_/g, " ")}
        </span>
      </div>

      {/* Price section */}
      <div className="border-t border-gray-200 px-4 py-3">
        {isClaimed ? (
          <p className="text-sm font-bold text-gray-500">Sold out</p>
        ) : (
          <>
            <div className="mb-2">
              <LivePriceTicker
                price={currentPrice}
                basePrice={item.basePrice}
                pctOff={pctOff}
                atFloor={atFloor}
                expired={expired}
                unit={item.unit}
              />
            </div>
            {!expired && (
              <p className="text-xs text-gray-500">
                Expires in: <span className={isUrgent ? "font-bold text-[#F26076]" : "text-gray-700"}>{timeRemaining}</span>
              </p>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="mt-auto border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {item.quantity > 1 && !isUnavailable ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-7 w-7 rounded border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:border-[#458B73] hover:text-[#458B73]"
              >
                −
              </button>
              <span className="w-6 text-center text-xs font-bold text-gray-900">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(item.quantity, q + 1))}
                className="h-7 w-7 rounded border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:border-[#458B73] hover:text-[#458B73]"
              >
                +
              </button>
              <span className="ml-1 text-xs text-gray-600">max {item.quantity}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
          )}
          <button
            disabled={isUnavailable}
            onClick={() => onClaim(item.id, currentPrice * qty, qty)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              isUnavailable
                ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                : "border border-[#458B73] bg-[#458B73] text-white hover:bg-[#458B73]/90 active:scale-95"
            }`}
          >
            {isClaimed ? "Sold" : expired ? "Expired" : "Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}
