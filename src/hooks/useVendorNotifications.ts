"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface VendorNotification {
  id: string;
  itemId: string;
  itemName: string;
  claimedPrice: number;
  platformFee: number;
  vendorPayout: number;
  claimedAt: string;
  status: string;
  buyerName: string;
  read: boolean;
}

const READ_KEY = "fm_notif_read";

function getReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem(READ_KEY);
    return stored ? new Set<string>(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function useVendorNotifications(
  userId: string | null,
  role: "vendor" | "buyer" | null,
  accessToken: string | null
) {
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as Omit<VendorNotification, "read">[];
      const readIds = getReadIds();
      setNotifications(data.map((n) => ({ ...n, read: readIds.has(n.id) })));
    } catch {
      // ignore network errors
    }
  }, [accessToken]);

  // Initial fetch
  useEffect(() => {
    if (role !== "vendor" || !userId) return;
    void fetchNotifications();
  }, [role, userId, fetchNotifications]);

  // Realtime subscription: new claim inserted for this vendor
  useEffect(() => {
    if (role !== "vendor" || !userId) return;

    const channel = supabase
      .channel(`vendor-claims-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "claims",
          filter: `vendor_id=eq.${userId}`,
        },
        () => {
          // Re-fetch to get full details (item name, buyer name)
          void fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [role, userId, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const allIds = new Set(notifications.map((n) => n.id));
    saveReadIds(allIds);
  }, [notifications]);

  return { notifications, unreadCount, markAllRead };
}
