import { cn } from '@workspace/ui/lib/utils';
import { Label } from '../label';

type OrgTypeKey =
  | 'SCHOOL'
  | 'COACHING_CENTER'
  | 'TUITION_CENTER'
  | 'COLLEGE'
  | 'UNIVERSITY'
  | 'EDTECH'
  | 'TRAINING'
  | 'NGO'
  | '';

export type OrgTemplate = {
  key: OrgTypeKey;
  name: string;
  tagline?: string; // ✅ make optional
  icon?: React.ComponentType<{ className?: string }>;
};

export function OrgTypePicker({
  value,
  onChange,
  templates,
  label = 'Organisation type',
  description = 'We’ll tailor structure and wording to fit. This choice sets your base structure.',
  className,
  renderExtra,
}: {
  value: OrgTypeKey;
  onChange: (val: OrgTypeKey) => void;
  templates: OrgTemplate[];
  label?: string;
  description?: string;
  className?: string;
  renderExtra?: (template: OrgTemplate) => React.ReactNode;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>

      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-col gap-2 mt-1.5"
      >
        {templates.map((t) => {
          const active = value === (t.key as OrgTypeKey);
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(t.key as OrgTypeKey)}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left text-sm transition',
                'hover:shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/50 outline-none',
                active
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border/70 hover:border-border'
              )}
            >
              <div className={cn('flex items-start gap-3')}>
                <div
                  aria-hidden
                  className={cn(
                    'mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border',
                    'bg-[var(--field)] text-foreground/80',
                    'transition-colors',
                    active
                      ? 'border-primary/60 text-primary'
                      : 'border-border/70'
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{t.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.tagline}
                  </div>
                </div>
              </div>
              {active && renderExtra ? (
                <div className="pt-2 mt-2 border-t border-border">
                  {renderExtra(t)}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
