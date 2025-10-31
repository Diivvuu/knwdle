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
  variant?: LabelVariant;
}

function Label({
  className,
  variant = 'default',
  htmlFor,
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      htmlFor={htmlFor}
      className={cn(
        'flex items-center gap-2 text-base leading-none font-medium select-none',
        'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        variantClass[variant],
        className
      )}
      {...props}
    >
      {props.children}
    </LabelPrimitive.Root>
  );
}

export { Label };
