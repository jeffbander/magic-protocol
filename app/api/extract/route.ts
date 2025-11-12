// T024, T025, T026: Extract API route with PDF conversion and Anthropic integration
import { NextRequest, NextResponse } from 'next/server';
import { extractProtocolData } from '@/lib/anthropic/extract';
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

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!userData || !['pi', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Only PIs and Admins can upload protocols', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('protocol') as File;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'Please select a protocol PDF file to upload', code: 'MISSING_FILE' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          error: 'Only PDF files are accepted',
          code: 'INVALID_FILE_TYPE',
          details: { received_type: file.type },
        },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'Protocol PDF must be 50MB or smaller',
          code: 'FILE_TOO_LARGE',
          details: { size_mb: (file.size / (1024 * 1024)).toFixed(1), max_mb: 50 },
        },
        { status: 400 }
      );
    }

    // T025: Convert PDF to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // T026: Extract data using Anthropic (with 5-minute timeout)
    try {
      const extractedData = await extractProtocolData(base64);

      return NextResponse.json(extractedData);
    } catch (error: any) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'AI extraction took longer than 5 minutes. Please try again with a smaller or clearer PDF.',
            code: 'EXTRACTION_TIMEOUT',
          },
          { status: 408 }
        );
      }

      // Other extraction errors
      return NextResponse.json(
        {
          error: 'Unable to extract study data from this PDF. Please ensure the protocol is clearly formatted.',
          code: 'EXTRACTION_FAILED',
          details: error.message,
        },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      {
        error: 'An error occurred while processing your protocol. Please try again.',
        code: 'EXTRACTION_ERROR',
      },
      { status: 500 }
    );
  }
}
