// apps/*/src/providers/app-init.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { getMe, refreshSession, logout } from '@workspace/state';

export default function AppInit() {
  const dispatch = useDispatch<AppDispatch>();
  const ran = useRef(false);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        if (accessToken) {
          await dispatch(getMe()).unwrap();
          return;
        }
        const r = await dispatch(refreshSession());
        if (refreshSession.fulfilled.match(r) && r.payload?.accessToken) {
          await dispatch(getMe()).unwrap();
          return;
        }
        await dispatch(logout());
      } catch {
        await dispatch(logout());
      }
    })();
  }, [dispatch, accessToken]) ;

  return null;
}
