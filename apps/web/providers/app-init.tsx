// apps/*/src/providers/app-init.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { refreshSession } from '@/redux/slices/auth';

export default function AppInit() {
  const dispatch = useDispatch<AppDispatch>();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    dispatch(refreshSession());
  }, [dispatch]);

  return null;
}
