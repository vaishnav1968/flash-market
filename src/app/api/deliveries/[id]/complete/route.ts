import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
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

    // Verify that the user is the deliverer
    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('deliverer_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    if (delivery.deliverer_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the deliverer can complete this delivery' },
        { status: 403 }
      );
    }

    if (delivery.status !== 'picked_up') {
      return NextResponse.json(
        { error: 'Delivery must be in picked_up status to complete' },
        { status: 400 }
      );
    }

    // Update delivery: mark as completed
    const { data: completedDelivery, error: updateError } = await supabase
      .from('deliveries')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Trigger will automatically transfer credits via process_delivery_completion()

    return NextResponse.json(completedDelivery);
  } catch (error) {
    console.error('Error completing delivery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
