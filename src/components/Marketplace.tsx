"use client";

import { useState, useMemo } from "react";
import type { Item, ItemCategory } from "@/lib/types";
import ItemCard from "./ItemCard";
import { CATEGORY_LABELS } from "@/lib/constants";

interface Props {
  items: Item[];
  onClaim: (itemId: string, price: number, quantity: number) => void;
  loading?: boolean;
}

const ALL = "all" as const;
type Filter = ItemCategory | typeof ALL;

export default function Marketplace({ items, onClaim, loading }: Props) {
  const [filter, setFilter] = useState<Filter>(ALL);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter !== ALL && item.category !== filter) return false;
      if (
        search &&
        !item.name.toLowerCase().includes(search.toLowerCase()) &&
        !item.tags.some((t) => t.includes(search.toLowerCase()))
      )
        return false;
      return true;
    });
  }, [items, filter, search]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(ALL)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === ALL
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as ItemCategory)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-4xl mb-2 animate-pulse">⚡</span>
          <p className="text-sm">Loading items from Supabase…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-4xl mb-2">🔎</span>
          <p className="text-sm">No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} onClaim={onClaim} />
          ))}
        </div>
      )}
    </div>
  );
}
