// T056, T057, T064, T065: GET and PATCH /api/studies/[id]
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // T057: RLS handles access check - returns null if no permission
    const { data: study, error } = await supabase
      .from('studies')
      .select('*, owner:users!owner_id(*)')
      .eq('id', params.id)
      .single();

    if (error || !study) {
      return NextResponse.json(
        { error: 'Study not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(study);
  } catch (error: any) {
    console.error('Study fetch error:', error);
    return NextResponse.json(
      { error: 'An error occurred', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // T065: Authorization check - only owner or admin can edit
    const { data: study } = await supabase
      .from('studies')
      .select('owner_id')
      .eq('id', params.id)
      .single();

    if (!study) {
      return NextResponse.json(
        { error: 'Study not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isOwner = study.owner_id === session.user.id;
    const isAdmin = userData?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the study owner or admins can edit studies', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phase, indication, target_enrollment, protocol_data } = body;

    // Validation
    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'Study name cannot be empty', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (target_enrollment !== undefined && target_enrollment !== null) {
      if (!Number.isInteger(target_enrollment) || target_enrollment <= 0) {
        return NextResponse.json(
          { error: 'Target enrollment must be a positive number', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    // Update study
    const { data: updatedStudy, error } = await supabase
      .from('studies')
      .update({
        ...(name !== undefined && { name: name.trim() }),
        ...(phase !== undefined && { phase }),
        ...(indication !== undefined && { indication }),
        ...(target_enrollment !== undefined && { target_enrollment }),
        ...(protocol_data !== undefined && { protocol_data }),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Study update error:', error);
      return NextResponse.json(
        { error: 'Failed to update study', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedStudy);
  } catch (error: any) {
    console.error('Study update error:', error);
    return NextResponse.json(
      { error: 'An error occurred', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
