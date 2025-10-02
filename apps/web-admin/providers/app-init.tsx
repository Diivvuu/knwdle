// apps/*/src/providers/app-init.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { getMe, refreshSession } from '@workspace/state';

export default function AppInit() {
  const dispatch = useDispatch<AppDispatch>();
  const ran = useRef(false);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      // If in-memory token is empty (reload/HMR), try one refresh first.
      if (!accessToken) {
        try {
          await dispatch(refreshSession()).unwrap();
        } catch {}
      }
      // Then fetch profile (interceptor still protects with refresh-on-401).
      try {
        await dispatch(getMe()).unwrap();
      } catch {}
    })();
  }, [dispatch, accessToken]);

  return null;
}
