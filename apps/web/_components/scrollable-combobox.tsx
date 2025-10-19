import * as React from 'react';
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
  CommandList,
} from '@workspace/ui/components/command';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

type Option = { value: string; label: string };

export default function ScrollCombo({
  value,
  onChange,
  placeholder,
  options,
  renderLabel = (o: Option) => o.label,
  emptyLabel = 'No results.',
  portalContainer,
  'aria-describedby': ariaDescribedby,
  invalid,
  disabled,
  side = 'bottom',
  align = 'start',
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Option[];
  renderLabel?: (o: Option) => React.ReactNode;
  emptyLabel?: string;
  portalContainer?: HTMLElement | null;
  'aria-describedby'?: string;
  invalid?: boolean;
  disabled?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  // Ensure we always portal out of overflow-hidden parents when inside modals
  const portalTarget =
    portalContainer ??
    (typeof document !== 'undefined'
      ? (document.body as HTMLElement)
      : undefined);

  // Stop wheel and touch scroll from bubbling to the modal/document
  const stopScrollProp = (e: React.UIEvent) => {
    e.stopPropagation();
  };

  // Close on Escape while focus is inside the list
  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={ariaDescribedby}
          disabled={disabled}
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
        side={side}
        align={align}
        sideOffset={8}
        container={portalTarget}
        collisionPadding={12}
        className={cn(
          'z-[70] w-[--radix-popover-trigger-width] p-0 max-h-[60vh] overflow-visible',
          'rounded-xl border-2 border-border shadow-xl bg-popover',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200'
        )}
        // Prevent parent scroll locking from swallowing wheel/touch
        onWheelCapture={stopScrollProp}
        onTouchMoveCapture={stopScrollProp}
      >
        <Command className="rounded-xl">
          <div
            className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 border-b border-border/50 px-3 py-2"
            onWheelCapture={stopScrollProp}
            onTouchMoveCapture={stopScrollProp}
          >
            <CommandInput placeholder={placeholder} variant="surface" />
          </div>

          <CommandEmpty className="py-8 text-center text-sm text-muted-foreground font-medium">
            {emptyLabel}
          </CommandEmpty>

          {/* Dedicated scroll area to avoid clipping & allow smooth wheel inside modals */}
          <CommandList
            className="p-1.5 overflow-y-auto overscroll-contain max-h-[calc(60vh-60px)]"
            onWheelCapture={stopScrollProp}
            onTouchMoveCapture={stopScrollProp}
            onKeyDown={onListKeyDown}
          >
            <CommandGroup>
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
