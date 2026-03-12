// ── FlashMarket — Dynamic Pricing Engine ──
//
// Formula:  CurrentPrice = BasePrice × max(TimeRemaining / TotalWindow, FloorPct)
// FloorPct defaults to 0.20 (20%) so vendors always cover basic costs.

/**
 * Calculate the dynamically-discounted price of a perishable item.
 *
 * @param basePrice     Original listing price
 * @param listedAt      ISO timestamp when the item was listed
 * @param expiresAt     ISO timestamp when the item expires
 * @param priceFloorPct Minimum fraction of basePrice (default 0.20 = 20%)
 * @param now           Current time (defaults to Date.now(), injectable for tests)
 * @returns             { currentPrice, discount, timeRemainingMs, expired }
 */
export function calculateDynamicPrice(
  basePrice: number,
  listedAt: string | Date,
  expiresAt: string | Date,
  priceFloorPct = 0.4,
  now: Date = new Date()
) {
  const listedMs = new Date(listedAt).getTime();
  const expiresMs = new Date(expiresAt).getTime();
  const nowMs = now.getTime();

  const totalWindow = expiresMs - listedMs; // total ms
  const timeRemaining = Math.max(expiresMs - nowMs, 0);

  const expired = timeRemaining <= 0;

  // ratio goes from 1.0 (just listed) → 0.0 (expired)
  const rawRatio = totalWindow > 0 ? timeRemaining / totalWindow : 0;

  // clamp at price floor
  const ratio = Math.max(rawRatio, expired ? 0 : priceFloorPct);

  const currentPrice = parseFloat((basePrice * ratio).toFixed(2));
  const discount = parseFloat((basePrice - currentPrice).toFixed(2));

  return {
    currentPrice,
    discount,
    pctOff: basePrice > 0 ? Math.round((discount / basePrice) * 100) : 0,
    timeRemainingMs: timeRemaining,
    expired,
  };
}

/**
 * Human-readable countdown string.
 * e.g. "2h 15m", "45m", "expired"
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
