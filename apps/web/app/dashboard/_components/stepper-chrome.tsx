// apps/web/src/components/create-org/StepperChrome.tsx
'use client';

import * as React from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils'; // if you have a cn util; otherwise inline classes
import { Button } from '@workspace/ui/components/button';

type StepperHeaderProps = {
  step: number;
  steps?: string[]; // default: ['Team', 'Type', 'Details']
  onStepChange?: (i: number) => void;
  onBack?: () => void; // optional custom back
  canBack?: boolean; // controls back button state
};

export function StepperHeader({
  step,
  steps = ['Team', 'Type', 'Details'],
  onStepChange,
  onBack,
  canBack = step > 0,
}: StepperHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10',
        // layered gradient that works in light + dark
        'bg-[radial-gradient(1200px_600px_at_0%_0%,hsl(var(--muted)/0.6),transparent),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]',
        'backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b'
      )}
      role="navigation"
      aria-label="Create organisation steps"
    >
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        {/* Left: Back */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={onBack}
            disabled={!canBack}
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>

        {/* Center: Segmented steps */}
        <ol className="flex items-center gap-2" role="tablist">
          {steps.map((label, i) => {
            const done = i < step;
            const active = i === step;

            return (
              <li key={label} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onStepChange?.(i)}
                  className={cn(
                    'group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary/50',
                    done
                      ? 'bg-primary text-primary-foreground border-primary'
                      : active
                        ? 'bg-muted text-foreground border-border'
                        : 'bg-transparent text-muted-foreground border-border hover:bg-muted/50'
                  )}
                >
                  <span
                    className={cn(
                      'grid place-items-center h-5 w-5 rounded-full border',
                      done
                        ? 'border-primary-foreground/50 bg-primary-foreground/20'
                        : active
                          ? 'border-foreground/20 bg-foreground/5'
                          : 'border-border bg-transparent'
                    )}
                    aria-hidden
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="font-medium">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Right: subtle helper */}
        <div className="text-[11px] text-muted-foreground hidden sm:block">
          Your progress is saved
        </div>
      </div>

      {/* Track underneath (subtle, not a big bar) */}
      <div className="px-5 pb-2">
        <div className="relative h-1 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--muted)/.6),transparent)]" />
          <div
            className="relative h-full bg-primary/70 transition-all"
            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
