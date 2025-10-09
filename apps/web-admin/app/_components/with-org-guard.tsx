'use client';
import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export default function withOrgGuard<T>(
  Wrapped: React.ComponentType<T>,
  opts: { requireRoles: ('admin' | 'staff' | 'student' | 'parent')[] }
) {
  return function Guarded(props: any) {
    const { requireRoles } = opts;
    const user = useSelector((s: RootState) => s.auth.user);
    // infer orgId from props or URL param via window.location (SSR-safe fallback avoided since this is client)
    const orgId =
      typeof window !== 'undefined'
        ? window.location.pathname.split('/')[2]
        : '';
    const membership = user?.memberships?.find((m: any) => m.org?.id === orgId);
    const role = membership?.role as string | undefined;

    if (!orgId) return <NotFound state="missing-org" />;
    if (!role || !requireRoles.includes(role as any)) return <Forbidden />;

    return <Wrapped {...(props as T)} />;
  };
}

function Forbidden() {
  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <h2 className="text-2xl font-semibold">403 • Forbidden</h2>
      <p className="text-sm text-muted-foreground mt-2">
        You don’t have access to this organisation.
      </p>
      <Link href="/">
        <span className="inline-block mt-4 underline">Go Home</span>
      </Link>
    </div>
  );
}
function NotFound({ state }: { state?: string }) {
  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <h2 className="text-2xl font-semibold">404 • Not Found</h2>
      <p className="text-sm text-muted-foreground mt-2">
        We couldn’t find that organisation.
      </p>
      {state ? (
        <p className="text-xs text-muted-foreground mt-1">State: {state}</p>
      ) : null}
      <Link href="/">
        <span className="inline-block mt-4 underline">Go Home</span>
      </Link>
    </div>
  );
}
