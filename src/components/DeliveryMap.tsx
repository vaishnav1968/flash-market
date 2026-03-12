'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import type { NearbyDelivery } from '@/lib/types';

// Dynamic import guard – maplibre-gl uses browser APIs
let maplibregl: typeof import('maplibre-gl') | null = null;

interface Props {
  userLat: number;
  userLon: number;
  deliveries: NearbyDelivery[];
  selectedId: string | null;
  onSelectDelivery: (id: string) => void;
}

export default function DeliveryMap({
  userLat,
  userLon,
  deliveries,
  selectedId,
  onSelectDelivery,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const markersRef = useRef<Map<string, import('maplibre-gl').Marker>>(new Map());
  const userMarkerRef = useRef<import('maplibre-gl').Marker | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    import('maplibre-gl').then((lib) => {
      if (cancelled || mapRef.current) return;
      maplibregl = lib;

      const map = new lib.Map({
        container: containerRef.current!,
        // OpenFreeMap – free vector tiles, no token required
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [userLon, userLat],
        zoom: 12,
      });

      mapRef.current = map;

      // User location marker (blue dot)
      const userEl = document.createElement('div');
      userEl.className = 'user-marker';
      userEl.style.cssText = `
        width: 16px; height: 16px;
        background: #3B82F6; border: 3px solid white;
        border-radius: 50%; box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
      `;

      userMarkerRef.current = new lib.Marker({ element: userEl })
        .setLngLat([userLon, userLat])
        .setPopup(new lib.Popup({ offset: 20 }).setText('You are here'))
        .addTo(map);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // Keep user marker in sync with location
  useEffect(() => {
    userMarkerRef.current?.setLngLat([userLon, userLat]);
  }, [userLat, userLon]);

  // Sync delivery markers
  useEffect(() => {
    if (!mapRef.current || !maplibregl) return;
    const lib = maplibregl;
    const map = mapRef.current;

    const currentIds = new Set(deliveries.map((d) => d.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add / update markers
    deliveries.forEach((delivery) => {
      const isSelected = delivery.id === selectedId;

      if (markersRef.current.has(delivery.id)) {
        // Update colour if selection changed
        const el = markersRef.current.get(delivery.id)!.getElement();
        el.style.background = isSelected ? '#FFD150' : '#458B73';
        el.style.transform = isSelected ? 'scale(1.25)' : 'scale(1)';
        return;
      }

      const el = document.createElement('div');
      el.style.cssText = `
        width: 14px; height: 14px;
        background: ${isSelected ? '#FFD150' : '#458B73'};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.15s, background 0.15s;
        transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
      `;

      const popup = new lib.Popup({ offset: 18, closeButton: false })
        .setHTML(
          `<div style="font-family:sans-serif;font-size:12px;line-height:1.4">
            <strong>${delivery.vendorName}</strong><br/>
            ${delivery.itemName}<br/>
            <span style="color:#458B73">📦 ${delivery.distance.toFixed(1)} km · ₹${delivery.creditReward.toFixed(2)} credits</span>
          </div>`
        );

      const marker = new lib.Marker({ element: el })
        .setLngLat([delivery.pickupLon, delivery.pickupLat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        onSelectDelivery(delivery.id);
      });

      markersRef.current.set(delivery.id, marker);
    });
  }, [deliveries, selectedId, onSelectDelivery]);

  // Fly to selected delivery
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const delivery = deliveries.find((d) => d.id === selectedId);
    if (!delivery) return;
    mapRef.current.flyTo({
      center: [delivery.pickupLon, delivery.pickupLat],
      zoom: 14,
      duration: 800,
    });
  }, [selectedId, deliveries]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  );
}
