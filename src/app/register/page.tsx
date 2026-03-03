'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { register } from '@/app/actions/auth'; // 서버 액션 경로에 맞게 수정하세요
import { Mail, Lock, Sparkles, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    register,
    undefined,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-3xl tracking-tight text-white">
            Join Aura
          </h1>
          <p className="text-sm text-zinc-400">
            Create an account to save your puzzles.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email address"
                required
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 pl-12 text-zinc-100 placeholder-zinc-500 transition-all focus:ring-2 focus:ring-zinc-700 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password"
                required
                minLength={6}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 pl-12 text-zinc-100 placeholder-zinc-500 transition-all focus:ring-2 focus:ring-zinc-700 focus:outline-none"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-400/10 py-2 text-center text-sm text-red-400">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-4 font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-zinc-300 underline underline-offset-4 transition-colors hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
