"use client";

import { useState, useEffect, useCallback } from "react";
import { calculateDynamicPrice, formatTimeRemaining } from "@/lib/pricing";

interface UseRealTimePriceOptions {
  basePrice: number;
  listedAt: string;
  expiresAt: string;
  priceFloorPct?: number;
  /** Refresh interval in ms (default 1000 = every second) */
  intervalMs?: number;
}

interface RealTimePriceState {
  currentPrice: number;
  discount: number;
  pctOff: number;
  timeRemaining: string;
  timeRemainingMs: number;
  expired: boolean;
}

/**
 * Custom hook that recalculates the dynamic price every `intervalMs`.
 * Drives the live countdown + price decay on the storefront.
 */
export function useRealTimePrice({
  basePrice,
  listedAt,
  expiresAt,
  priceFloorPct = 0.4,
  intervalMs = 1000,
}: UseRealTimePriceOptions): RealTimePriceState {
  const compute = useCallback(() => {
    const result = calculateDynamicPrice(
      basePrice,
      listedAt,
      expiresAt,
      priceFloorPct
    );
    return {
      currentPrice: result.currentPrice,
      discount: result.discount,
      pctOff: result.pctOff,
      timeRemaining: formatTimeRemaining(result.timeRemainingMs),
      timeRemainingMs: result.timeRemainingMs,
      expired: result.expired,
    };
  }, [basePrice, listedAt, expiresAt, priceFloorPct]);

  const [state, setState] = useState<RealTimePriceState>(compute);

  useEffect(() => {
    // Immediately recalculate when inputs change
    setState(compute());

    // Stop ticking once expired
    if (state.expired) return;

    const id = setInterval(() => {
      const next = compute();
      setState(next);
      if (next.expired) clearInterval(id);
    }, intervalMs);

    return () => clearInterval(id);
  }, [compute, intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
