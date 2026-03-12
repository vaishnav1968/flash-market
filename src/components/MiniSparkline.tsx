"use client";

import { useMemo } from "react";
import { calculateDynamicPrice } from "@/lib/pricing";

interface Props {
  basePrice: number;
  listedAt: string;
  expiresAt: string;
  priceFloorPct: number;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Inline SVG sparkline showing the price-decay curve over an item's shelf life.
 * Samples 24 evenly-spaced points. The portion up to "now" is bright; the
 * remaining future portion is dimmed. A dot marks the current price position.
 */
export function MiniSparkline({
  basePrice,
  listedAt,
  expiresAt,
  priceFloorPct,
  width = 72,
  height = 24,
  color = "#FF9760",
}: Props) {
  const { allCoords, pastCount, dotPos } = useMemo(() => {
    const listedMs = new Date(listedAt).getTime();
    const expiresMs = new Date(expiresAt).getTime();
    const nowMs = Date.now();
    const totalMs = Math.max(expiresMs - listedMs, 1);
    const STEPS = 24;
    const pad = 2;

    const prices = Array.from({ length: STEPS + 1 }, (_, i) => {
      const t = new Date(listedMs + (totalMs * i) / STEPS);
      return calculateDynamicPrice(
        basePrice,
        listedAt,
        expiresAt,
        priceFloorPct,
        t
      ).currentPrice;
    });

    const floor = basePrice * priceFloorPct;
    const range = basePrice - floor || 1;

    const coords = prices.map((p, i) => ({
      x: pad + (i / STEPS) * (width - pad * 2),
      y: pad + (1 - (p - floor) / range) * (height - pad * 2),
    }));

    // How many samples are in the past
    const elapsed = Math.min(1, Math.max(0, (nowMs - listedMs) / totalMs));
    const nowIdx = Math.round(elapsed * STEPS);

    return {
      allCoords: coords,
      pastCount: Math.max(2, nowIdx + 1),
      dotPos: coords[Math.min(nowIdx, STEPS)] ?? coords[0],
    };
  }, [basePrice, listedAt, expiresAt, priceFloorPct, width, height]);

  const toPolyline = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible shrink-0"
      aria-hidden="true"
    >
      {/* Full curve – dimmed future */}
      <polyline
        points={toPolyline(allCoords)}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Past portion – bright */}
      <polyline
        points={toPolyline(allCoords.slice(0, pastCount))}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current position dot */}
      {dotPos && <circle cx={dotPos.x} cy={dotPos.y} r="2.5" fill={color} />}
    </svg>
  );
}
