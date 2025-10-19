'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { SearchIcon } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';

/* =========================================================
   Command (root)
   ========================================================= */
function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
        // normalize inner slots a bit
        // headings
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        // list + items
        '[&_[cmdk-group]]:px-1 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2',
        className
      )}
      {...props}
    />
  );
}

/* =========================================================
   Command Dialog
   ========================================================= */
function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn('overflow-hidden p-0', className)}
        showCloseButton={showCloseButton}
      >
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================
   Command Input
   - size: 'sm' | 'md'
   - variant: 'surface' | 'flat'
   surface  -> card-ish chip inside the header area (for popovers)
   flat     -> border-bottom only (classic)
   ========================================================= */
type CommandInputProps = React.ComponentProps<typeof CommandPrimitive.Input> & {
  variant?: 'surface' | 'flat';
  wrapperClassName?: string;
};

function CommandInput({
  className,
  variant = 'surface',
  wrapperClassName,
  ...props
}: CommandInputProps) {
  const wrapperBase =
    'flex items-center gap-2 px-2 sm:px-3 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-card/80';

  const wrapperStyles =
    variant === 'surface'
      ? cn(
          wrapperBase,
          'py-1.5 bg-card/70',
          'outline-none', // kill global outline
          'border-b border-border/60' // subtle divider from list
        )
      : cn(
          // FLAT: classic, minimal
          'flex items-center gap-2 border-b px-2 sm:px-3',
          'h-9',
          'bg-transparent outline-none'
        );

  return (
    <div
      data-slot="command-input-wrapper"
      className={cn(wrapperStyles, wrapperClassName)}
    >
      <SearchIcon className="size-4 shrink-0 opacity-60" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'placeholder:text-muted-foreground w-full bg-transparent text-sm',
          'h-10',
          // reset weird outlines and give a proper ring on focus
          'outline-none',
          'rounded-md', // inner rounding only; container keeps the header shape
          'px-2',
          // focus ring that matches your DS
          
          // disabled polish
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    </div>
  );
}

/* =========================================================
   List, Empty, Group, Separator, Item, Shortcut
   ========================================================= */
function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto',
        className
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn('text-foreground overflow-hidden p-1', className)}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('bg-border -mx-1 h-px', className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
        "[&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
