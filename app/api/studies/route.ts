// T030, T033, T034: POST /api/studies - Create study with validation and owner assignment
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
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

    const body = await request.json();
    const { name, phase, indication, target_enrollment, protocol_data } = body;

    // T033: Validation - study name is non-empty
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Study name is required', code: 'VALIDATION_ERROR', field: 'name' },
        { status: 400 }
      );
    }

    // T033: Validation - target_enrollment is positive integer if provided
    if (target_enrollment !== null && target_enrollment !== undefined) {
      if (!Number.isInteger(target_enrollment) || target_enrollment <= 0) {
        return NextResponse.json(
          {
            error: 'Target enrollment must be a positive number',
            code: 'VALIDATION_ERROR',
            field: 'target_enrollment',
          },
          { status: 400 }
        );
      }
    }

    // Validate protocol_data structure
    if (!protocol_data || !protocol_data.inclusion_criteria || !protocol_data.exclusion_criteria || !protocol_data.visit_schedule) {
      return NextResponse.json(
        { error: 'Protocol data must include inclusion_criteria, exclusion_criteria, and visit_schedule', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // T034: Assign owner_id from authenticated user
    const { data: study, error: insertError } = await supabase
      .from('studies')
      .insert({
        name: name.trim(),
        phase,
        indication,
        target_enrollment,
        protocol_data,
        owner_id: session.user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Study creation error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create study', code: 'DATABASE_ERROR', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(study, { status: 201 });
  } catch (error: any) {
    console.error('Study creation error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the study', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET /api/studies - Fetch all accessible studies for dashboard
export async function GET(request: NextRequest) {
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

    // RLS policies handle access control automatically
    const { data: studies, error } = await supabase
      .from('studies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Studies fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch studies', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(studies || []);
  } catch (error: any) {
    console.error('Studies fetch error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching studies', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
