'use client';

import * as React from 'react';
import { z } from 'zod';
import { cn } from '@workspace/ui/lib/utils';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';

export const TeamSizeSchema = z
  .union([
    z.string().regex(/^(\d+|\d+\+|\d+\-\d+)$/), // "37" | "50+" | "1-10"
    z.literal(''),
  ])
  .optional();

export type TeamSizeValue = string;

export function TeamSizePicker({
  value,
  onChange,
  label = 'Approximate team size (optional)',
  className,
  options = ['1-10', '11-50', '50+', '100+'],
}: {
  value: TeamSizeValue;
  onChange: (v: TeamSizeValue) => void;
  label?: string;
  className?: string;
  options?: string[];
}) {
  const [custom, setCustom] = React.useState('');
  const [showCustom, setShowCustom] = React.useState(false);
  const customRef = React.useRef<HTMLInputElement>(null);

  const isSelected = (v: string) => value === v;
  const isValid = !value || /^(\d+|\d+\+|\d+\-\d+)$/.test(value);
  const isCustomValue = Boolean(value) && !options.includes(value!);
  React.useEffect(() => {
    if (isCustomValue) {
      setShowCustom(true);
    }
  }, [isCustomValue]);

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm">{label}</Label>

      <div
        className="flex flex-col gap-2"
        role="radiogroup"
        aria-label="Team size options"
      >
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              setShowCustom(false);
              onChange(opt);
            }}
            className={cn(
              'h-10 w-full rounded-md border text-sm transition-all outline-none px-3 text-left',
              'hover:shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/50',
              isSelected(opt)
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-border/70 hover:border-border'
            )}
            role="radio"
            aria-checked={isSelected(opt)}
          >
            {opt}
          </button>
        ))}

        {/* Custom option toggle */}
        <button
          type="button"
          onClick={() => {
            setShowCustom(true);
            setTimeout(() => customRef.current?.focus(), 10);
          }}
          className={cn(
            'h-10 w-full rounded-md border text-sm transition-all outline-none px-3 text-left',
            'hover:shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/50',
            isCustomValue || showCustom
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'border-border/70 hover:border-border'
          )}
          role="radio"
          aria-checked={isCustomValue || showCustom}
        >
          Custom…
        </button>
      </div>

      {(showCustom || isCustomValue) && (
        <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-center">
          <Input
            ref={customRef}
            inputMode="numeric"
            placeholder="Enter a number e.g. 37"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ''))}
          />
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => custom && onChange(custom)}
            disabled={!custom}
          >
            Use number
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Pick a bucket or choose Custom to enter an exact number. You can change this later.
      </p>

      {!isValid && (
        <p className="text-xs text-destructive">
          Please enter a number or a bucket like 1-10 or 50+.
        </p>
      )}

      {value && (
        <div>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setShowCustom(false);
              setCustom('');
              onChange('');
            }}
          >
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}
