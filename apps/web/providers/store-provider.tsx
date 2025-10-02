'use client';

import { ReactNode } from 'react';
import { ReduxProvider } from '@workspace/state';
import { store } from '@/store/store';

export function ReduxWrapper({ children }: { children: ReactNode }) {
  return <ReduxProvider store={store}>{children}</ReduxProvider>;
}
