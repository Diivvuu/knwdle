import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = '__knwdle_session';

export const config = {
  matcher: [
    // Protect everything except: landing (/), /auth, Next internals, API, and static assets with extensions
    '/((?!auth|$|_next/static|_next/image|api|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|apple-touch-icon\\.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml|json|woff|woff2|ttf|otf)).*)',
  ],
};

export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(AUTH_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const redirect = encodeURIComponent(req.nextUrl.toString());
  const url = req.nextUrl.clone();
  ((url.pathname = '/auth'), (url.search = `?redirect=${redirect}`));
  return NextResponse.redirect(url);
}
