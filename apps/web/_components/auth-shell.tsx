'use client';

import { ReactNode } from 'react';
import { Card } from '@workspace/ui/components/card';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[calc(100dvh-80px)] w-full items-stretch h-full overflow-hidden">
      {/* animated gradient grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_20%_-10%,oklch(var(--primary)/.12),transparent_60%),radial-gradient(1000px_500px_at_120%_110%,oklch(var(--primary)/.12),transparent_60%)]"
      />
      <div className="mx-auto grid max-w-md place-items-center px-4 py-8 h-full">
        <Card className="w-full backdrop-blur bg-background/80 shadow-xl">
          {children}
        </Card>
      </div>
    </div>
  );
}
