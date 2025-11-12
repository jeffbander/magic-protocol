// T037, T040: Auth callback handler to exchange magic link token for session
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // T040: Create user profile in public.users table if it doesn't exist
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.session.user.id)
        .single();

      if (!existingUser) {
        // Get user metadata from signup
        const metadata = data.session.user.user_metadata;

        await supabase.from('users').insert({
          id: data.session.user.id,
          email: data.session.user.email!,
          name: metadata.name || data.session.user.email!.split('@')[0],
          role: metadata.role || 'coordinator',
        });
      }

      // Redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If error or no code, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
