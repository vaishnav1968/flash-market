import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token and get user ID
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Update delivery: mark as picked_up, set deliverer_id, set picked_up_at
    const { data: delivery, error: updateError } = await supabase
      .from('deliveries')
      .update({
        status: 'picked_up',
        deliverer_id: user.id,
        picked_up_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'available') // Prevent double-claiming
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: 'Delivery not found or already claimed' },
          { status: 404 }
        );
      }
      throw updateError;
    }

    // Emit a notification to the vendor
    // (This would trigger Realtime subscription on the vendor's notifications)

    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Error claiming delivery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
