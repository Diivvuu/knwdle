// apps/*/src/providers/app-init.tsx
'use client';
import { useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { getMe, refreshSession, logout } from '@workspace/state';
import { usePathname } from 'next/navigation';

const REFRESH_DEAD_KEY = '__knw_refresh_dead';

export function isProtectedPath(pathname?: string | null): boolean {
  if (!pathname) return false;
  // Landing and auth are unprotected; everything else protected
  return pathname !== '/' && !pathname.startsWith('/auth');
}

export default function AppInit() {
  const dispatch = useDispatch<AppDispatch>();
  const ran = useRef(false);
  const pathname = usePathname();

  // Compute once per pathname change; do NOT early-return before hooks
  const onProtectedRoute = useMemo(() => isProtectedPath(pathname), [pathname]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Guard: if not on a protected route, do nothing
    if (!onProtectedRoute) return;

    // Guard: if we previously hard-reset auth (no server session), skip all calls
    let refreshDead = false;
    try {
      refreshDead =
        typeof window !== 'undefined' &&
        localStorage.getItem(REFRESH_DEAD_KEY) === '1';
    } catch {}
    if (refreshDead) return;

    (async () => {
      try {
        // Try server-side refresh ONLY on protected pages
        const r = await dispatch(refreshSession());

        if (refreshSession.fulfilled.match(r) && r.payload?.accessToken) {
          await dispatch(getMe()).unwrap();
          return;
        }

        // No token from refresh ⇒ consider logged-out, no further calls
        await dispatch(logout());
      } catch {
        // Any error ⇒ logged-out, no further calls
        await dispatch(logout());
      }
    })();
  }, [dispatch, onProtectedRoute]);

  return null;
}
