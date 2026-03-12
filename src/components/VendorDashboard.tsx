"use client";

import { useState } from "react";
import type { CreateItemPayload, ItemCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/constants";

const EMPTY_FORM: CreateItemPayload = {
  name: "",
  description: "",
  category: "cooked_meal",
  basePrice: 0,
  unit: "piece",
  quantity: 1,
  shelfLifeHours: 4,
  imageUrl: "",
  tags: [],
};

interface Props {
  onSubmit: (payload: CreateItemPayload) => void;
}

export default function VendorDashboard({ onSubmit }: Props) {
  const [form, setForm] = useState<CreateItemPayload>(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "basePrice" || name === "shelfLifeHours" || name === "quantity"
          ? parseFloat(value) || 0
          : value,
    }));
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || form.basePrice <= 0) return;
    onSubmit(form);
    setForm(EMPTY_FORM);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100"
    >
      <h2 className="text-xl font-bold text-gray-900">
        📦 Upload New Item
      </h2>

      {submitted && (
        <div className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
          ✅ Item listed successfully! It&apos;s now live on the marketplace.
        </div>
      )}

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Item Name *
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="e.g. Chicken Shawarma Wrap"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="Brief description of the item…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Category + Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Unit
          </label>
          <input
            name="unit"
            value={form.unit}
            onChange={handleChange}
            placeholder="piece, cup, plate…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Price + Quantity + Shelf-life */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Base Price ($) *
          </label>
          <input
            name="basePrice"
            type="number"
            step="0.01"
            min="0.01"
            value={form.basePrice || ""}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            name="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Shelf Life (hours)
          </label>
          <input
            name="shelfLifeHours"
            type="number"
            step="0.5"
            min="0.5"
            value={form.shelfLifeHours}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tags
        </label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        {form.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-emerald-500 hover:text-emerald-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price preview */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500 uppercase">
          Pricing Preview
        </p>
        <p className="mt-1 text-sm text-gray-700">
          Base: <span className="font-bold">${form.basePrice.toFixed(2)}</span>
          {" → "}
          Floor (20%):{" "}
          <span className="font-bold text-emerald-600">
            ${(form.basePrice * 0.2).toFixed(2)}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          Price will decay linearly over {form.shelfLifeHours}h, never below the
          20% floor.
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
      >
        🚀 List Item on FlashMarket
      </button>
    </form>
  );
}
