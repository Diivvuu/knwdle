'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@workspace/ui/lib/utils';

type LabelVariant =
  | 'default'
  | 'muted'
  | 'success'
  | 'warning'
  | 'info'
  | 'error';

const variantClass: Record<LabelVariant, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning-foreground',
  info: 'text-info-foreground',
  error: 'text-destructive',
};

export interface LabelProps
  extends React.ComponentProps<typeof LabelPrimitive.Root> {
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  variant?: LabelVariant;
  requiredMark?: boolean;
  idBase?: string;
}

function Label({
  className,
  helperText,
  errorText,
  variant = 'default',
  requiredMark,
  htmlFor,
  idBase,
  ...props
}: LabelProps) {
  // stable id base to link helper/error text
  const fallbackId = React.useId();
  const base = idBase ?? fallbackId;
  const helpId = helperText ? `${base}-help` : undefined;
  const errId = errorText ? `${base}-err` : undefined;

  const describedBy = [errId, helpId].filter(Boolean).join(' ') || undefined;
  const invalid = Boolean(errorText);

  return (
    <div
      className={cn(
        'group/label grid gap-1',
        // when error is present, allow styling children via data-invalid
        invalid && 'data-[invalid=true]:[&_*]:aria-[invalid=true]',
        className
      )}
      data-invalid={invalid || undefined}
    >
      <LabelPrimitive.Root
        data-slot="label"
        htmlFor={htmlFor}
        className={cn(
          'flex items-center gap-2 text-base leading-none font-medium select-none',
          'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          variantClass[variant]
        )}
        // consumers can spread aria-* on the control; we still expose ids
        aria-describedby={describedBy}
        {...props}
      >
        <span>{props.children}</span>
        {requiredMark && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </LabelPrimitive.Root>

      {/* error first so SR screen readers read it before help */}
      {errorText ? (
        <p id={errId} className="text-xs mt-1 text-destructive">
          {errorText}
        </p>
      ) : null}

      {helperText ? (
        <p id={helpId} className={cn('text-xs mt-1', variantClass['muted'])}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export { Label };
