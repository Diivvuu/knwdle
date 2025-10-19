// apps/*/src/hooks/use-auth.ts
'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export function useAuth() {
  const { user, accessToken, status } = useSelector((s: RootState) => s.auth);
  const isAuthed = Boolean(user && accessToken);
  const isLoading = status === 'loading';
  const isIdle = status === 'idle';
  return { user, accessToken, isAuthed, isLoading, isIdle, status };
}
