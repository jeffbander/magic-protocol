// T046, T051-T054: Dashboard page with study list, empty state, and Upload button
import { createClient } from '@/lib/supabase/server';
import { StudyCard } from '@/components/StudyCard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Suspense } from 'react';

// T053: Loading skeleton
function StudyListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
}

async function StudyList() {
  const supabase = await createClient();

  // Get current user and their role
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', session!.user.id)
    .single();

  // T047, T048: Fetch studies with aggregated counts (RLS handles access control)
  const { data: studies } = await supabase
    .from('studies')
    .select('*')
    .order('created_at', { ascending: false });

  // T052: Empty state with role-specific messaging
  if (!studies || studies.length === 0) {
    const isPI = userData?.role === 'pi' || userData?.role === 'admin';

    return (
      <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">No Studies Yet</h2>
        <p className="text-base text-gray-600 mb-6">
          {isPI
            ? "You haven't created any studies yet. Upload a protocol to get started!"
            : "You haven't been assigned to any studies yet. Contact your PI to be added to a study."}
        </p>
        {isPI && (
          <Link href="/upload">
            <Button>Upload Protocol</Button>
          </Link>
        )}
      </div>
    );
  }

  // T051: Render study list with StudyCard
  return (
    <div className="space-y-4">
      {studies.map((study) => (
        <StudyCard key={study.id} study={study} />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', session!.user.id)
    .single();

  const showUploadButton = userData?.role === 'pi' || userData?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Studies</h1>
        {/* T054: Upload Protocol button for PIs and Admins */}
        {showUploadButton && (
          <Link href="/upload">
            <Button>Upload Protocol</Button>
          </Link>
        )}
      </div>

      {/* T053: Suspense with loading skeleton */}
      <Suspense fallback={<StudyListSkeleton />}>
        <StudyList />
      </Suspense>
    </div>
  );
}
