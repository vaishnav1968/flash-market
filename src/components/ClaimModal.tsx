"use client";

import { useState } from "react";

interface Props {
  itemName: string;
  price: number;
  quantity: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ClaimModal({
  itemName,
  price,
  quantity,
  onConfirm,
  onCancel,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
          <span className="text-5xl">🎉</span>
          <h3 className="mt-3 text-lg font-bold text-gray-900">Claimed!</h3>
          <p className="mt-2 text-sm text-gray-600">
            Head to the vendor&apos;s shop and pay{" "}
            <span className="font-bold text-emerald-600">
              ₹{price.toFixed(2)}
            </span>{" "}
            in person for{" "}
            <span className="font-semibold">
              {quantity > 1 ? `${quantity}× ` : ""}{itemName}
            </span>.
          </p>
          <button
            onClick={onCancel}
            className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">
          Claim &amp; Pay at Shop
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          You&apos;re claiming{" "}
          <span className="font-semibold">
            {quantity > 1 ? `${quantity}× ` : ""}{itemName}
          </span>{" "}at the current
          flash price of{" "}
          <span className="font-bold text-emerald-600">
            ₹{price.toFixed(2)}
          </span>
          {quantity > 1 && (
            <span className="text-xs text-gray-400">
              {" "}(₹{(price / quantity).toFixed(2)} each)
            </span>
          )}
          . No online payment — just show up and pay the vendor directly.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              setConfirmed(true);
            }}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            ✅ Confirm Claim
          </button>
        </div>
      </div>
    </div>
  );
}
