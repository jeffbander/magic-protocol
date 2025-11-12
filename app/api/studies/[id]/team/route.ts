// Phase 7: T069, T070 - Team member management API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('study_members')
      .select('*, user:users(*)')
      .eq('study_id', id);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch team members', code: 'DATABASE_ERROR' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { email, role } = body;

    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: `No user found with email ${email}. User must sign up first.`, code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Add team member
    const { data, error } = await supabase
      .from('study_members')
      .insert({ study_id: id, user_id: user.id, role })
      .select('*, user:users(*)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This user is already a team member on this study', code: 'ALREADY_MEMBER' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add team member', code: 'DATABASE_ERROR' }, { status: 500 });
  }
}
