'use client';

import * as React from 'react';
import {
  Dialog as BaseDialog,
  DialogContent as BaseContent,
  DialogHeader as BaseHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter as BaseFooter,
  DialogOverlay,
  DialogPortal,
  DialogClose,
  DialogTrigger,
} from './dialog';
import { cn } from '../lib/utils';

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
type Scroll = 'body' | 'content' | 'none';

const sizeClass: Record<Size, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-3xl',
  '3xl': 'sm:max-w-4xl',
  '4xl': 'sm:max-w-5xl',
  full: 'sm:max-w-[min(calc(100vw-2rem),1000px)] md:max-w-[min(calc(100vw-4rem),1200px)]',
};

type ModalContentProps = React.ComponentProps<typeof BaseContent> & {
  /** container width */
  size?: Size;
  /** where the scroll lives */
  scroll?: Scroll;
  /** glassy background */
  blur?: boolean;
  /** put a separator between header/body and body/footer */
  separators?: boolean;
  /** keep footer pinned at bottom */
  stickyFooter?: boolean;
  /** add a faint diagonal gradient in header */
  gradientHeader?: boolean;
};

const ModalContext = React.createContext<
  Required<
    Pick<
      ModalContentProps,
      'scroll' | 'separators' | 'stickyFooter' | 'gradientHeader'
    >
  >
>({
  scroll: 'body',
  separators: true,
  stickyFooter: true,
  gradientHeader: false,
});

export function Modal(props: React.ComponentProps<typeof BaseDialog>) {
  return <BaseDialog {...props} />;
}

export { DialogTrigger as ModalTrigger, DialogClose as ModalClose };

export function ModalContent({
  size = 'lg',
  scroll = 'body',
  blur = true,
  separators = true,
  stickyFooter = true,
  gradientHeader = true,
  className,
  children,
  ...rest
}: ModalContentProps) {
  return (
    <ModalContext.Provider
      value={{ scroll, separators, stickyFooter, gradientHeader }}
    >
      <DialogPortal>
        {/* Keep overlay neutral and discreet */}
        <DialogOverlay />
        <BaseContent
          {...rest}
          className={cn(
            // base
            'p-0 flex flex-col overflow-hidden',
            // visual
            blur ? 'backdrop-blur-xl bg-background/80' : 'bg-background',
            'border border-border/40 shadow-2xl',
            stickyFooter && 'bg-background backdrop-blur-sm',
            // motion + positioning from your dialog.tsx base
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-2rem)] max-h-[90vh]',
            sizeClass[size],
            className
          )}
        >
          {children}
        </BaseContent>
      </DialogPortal>
    </ModalContext.Provider>
  );
}

export function ModalHeader({
  className,
  children,
  ...rest
}: React.ComponentProps<'div'>) {
  const { separators, gradientHeader } = React.useContext(ModalContext);
  return (
    <BaseHeader
      {...rest}
      className={cn(
        'relative p-6 pb-4',
        separators && 'border-b border-border/40',
        gradientHeader && 'bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/15 dark:to-secondary/15',
        className
      )}
    >
      {children}
    </BaseHeader>
  );
}

export function ModalTitle(props: React.ComponentProps<typeof DialogTitle>) {
  return (
    <DialogTitle
      {...props}
      className={cn('text-2xl font-semibold', props.className)}
    />
  );
}

export function ModalDescription(
  props: React.ComponentProps<typeof DialogDescription>
) {
  return (
    <DialogDescription {...props} className={cn('text-sm', props.className)} />
  );
}

export function ModalBody({
  className,
  children,
  ...rest
}: React.ComponentProps<'div'>) {
  const { scroll } = React.useContext(ModalContext);
  return (
    <div
      {...rest}
      className={cn(
        'p-6',
        scroll === 'body' && 'flex-1 overflow-y-auto',
        scroll === 'content' && 'overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModalFooter({
  className,
  children,
  ...rest
}: React.ComponentProps<'div'>) {
  const { stickyFooter, separators } = React.useContext(ModalContext);
  return (
    <BaseFooter
      {...rest}
      className={cn(
        'p-4 gap-3',
        'flex flex-col-reverse sm:flex-row sm:justify-end',
        separators && 'border-t border-border/40',
        // subtle two-tone lift using secondary tint
        'bg-gradient-to-t from-background to-secondary/5 dark:to-secondary/10',
        className
      )}
    >
      {children}
    </BaseFooter>
  );
}
