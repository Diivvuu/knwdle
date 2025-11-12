'use client';

import React from 'react';
import { motion } from 'framer-motion';

type SectionNode =
  | { id: string; title: string; node: React.ReactNode; colSpan?: 1 | 2 | 3 }
  | { id: string; node: React.ReactNode; colSpan?: 1 | 2 | 3 }; // bare node (no title)

export function DashboardShell({
  header,
  actions,
  loading,
  error,
  onRetry,
  sections,
  columns = { base: 1, md: 2, lg: 3 },
  className = '',
}: {
  header?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sections: SectionNode[];
  columns?: { base?: 1 | 2; md?: 1 | 2 | 3; lg?: 1 | 2 | 3 | 4 };
  className?: string;
}) {
  if (loading) return <DashboardSkeletonGrid count={6} />;
  if (error) return <DashboardError message={error} onRetry={onRetry} />;

  const gridCols = [
    'grid grid-cols-1 gap-4',
    columns.md ? `md:grid-cols-${columns.md}` : '',
    columns.lg ? `lg:grid-cols-${columns.lg}` : '',
  ].join(' ');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-6 ${className}`}
    >
      {(header || actions) && (
        <div className="flex items-center justify-between">
          <div>{header}</div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}

      <div className={gridCols}>
        {sections.map((s) => (
          <div
            key={s.id}
            className={colSpanClass(s.colSpan ?? 1, columns)}
          >
            {s.node}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function colSpanClass(span: 1 | 2 | 3, columns: { md?: number; lg?: number }) {
  // keep simple: only apply at md+; on mobile it’s single column anyway
  const map = {
    1: '',
    2: 'md:col-span-2',
    3: 'lg:col-span-3',
  } as const;
  return map[span] ?? '';
}

// lightweight re-exports for convenience
export function DashboardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card/80 p-4 animate-pulse"
        >
          <div className="h-2.5 w-24 rounded bg-muted/60" />
          <div className="mt-3 h-7 w-20 rounded bg-muted/50" />
          <div className="mt-5 h-2 w-28 rounded bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

export function DashboardError({
  message,
  onRetry,
}: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900"
    >
      <p className="font-semibold">Something went wrong</p>
      <p className="text-sm mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm hover:bg-rose-100 transition"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}