import { auth, signOut } from "@/auth";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

export default async function UserMenu() {
  const session = await auth();

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-zinc-400 hidden sm:block">
          {session.user.email}
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-200 rounded-full transition-colors"
    >
      <User className="w-4 h-4" />
      Sign In
    </Link>
  );
}