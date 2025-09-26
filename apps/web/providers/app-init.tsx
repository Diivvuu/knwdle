// e.g. app/providers/app-init.tsx
'use client';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { refreshSession } from '@/redux/slices/auth';

export default function AppInit() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(refreshSession());
  }, [dispatch]);
  return null;
}
