"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  price: number;
  basePrice: number;
  pctOff: number;
  /** true when currentPrice has hit the floor percentage */
  atFloor: boolean;
  expired: boolean;
  unit: string;
}

/**
 * Ticker-tape price display.
 * Uses a React `key` change to replay a CSS slide-in animation every time
 * the price updates — zero layout shift, no jitter.
 * Edge cases handled: floor lockout, expiry, >50 % off urgency flash.
 */
export function LivePriceTicker({
  price,
  basePrice,
  pctOff,
  atFloor,
  expired,
  unit,
}: Props) {
  // Increment key on every price change → remounts <span> → replays animation
  const [animKey, setAnimKey] = useState(0);
  const prevPrice = useRef(price);

  useEffect(() => {
    if (price !== prevPrice.current) {
      setAnimKey((k) => k + 1);
      prevPrice.current = price;
    }
  }, [price]);

  if (expired) {
    return (
      <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#7D8590]">
        — EXPIRED —
      </span>
    );
  }

  // Color semantics: green near base, orange mid-decay, red near floor
  const priceColor = atFloor
    ? "text-[#FFD150]"
    : pctOff > 50
    ? "text-[#F26076]"
    : pctOff > 20
    ? "text-[#FF9760]"
    : "text-[#39D353]";

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        {/* key change replays animate-tick-in keyframe (defined in globals.css) */}
        <span
          key={animKey}
          className={`animate-tick-in font-mono text-2xl font-bold tracking-tight ${priceColor}`}
        >
          ₹{price.toFixed(2)}
        </span>
        <span className="font-mono text-xs text-[#7D8590]">/{unit}</span>
        {atFloor && (
          <span className="rounded border border-[#FFD150]/30 bg-[#FFD150]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#FFD150]">
            FLOOR
          </span>
        )}
      </div>

      {pctOff > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-[#7D8590] line-through">
            ₹{basePrice.toFixed(2)}
          </span>
          <span className="font-mono text-xs font-bold text-[#F26076]">
            -{pctOff}%
          </span>
        </div>
      )}
    </div>
  );
}
