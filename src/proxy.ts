import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authRateLimit } from '@/utils/rateLimit';

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/login'
  ) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

    const { success, pending, limit, reset, remaining } =
      await authRateLimit.limit(ip);

    if (pending) await pending;

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Too many authentication attempts. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
