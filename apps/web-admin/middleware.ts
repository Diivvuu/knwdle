// apps/admin/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = '__knwdle_session';

// put these in env and reference via process.env in prod
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3000';
// https://knwdle.com/auth
const MAIN_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_MAIN_DASHBOARD_URL ??
  'http://localhost:3000/dashboard';

// https://knwdle.com/dashboard

const PUBLIC_PREFIXES = [
  '/_next',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
  '/api',
];

export const config = {
  // everything without a file extension
  matcher: ['/((?!.*\\.).*)'],
};

export function middleware(req: NextRequest) {
  const { pathname, href } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(AUTH_COOKIE)?.value);

  // 1) Always allow assets & API
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2) No session -> send to login app with return URL
  if (!hasSession) {
    const redirect = encodeURIComponent(href);
    return NextResponse.redirect(`${AUTH_URL}?redirect=${redirect}`);
  }

  // 3) Has session: only allow /org/:id(/...)
  if (pathname.startsWith('/org/')) {
    const parts = pathname.split('/').filter(Boolean); // ['org', '<id>', ...]
    if (parts.length >= 2 && parts[1]) {
      return NextResponse.next(); // valid /org/:id
    }
    // path is just /org (no id) -> send to main dashboard (org picker)
    const next = encodeURIComponent(href);
    return NextResponse.redirect(`${MAIN_DASHBOARD_URL}?next=${next}`);
  }

  // 4) Any other path (logged in but outside admin namespace)
  const next = encodeURIComponent(href);
  return NextResponse.redirect(`${MAIN_DASHBOARD_URL}?next=${next}`);
}
