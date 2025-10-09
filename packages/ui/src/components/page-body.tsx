'use client';
import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';

interface PageBodyProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageBody({ children, className }: PageBodyProps) {
  return (
    <div
      className={cn(
        'mt-6 rounded-lg border bg-card p-4 md:p-6 space-y-6 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
