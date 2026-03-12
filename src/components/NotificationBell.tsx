"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useVendorNotifications,
  type VendorNotification,
} from "@/hooks/useVendorNotifications";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationItem({ n }: { n: VendorNotification }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${
        n.read ? "bg-white" : "bg-[#458B73]/5"
      }`}
    >
      <span className="text-xl mt-0.5">🛒</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {n.buyerName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          claimed <span className="font-medium text-gray-700">{n.itemName}</span>
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-xs text-[#FF9760] font-bold">
            ₹{n.claimedPrice.toFixed(2)}
          </p>
          <span className="text-[10px] text-gray-300">•</span>
          <p className="text-[11px] text-[#458B73] font-semibold">
            You receive ₹{n.vendorPayout.toFixed(2)}
          </p>
        </div>
        <p className="text-[10px] text-gray-400">
          Platform fee: ₹{n.platformFee.toFixed(2)} (3.5%)
        </p>
      </div>
      <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
        {timeAgo(n.claimedAt)}
      </span>
    </div>
  );
}

export default function NotificationBell() {
  const { user, role, session } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAllRead } = useVendorNotifications(
    user?.id ?? null,
    role,
    session?.access_token ?? null
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  // Mark all read when dropdown is opened
  function handleOpen() {
    setOpen((v) => {
      if (!v && unreadCount > 0) markAllRead();
      return !v;
    });
  }

  if (role !== "vendor") return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F26076] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h4 className="text-sm font-bold text-gray-900">
              Claim Notifications
            </h4>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-medium text-[#458B73] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <span className="text-3xl">🔔</span>
                <p className="mt-2 text-xs">No claims yet</p>
              </div>
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} n={n} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
