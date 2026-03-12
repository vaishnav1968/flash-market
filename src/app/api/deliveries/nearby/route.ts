import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { NearbyDelivery } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Haversine formula to calculate distance in km between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radiusKm = parseFloat(searchParams.get('radiusKm') || '5');

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Fetch available deliveries with related claim, item, and user data
    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(
        `
        id,
        claim_id,
        deliverer_id,
        vendor_id,
        credit_reward,
        status,
        pickup_lat,
        pickup_lon,
        dropoff_lat,
        dropoff_lon,
        created_at,
        picked_up_at,
        completed_at,
        claims!inner(
          claimed_price,
          items!inner(
            name,
            vendors: users!items_vendor_id_fkey(
              full_name,
              shop_name
            )
          )
        ),
        users!deliveries_vendor_id_fkey(
          full_name,
          shop_name
        )
      `
      )
      .eq('status', 'available');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deliveries' },
        { status: 500 }
      );
    }

    if (!deliveries) {
      return NextResponse.json([]);
    }

    // Transform and filter by distance
    const nearbyDeliveries: NearbyDelivery[] = deliveries
      .map((d: any) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          d.pickup_lat,
          d.pickup_lon
        );

        return {
          id: d.id,
          claimId: d.claim_id,
          delivererId: d.deliverer_id,
          vendorId: d.vendor_id,
          creditReward: d.credit_reward,
          status: d.status,
          pickupLat: d.pickup_lat,
          pickupLon: d.pickup_lon,
          dropoffLat: d.dropoff_lat,
          dropoffLon: d.dropoff_lon,
          createdAt: d.created_at,
          pickedUpAt: d.picked_up_at,
          completedAt: d.completed_at,
          itemName: d.claims?.items?.name || 'Unknown Item',
          vendorName: d.users?.shop_name || d.users?.full_name || 'Unknown Vendor',
          claimedPrice: d.claims?.claimed_price || 0,
          distance,
        };
      })
      .filter((d) => d.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json(nearbyDeliveries);
  } catch (error) {
    console.error('Error fetching nearby deliveries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
