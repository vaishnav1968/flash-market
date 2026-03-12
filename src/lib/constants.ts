// ── Category helpers ──
import type { ItemCategory } from "@/lib/types";

/** Platform commission deducted from the vendor on every claim (3.5 %) */
export const PLATFORM_COMMISSION_PCT = 0.035;

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  cooked_meal: "🍲 Cooked Meals",
  fresh_produce: "🥬 Fresh Produce",
  dairy: "🧀 Dairy",
  baked_goods: "🍞 Baked Goods",
};

export const CATEGORY_COLORS: Record<ItemCategory, string> = {
  cooked_meal: "bg-orange-100 text-orange-800",
  fresh_produce: "bg-green-100 text-green-800",
  dairy: "bg-blue-100 text-blue-800",
  baked_goods: "bg-amber-100 text-amber-800",
};
