import { auth, signOut } from '@/auth';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';

export default async function UserMenu() {
  const session = await auth();

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden text-sm text-zinc-400 sm:block">
          {session.user.email}
        </div>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
    >
      <User className="h-4 w-4" />
      Sign In
    </Link>
  );
}
