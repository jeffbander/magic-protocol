// Phase 8: T083, T084 - Patient management API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get study for target enrollment
    const { data: study } = await supabase
      .from('studies')
      .select('target_enrollment')
      .eq('id', params.id)
      .single();

    // Get patients
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .eq('study_id', params.id)
      .order('enrolled_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      enrolled_count: patients?.length || 0,
      target_enrollment: study?.target_enrollment || 0,
      patients: patients || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch patients', code: 'DATABASE_ERROR' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, enrolled_date } = body;

    // Validate name
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Patient name is required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Validate enrolled_date not in future
    const enrolledDate = new Date(enrolled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (enrolledDate > today) {
      return NextResponse.json({ error: 'Enrollment date cannot be in the future', code: 'INVALID_DATE' }, { status: 400 });
    }

    // Add patient
    const { data, error } = await supabase
      .from('patients')
      .insert({ study_id: params.id, name: name.trim(), enrolled_date })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add patient', code: 'DATABASE_ERROR' }, { status: 500 });
  }
}
