import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = '__knwdle_session';

export const config = {
  matcher: ['/dashboard/:path*'],
};

export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(AUTH_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const redirect = encodeURIComponent(req.nextUrl.toString());
  const url = req.nextUrl.clone();
  ((url.pathname = '/auth'), (url.search = `?redirect=${redirect}`));
  return NextResponse.redirect(url);
}
