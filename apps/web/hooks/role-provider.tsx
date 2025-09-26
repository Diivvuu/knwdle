'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AudienceKey = 'students' | 'parents' | 'educators' | 'institutions';

const DEFAULT_AUDIENCE: AudienceKey = 'institutions';

interface RoleContextType {
  audience: AudienceKey;
  setAudience: (a: AudienceKey) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within <RoleProvider>');
  return ctx;
}

function getInitialAudience(): AudienceKey {
  if (typeof window === 'undefined') return DEFAULT_AUDIENCE;
  // Priority: ?audience= → localStorage → default
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get('audience') as AudienceKey | null;
  const valid = ['students', 'parents', 'educators', 'institutions'] as const;
  if (fromQuery && (valid as readonly string[]).includes(fromQuery))
    return fromQuery;
  const stored = window.localStorage.getItem(
    'knwdle.audience'
  ) as AudienceKey | null;
  if (stored && (valid as readonly string[]).includes(stored)) return stored;
  return DEFAULT_AUDIENCE;
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [audience, setAudienceState] = useState<AudienceKey>(DEFAULT_AUDIENCE);

  useEffect(() => {
    setAudienceState(getInitialAudience());
  }, []);

  const setAudience = (a: AudienceKey) => {
    setAudienceState(a);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('knwdle.audience', a);
      const url = new URL(window.location.href);
      url.searchParams.set('audience', a);
      window.history.replaceState({}, '', url);
    }
  };

  const value = useMemo(() => ({ audience, setAudience }), [audience]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
