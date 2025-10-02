import { CookieOptions } from 'express';
import { env, isProd } from './env';

export function sessionCookieOptions(): CookieOptions {
  const base: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  };

  if (isProd && env.COOKIE_DOMAIN) {
    base.domain = env.COOKIE_DOMAIN;
  }
  return base;
}
