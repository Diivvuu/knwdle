'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

/**
 * App-wide Toaster with bold, maximalist styling.
 * - Uses global CSS tokens: --background, --foreground, --border, --primary, --secondary, --accent, --destructive
 * - Larger sizing, better spacing, stronger contrast
 * - Close button is always visible & contrasted
 * - Positioned between bottom-right & bottom-center by default
 */
const Toaster = (props: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const resolvedTheme = props.theme ?? (theme as ToasterProps['theme']);

  // Map Sonner palette slots to our design tokens
  const colorVars: React.CSSProperties = {
    // base/neutral
    ['--normal-bg' as any]: 'var(--background)',
    ['--normal-text' as any]: 'var(--foreground)',
    ['--normal-border' as any]: 'var(--border)',

    // variants
    ['--success-bg' as any]: 'var(--primary)',
    ['--success-text' as any]: 'var(--primary-foreground)',
    ['--success-border' as any]: 'var(--primary)',

    ['--info-bg' as any]: 'var(--secondary)',
    ['--info-text' as any]: 'var(--secondary-foreground)',
    ['--info-border' as any]: 'var(--secondary)',

    ['--warning-bg' as any]: 'var(--accent)',
    ['--warning-text' as any]: 'var(--accent-foreground)',
    ['--warning-border' as any]: 'var(--accent)',

    ['--error-bg' as any]: 'var(--destructive)',
    ['--error-text' as any]: 'var(--destructive-foreground)',
    ['--error-border' as any]: 'var(--destructive)',
  };

  return (
    <Sonner
      {...props}
      theme={resolvedTheme}
      richColors
      expand
      closeButton
      duration={props.duration ?? 4200}
      position={props.position ?? 'bottom-right'}
      // visually sits between bottom-right & bottom-center
      className="toaster group pointer-events-none bottom-6 right-[10%] md:right-8"
      style={colorVars}
      toastOptions={{
        classNames: {
          toast: [
            // layout
            'pointer-events-auto relative overflow-visible',
            'min-w-[380px] max-w-[620px] p-5 md:p-6 pr-16',
            'rounded-2xl',
            // surface
            'bg-[--normal-bg]/95 supports-[backdrop-filter]:bg-[--normal-bg]/75 backdrop-blur-xl',
            'text-[--normal-text] ring-1 ring-[--normal-border]/70',
            'shadow-[0_16px_60px_-12px_rgba(0,0,0,0.5)]',
            // motion
            'transition-transform duration-300 will-change-transform hover:translate-y-[-3px]',
          ].join(' '),
          title:
            // chunkier title for readability
            'font-semibold tracking-[-0.01em] text-[1.075rem] md:text-[1.125rem]',
          description: 'opacity-90 mt-1.5 text-sm md:text-base',
          actionButton: [
            'ml-2 inline-flex items-center rounded-lg',
            'px-4 py-2.5 text-[0.92rem] font-semibold',
            'bg-[color:var(--primary)] text-[color:var(--primary-foreground)]',
            'shadow hover:opacity-90 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40',
          ].join(' '),
          cancelButton: [
            'ml-2 inline-flex items-center rounded-lg',
            'px-4 py-2.5 text-[0.92rem] font-semibold',
            'bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]',
            'shadow hover:opacity-90 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[color:var(--secondary)]/40',
          ].join(' '),
          // ensure the close button is visible & contrasted on all themes
          closeButton: [
            'absolute top-2.5 right-2.5 z-10 rounded-full',
            'p-1.5 md:p-2',
            'text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]',
            'bg-transparent hover:bg-[color:var(--foreground)]/8',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--normal-border]/60',
          ].join(' '),
        },
      }}
      icons={{
        success: (
          <span
            className="inline-grid h-7 w-7 place-items-center rounded-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
            aria-hidden
          >
            ✓
          </span>
        ),
        info: (
          <span
            className="inline-grid h-7 w-7 place-items-center rounded-md bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]"
            aria-hidden
          >
            i
          </span>
        ),
        warning: (
          <span
            className="inline-grid h-7 w-7 place-items-center rounded-md bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
            aria-hidden
          >
            !
          </span>
        ),
        error: (
          <span
            className="inline-grid h-7 w-7 place-items-center rounded-md bg-[color:var(--destructive)] text-[color:var(--destructive-foreground)]"
            aria-hidden
          >
            ×
          </span>
        ),
        loading: (
          <span
            className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-[color:var(--foreground)]/25 border-t-[color:var(--foreground)]"
            aria-hidden
          />
        ),
      }}
    />
  );
};

export { Toaster };
