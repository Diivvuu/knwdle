'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';

const buttonVariants = cva(
  [
    // base
    'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-lg text-sm font-semibold tracking-wide',
    'transition-all duration-300 ease-out motion-safe:will-change-transform',
    // interaction
    'disabled:pointer-events-none disabled:opacity-40 disabled:grayscale',
    'motion-safe:hover:-translate-y-[2px] motion-safe:active:translate-y-[0px] motion-safe:active:scale-[0.98]',
    'shadow-[0_1px_2px_0_rgb(0_0_0_/0.05)] hover:shadow-[0_12px_28px_-4px_rgb(0_0_0_/0.15),0_4px_12px_-2px_rgb(0_0_0_/0.08)]',
    'active:shadow-[0_4px_12px_-2px_rgb(0_0_0_/0.12)]',
    // icons
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    '[&_svg]:transition-transform [&_svg]:duration-300 group-hover:[&_svg]:scale-110',
    // focus
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'focus-visible:shadow-[0_0_0_3px_rgb(var(--ring)_/_0.1)]',
    // invalid
    'aria-invalid:ring-destructive/40 aria-invalid:ring-[3px] dark:aria-invalid:ring-destructive/50',
    // polish
    'backdrop-blur-sm backdrop-saturate-150',
    // overflow for pseudo elements
    'overflow-hidden',
    // shimmer effect (::before)
    "before:content-[''] before:absolute before:inset-y-0 before:-left-[120%] before:w-[120%]",
    'before:bg-gradient-to-r before:from-transparent before:via-white/0 before:to-transparent',
    'before:skew-x-[-20deg]',
    'before:transition-all before:duration-[800ms] before:ease-[cubic-bezier(0.4,0,0.2,1)]',
    'motion-safe:group-hover:before:left-[120%] motion-safe:group-hover:before:via-white/20',
    // glow pulse on hover (::after)
    "after:content-[''] after:absolute after:inset-0 after:rounded-[inherit]",
    'after:opacity-0 after:transition-opacity after:duration-500',
    'after:bg-gradient-to-r after:from-transparent after:via-white/[0.03] after:to-transparent',
    'group-hover:after:opacity-100 group-hover:after:animate-pulse',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-b from-primary via-primary to-primary/90',
          'text-primary-foreground',
          'hover:from-primary hover:via-primary/95 hover:to-primary/85',
          'active:from-primary/95 active:via-primary/90 active:to-primary/80',
          'border border-primary/20 dark:border-primary/30',
        ].join(' '),
        destructive: [
          'bg-gradient-to-b from-destructive via-destructive to-destructive/90',
          'text-destructive-foreground',
          'hover:from-destructive hover:via-destructive/95 hover:to-destructive/85',
          'active:from-destructive/95 active:via-destructive/90 active:to-destructive/80',
          'border border-destructive/20 dark:border-destructive/30',
        ].join(' '),
        outline: [
          'border-[1.5px] border-input bg-background/50 backdrop-blur-md',
          'hover:bg-accent/50 hover:text-accent-foreground hover:border-accent',
          'active:bg-accent/70',
        ].join(' '),
        secondary: [
          'bg-gradient-to-b from-secondary via-secondary to-secondary/90',
          'text-secondary-foreground',
          'hover:from-secondary hover:via-secondary/95 hover:to-secondary/80',
          'active:from-secondary/95 active:via-secondary/90 active:to-secondary/75',
          'border border-secondary/20 dark:border-secondary/30',
        ].join(' '),
        ghost: [
          'hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm',
          'active:bg-accent/70',
        ].join(' '),
        link: [
          'text-primary underline-offset-4 hover:underline',
          'hover:opacity-80 active:opacity-60',
        ].join(' '),
      },
      size: {
        default: 'h-10 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-8 rounded-md gap-1.5 px-3.5 text-xs has-[>svg]:px-3',
        lg: 'h-12 rounded-xl px-7 has-[>svg]:px-5 text-base gap-2.5',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  // Add inner highlight for solid variants
  const withInnerHighlight =
    !variant ||
    variant === 'default' ||
    variant === 'secondary' ||
    variant === 'destructive';

  // Add enhanced glow for primary actions
  const withGlow = !variant || variant === 'default';

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        // Inner light reflection
        withInnerHighlight &&
          [
            '[&>*]:relative [&>*]:z-10',
            "before:content-[''] before:absolute before:inset-[1.5px] before:rounded-[inherit]",
            'before:pointer-events-none before:z-[1]',
            'before:bg-gradient-to-b before:from-white/15 before:via-white/5 before:to-transparent',
            'dark:before:from-white/10 dark:before:via-white/[0.02] dark:before:to-transparent',
            'before:transition-opacity before:duration-300',
            'group-hover:before:opacity-80',
          ].join(' '),
        // Subtle outer glow on hover
        withGlow &&
          [
            'transition-[box-shadow,transform] duration-300',
            'hover:shadow-[0_0_24px_-4px_rgb(var(--primary)_/_0.3)]',
          ].join(' '),
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
