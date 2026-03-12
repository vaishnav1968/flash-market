"use client";

import { useState } from "react";
import type { FulfillmentMethod } from "@/lib/types";

interface Props {
  itemName: string;
  price: number;
  quantity: number;
  deliveryDistanceKm?: number | null;
  deliveryFee?: number | null;
  deliveryUnavailableReason?: string | null;
  onConfirm: (fulfillmentMethod: FulfillmentMethod) => Promise<boolean>;
  onCancel: () => void;
}

export default function ClaimModal({
  itemName,
  price,
  quantity,
  deliveryDistanceKm,
  deliveryFee,
  deliveryUnavailableReason,
  onConfirm,
  onCancel,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("pickup");

  const canDeliver = deliveryFee != null && deliveryDistanceKm != null;
  const totalPrice =
    price + (fulfillmentMethod === "delivery" && deliveryFee != null ? deliveryFee : 0);

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow-2xl">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#39D353]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#7D8590]">
              CLAIM CONFIRMED
            </span>
          </div>
          <span className="text-5xl">🎉</span>
          <h3 className="mt-3 text-lg font-bold text-[#458B73]">
            Claimed!
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {fulfillmentMethod === "delivery" ? (
              <>
                Delivery requested. Pay{" "}
                <span className="font-bold text-gray-900">₹{totalPrice.toFixed(2)}</span>{" "}
                total, including{" "}
                <span className="font-semibold text-[#458B73]">₹{deliveryFee?.toFixed(2)} delivery</span>, for{" "}
                <span className="font-semibold">
                  {quantity > 1 ? `${quantity}× ` : ""}{itemName}
                </span>.
              </>
            ) : (
              <>
                Head to the vendor&apos;s shop and pay{" "}
                <span className="font-bold text-gray-900">₹{price.toFixed(2)}</span>{" "}
                in person for{" "}
                <span className="font-semibold">
                  {quantity > 1 ? `${quantity}× ` : ""}{itemName}
                </span>.
              </>
            )}
          </p>
          <button
            onClick={onCancel}
            className="mt-5 w-full rounded-lg bg-[#458B73] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[#458B73]/90"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900">
          Confirm Order
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Claiming{" "}
          <span className="font-semibold text-gray-900">
            {quantity > 1 ? `${quantity}× ` : ""}{itemName}
          </span>{" "}
          at flash price{" "}
          <span className="font-bold text-gray-900">₹{price.toFixed(2)}</span>
          {quantity > 1 && (
            <span className="text-gray-600"> (₹{(price / quantity).toFixed(2)}/each)</span>
          )}.
        </p>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => setFulfillmentMethod("pickup")}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              fulfillmentMethod === "pickup"
                ? "border-[#458B73] bg-[#EEF6F3]"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">Pick up myself</p>
            <p className="mt-1 text-xs text-gray-600">
              Pay ₹{price.toFixed(2)} directly at the vendor shop.
            </p>
          </button>
          <button
            type="button"
            disabled={!canDeliver}
            onClick={() => {
              if (canDeliver) {
                setFulfillmentMethod("delivery");
              }
            }}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              !canDeliver
                ? "cursor-not-allowed border-gray-200 bg-gray-50"
                : fulfillmentMethod === "delivery"
                ? "border-[#458B73] bg-[#EEF6F3]"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">Deliver to me</p>
            {canDeliver ? (
              <p className="mt-1 text-xs text-gray-600">
                Distance {deliveryDistanceKm?.toFixed(1)} km · Delivery fee ₹{deliveryFee?.toFixed(2)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                {deliveryUnavailableReason ?? "Delivery is unavailable because location data is missing."}
              </p>
            )}
          </button>
        </div>
        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Total payable: <span className="font-semibold text-gray-900">₹{totalPrice.toFixed(2)}</span>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              const success = await onConfirm(fulfillmentMethod);
              setSubmitting(false);
              if (success) {
                setConfirmed(true);
              }
            }}
            className="flex-1 rounded-lg bg-[#458B73] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[#458B73]/90 active:scale-95"
          >
            {submitting ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
