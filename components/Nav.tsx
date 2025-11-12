// T043, T044: Navigation bar with logo, links, user email, and sign out
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/database.types';

interface NavProps {
  user: User | null;
}

export function Nav({ user }: NavProps) {
  const router = useRouter();

  // T044: Sign out functionality
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Protocol Extractor
            </Link>
            <Link
              href="/dashboard"
              className="text-base text-gray-600 hover:text-gray-900 font-medium"
            >
              My Studies
            </Link>
            {user && ['pi', 'admin'].includes(user.role) && (
              <Link
                href="/upload"
                className="text-base text-gray-600 hover:text-gray-900 font-medium"
              >
                Upload Protocol
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-base text-gray-700">{user.email}</span>
            )}
            <Button onClick={handleSignOut} variant="secondary">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
