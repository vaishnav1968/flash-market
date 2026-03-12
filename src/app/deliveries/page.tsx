'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NearbyDelivery } from '@/lib/types';

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { ssr: false });

export default function DeliveriesPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();

  const [deliveries, setDeliveries] = useState<NearbyDelivery[]>([]);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch nearby deliveries
  useEffect(() => {
    if (!latitude || !longitude || !user) return;

    const fetchNearby = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/deliveries/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=10`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch deliveries');
        }

        const data: NearbyDelivery[] = await response.json();
        setDeliveries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
    // Poll every 10 seconds
    const interval = setInterval(fetchNearby, 10000);
    return () => clearInterval(interval);
  }, [latitude, longitude, user]);

  const handleClaimDelivery = useCallback(
    async (delivery: NearbyDelivery) => {
      if (!user) {
        setError('Not authenticated');
        return;
      }

      setClaimingId(delivery.id);

      try {
        // Get the current session with access token
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (!accessToken) {
          throw new Error('No access token available');
        }

        // Optimistically remove from list
        setClaimedIds((prev) => [...prev, delivery.id]);

        const response = await fetch(`/api/deliveries/${delivery.id}/claim`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          // Restore if failed
          setClaimedIds((prev) => prev.filter((id) => id !== delivery.id));
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to claim delivery');
        }

        // Remove from deliveries list
        setDeliveries((prev) => prev.filter((d) => d.id !== delivery.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setClaimingId(null);
      }
    },
    [user]
  );

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center bg-[#0D1117]">
        <h2 className="text-2xl font-bold text-[#E6EDF3]">Delivery Map</h2>
        <p className="max-w-md text-sm text-[#8B949E]">
          Sign in and choose the buyer role to see nearby deliveries on the map and earn credits by claiming them.
        </p>
      </div>
    );
  }

  if (role && role !== 'buyer') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center bg-[#0D1117]">
        <h2 className="text-2xl font-bold text-[#E6EDF3]">Delivery Map</h2>
        <p className="max-w-md text-sm text-[#8B949E]">
          The delivery map is available for buyer accounts. Your current role is <span className="font-semibold text-[#FFD150]">{role}</span>.
        </p>
        <button
          onClick={() => router.push('/auth/role')}
          className="rounded-lg bg-[#FFD150] px-4 py-2 text-sm font-semibold text-[#0D1117] hover:bg-[#FFE380]"
        >
          Change role
        </button>
      </div>
    );
  }

  if (geoLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1117]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#458B73] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8B949E]">Getting your location...</p>
        </div>
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1117]">
        <div className="text-center p-6 border border-[#F26076] rounded-lg bg-[#161B22]">
          <AlertCircle className="mx-auto mb-4 text-[#F26076]" size={32} />
          <h2 className="text-[#E6EDF3] font-bold mb-2">Location Required</h2>
          <p className="text-[#8B949E] text-sm">{geoError}</p>
          <p className="text-[#8B949E] text-sm mt-2">Please enable location access to see nearby deliveries.</p>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1117]">
        <p className="text-[#8B949E]">Location data unavailable</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0D1117]">
      {/* Header */}
      <div className="border-b border-[#21262D] px-6 py-4 bg-[#0D1117]">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase size={24} className="text-[#FFD150]" />
          <h1 className="text-[#E6EDF3] text-2xl font-bold font-mono">NEARBY DELIVERIES</h1>
        </div>
        <p className="text-[#8B949E] text-sm font-mono">
          Earn credits by delivering orders · {deliveries.length} available within 10km
        </p>
      </div>

      {/* Main layout: Map + Feed */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Map */}
        <div className="flex-1 border-r border-[#21262D] overflow-hidden" style={{ minHeight: 0 }}>
          <DeliveryMap
            userLat={latitude}
            userLon={longitude}
            deliveries={deliveries}
            selectedId={selectedId}
            onSelectDelivery={setSelectedId}
          />
        </div>

        {/* Right: Feed */}
        <div className="w-80 overflow-y-auto border-l border-[#21262D] flex flex-col">
          {/* Feed Header */}
          <div className="border-b border-[#21262D] px-4 py-3 bg-[#161B22]">
            <p className="text-[#8B949E] text-xs font-mono">
              $ ls nearby_deliveries --sort=distance
            </p>
          </div>

          {/* Deliveries List */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="m-4 p-3 border border-[#F26076] bg-[#161B22] rounded text-[#F26076] text-sm">
                {error}
              </div>
            )}

            {loading && deliveries.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[#8B949E]">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-[#458B73] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading deliveries...</p>
                </div>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="m-4 p-4 border border-[#21262D] bg-[#161B22] rounded text-center">
                <MapPin size={20} className="mx-auto mb-2 text-[#8B949E]" />
                <p className="text-[#8B949E] text-sm">No nearby deliveries available</p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {deliveries
                  .filter((d) => !claimedIds.includes(d.id))
                  .map((delivery) => (
                    <div
                      key={delivery.id}
                      onClick={() => setSelectedId(delivery.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedId === delivery.id
                          ? 'border-[#FFD150] bg-[#1C1A10]'
                          : 'border-[#21262D] bg-[#161B22] hover:border-[#FFD150]/50'
                      }`}
                    >
                      {/* Vendor & Item */}
                      <h3 className="text-[#FFD150] font-bold text-sm font-mono">
                        {delivery.vendorName}
                      </h3>
                      <p className="text-[#E6EDF3] text-xs mt-1">{delivery.itemName}</p>

                      {/* Distance & Price */}
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <span className="text-cyan-400 flex items-center gap-1">
                          <MapPin size={12} />
                          {delivery.distance.toFixed(1)} km
                        </span>
                        <span className="text-[#8B949E]">₹{delivery.claimedPrice.toFixed(2)}</span>
                      </div>

                      {/* Credit Reward */}
                      <div className="mt-3 p-2 bg-[#0D1117] rounded border border-[#FFD150]/30">
                        <p className="text-[#FFD150] font-bold text-sm">
                          ₹{delivery.creditReward.toFixed(2)} credits
                        </p>
                        <p className="text-[#8B949E] text-xs mt-1">Earned on completion</p>
                      </div>

                      {/* Claim Button */}
                      <button
                        onClick={() => handleClaimDelivery(delivery)}
                        disabled={claimingId === delivery.id}
                        className="w-full mt-4 px-3 py-2 bg-[#FFD150] text-[#0D1117] rounded font-bold text-xs hover:bg-[#FFE380] disabled:opacity-50 transition-colors"
                      >
                        {claimingId === delivery.id ? 'Claiming...' : 'Claim Delivery'}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
