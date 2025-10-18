import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@workspace/ui/components/command';

import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

export default function ScrollCombo({
  value,
  onChange,
  placeholder,
  options,
  renderLabel = (o: { value: string; label: string }) => o.label,
  emptyLabel = 'No results.',
  portalContainer,
  'aria-describedby': ariaDescribedby,
  invalid,
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  renderLabel?: (o: { value: string; label: string }) => React.ReactNode;
  emptyLabel?: string;
  portalContainer?: HTMLElement | null;
  'aria-describedby'?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={ariaDescribedby}
          className={cn(
            'w-full justify-between h-11 rounded-xl border-2 transition-all duration-200',
            'bg-background hover:bg-accent/5 hover:border-primary/40 hover:shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
            'text-sm font-medium',
            open && 'border-primary shadow-sm ring-2 ring-primary/20',
            invalid
              ? 'border-destructive hover:border-destructive ring-2 ring-destructive/20'
              : 'border-border',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className="truncate text-left">
            {selected ? renderLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown
            className={cn(
              'ml-2 h-4 w-4 shrink-0 transition-transform duration-200',
              open ? 'rotate-180 opacity-70' : 'opacity-40'
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        container={portalContainer}
        collisionPadding={12}
        className="z-[60] w-[--radix-popover-trigger-width] p-0 max-h-[60vh] overflow-hidden rounded-xl border-2 border-border shadow-xl bg-popover animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
      >
        <Command className="rounded-xl">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 border-b border-border/50 px-3 py-2">
            <CommandInput
              placeholder={placeholder}
              size="sm"
              variant="surface"
            />
          </div>
          <CommandEmpty className="py-8 text-center text-sm text-muted-foreground font-medium">
            {emptyLabel}
          </CommandEmpty>

          <CommandGroup className="p-1.5 overflow-y-auto overscroll-contain max-h-[calc(60vh-60px)]">
            {options.map((o) => (
              <CommandItem
                key={o.value}
                value={`${o.label} ${o.value}`}
                onSelect={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm cursor-pointer',
                  'transition-all duration-150',
                  'hover:bg-accent hover:text-accent-foreground hover:pl-4',
                  'aria-selected:bg-accent/50 aria-selected:text-accent-foreground aria-selected:font-medium',
                  o.value === value &&
                    'bg-primary/10 text-primary font-semibold'
                )}
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0 transition-all duration-200',
                    o.value === value
                      ? 'opacity-100 scale-100 text-primary'
                      : 'opacity-0 scale-75'
                  )}
                />
                <div className="truncate flex-1">{renderLabel(o)}</div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
