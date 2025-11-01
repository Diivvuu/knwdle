'use client';
import React from 'react';

export function DashboardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 animate-pulse"
        >
          <div className="h-2.5 w-24 rounded bg-muted/60" />
          <div className="mt-3 h-7 w-20 rounded bg-muted/50" />
          <div className="mt-5 h-2 w-28 rounded bg-muted/40" />
        </div>
      ))}
    </div>
  );
}