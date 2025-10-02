// apps/web/src/components/create-org/MagicDialogShell.tsx
'use client';

import * as React from 'react';
import { Dialog, DialogContent } from '@workspace/ui/components/dialog';

type ShellProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
};

export default function MagicDialogShell({
  open,
  onOpenChange,
  children,
}: ShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden md:rounded-2xl sm:max-w-[980px] w-[92vw]
              border border-border/80 elev-2
              bg-[radial-gradient(1200px_800px_at_50%_-20%,hsl(var(--muted)/.65),transparent),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]
              data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
              data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      >
        <div className="bg-card">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
