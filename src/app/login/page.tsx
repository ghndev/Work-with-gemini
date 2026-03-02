"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "@/app/actions/auth";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-sm space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif tracking-tight text-white">Welcome Back</h1>
          <p className="text-zinc-400 text-sm">Sign in to continue your puzzle journey.</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email address"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 pl-12 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 pl-12 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-xl">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-zinc-500">
          Don't have an account?{" "}
          <Link href="/register" className="text-zinc-300 hover:text-white transition-colors underline underline-offset-4">
            Create one
          </Link>
        </div>
        
      </div>
    </main>
  );
}