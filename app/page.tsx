import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  // If not authenticated, redirect to login
  redirect('/login');
}
