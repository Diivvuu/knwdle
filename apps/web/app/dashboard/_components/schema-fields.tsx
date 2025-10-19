'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';

type JsonSchema = any;

type Props = {
  def: JsonSchema | undefined; // active definition
  details: Record<string, any>; // meta draft
  onChange: (key: string, value: any) => void;
  attemptedSubmit?: boolean;
};

/* -------------------- helpers -------------------- */
function buildAcademicYears(count = 6) {
  const today = new Date();
  const y = today.getFullYear();
  // start from current or previous depending on month (Jul-Jun style common in India)
  const startBase = today.getMonth() >= 5 ? y : y - 1;
  const options: string[] = [];
  for (let i = -1; i < count - 1; i++) {
    const start = startBase + i;
    const endShort = String((start + 1) % 100).padStart(2, '0');
    options.push(`${start}-${endShort}`);
  }
  // de-dupe just in case
  return Array.from(new Set(options));
}

function applyTransform(v: any, schema: any) {
  const t = schema?.['x-ui']?.transform;
  if (typeof v !== 'string') return v;
  if (t === 'trim') return v.trim();
  if (t === 'uppercase') return v.toUpperCase();
  if (t === 'titlecase')
    return v.replace(
      /\w\S*/g,
      (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    );
  return v;
}

function getPattern(schema: any): RegExp | null {
  const p = schema?.pattern;
  if (!p || typeof p !== 'string') return null;
  try {
    return new RegExp(p);
  } catch {
    return null;
  }
}

function coerceNumber(v: any): number | '' {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
}

function splitComma(v: string): string[] {
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

type ControlType =
  | 'textarea'
  | 'text'
  | 'number'
  | 'enum'
  | 'chips'
  | 'multi-enum'
  | 'switch'
  | 'unknown';

function resolveControl(prop: string, schema: any): ControlType {
  const widget = schema?.['x-ui']?.widget;

  if (widget === 'chips') return 'chips';
  if (widget === 'textarea') return 'textarea';
  if (widget === 'switch') return 'switch';
  if (
    widget === 'number' ||
    schema?.type === 'number' ||
    schema?.type === 'integer'
  )
    return 'number';
  if (widget === 'select') {
    // select can be enum OR special formats like academicYear
    return 'enum';
  }

  // defaulting logic
  if (schema?.type === 'boolean') return 'switch';
  if (schema?.type === 'number' || schema?.type === 'integer') return 'number';
  if (schema?.type === 'string') {
    if (schema?.enum) return 'enum';
    const maxLen = schema?.maxLength ?? 0;
    if (maxLen >= 200 || prop === 'description') return 'textarea';
    return 'text';
  }
  if (schema?.type === 'array') {
    const items = schema?.items;
    if (items?.enum && Array.isArray(items.enum)) return 'multi-enum';
    if (items?.type === 'string') return 'chips';
  }
  if (schema?.enum && Array.isArray(schema.enum)) return 'enum';
  return 'unknown';
}

function validationMessageFor(
  prop: string,
  schema: any,
  value: any,
  required: boolean
): string | null {
  // empty
  if ((value === '' || value == null) && required)
    return 'This field is required';

  // numbers
  if (schema?.type === 'number' || schema?.type === 'integer') {
    if (value === '') return required ? 'This field is required' : null;
    if (typeof value !== 'number' || Number.isNaN(value))
      return 'Enter a valid number';
    if (schema?.minimum != null && value < schema.minimum)
      return `Must be ≥ ${schema.minimum}`;
    if (schema?.maximum != null && value > schema.maximum)
      return `Must be ≤ ${schema.maximum}`;
    return null;
  }

  // strings
  if (schema?.type === 'string' || typeof value === 'string') {
    const v = String(value ?? '');
    if (!v && required) return 'This field is required';
    if (!v) return null;
    if (schema?.minLength && v.length < schema.minLength)
      return `Minimum ${schema.minLength} characters`;
    if (schema?.maxLength && v.length > schema.maxLength)
      return `Maximum ${schema.maxLength} characters`;
    const pat = getPattern(schema);
    if (pat && !pat.test(v)) {
      if (prop === 'academicYear') return 'Format must be 2024-25';
      return 'Invalid format';
    }
    return null;
  }

  // arrays
  if (schema?.type === 'array') {
    const arr = Array.isArray(value) ? value : [];
    if (schema?.minItems && arr.length < schema.minItems)
      return `Add at least ${schema.minItems}`;
    if (schema?.maxItems && arr.length > schema.maxItems)
      return `Use at most ${schema.maxItems}`;
    if ((arr.length === 0 || value == null) && required)
      return 'This field is required';
    return null;
  }

  return null;
}

/* -------------------- chips input -------------------- */

function ChipsInput({
  label,
  description,
  value,
  onChange,
  placeholder,
  error,
  required,
}: {
  label: string;
  description?: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
}) {
  const [text, setText] = useState('');

  const addFromText = () => {
    if (!text.trim()) return;
    onChange([...value, ...splitComma(text)]);
    setText('');
  };

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      {!!value.length && (
        <div className="flex flex-wrap gap-2">
          {value.map((v, i) => (
            <Badge
              key={`${v}-${i}`}
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              {v}
              <button
                type="button"
                className="ml-1 opacity-70 hover:opacity-100"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder ?? 'comma separated e.g. JEE, NEET'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFromText();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addFromText}>
          Add
        </Button>
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* -------------------- multi enum -------------------- */

function MultiEnum({
  label,
  description,
  options,
  value,
  onChange,
  required,
  error,
}: {
  label: string;
  description?: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  required?: boolean;
  error?: string | null;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:bg-muted/50 text-muted-foreground'
              )}
              aria-pressed={active}
            >
              <span className="capitalize">{String(opt).toLowerCase()}</span>
              <span
                className={cn(
                  'h-4 w-4 rounded-sm border grid place-items-center',
                  active ? 'bg-primary border-primary' : 'border-border'
                )}
                aria-hidden
              >
                {active ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* -------------------- main renderer -------------------- */

export default function SchemaFields({
  def,
  details,
  onChange,
  attemptedSubmit,
}: Props) {
  const fields = useMemo(() => {
    if (!def)
      return [] as Array<{ key: string; schema: any; required: boolean }>;
    const props = def.properties ?? {};
    const req: string[] = def.required ?? [];

    const entries = Object.entries(props).map(([key, schema]) => ({
      key,
      schema,
      required: req.includes(key),
    }));

    const HIDE = new Set(['schemaVersion', 'teamSize', 'features']);
    const visible = entries.filter(({ key }) => !HIDE.has(key));
    visible.sort((a, b) => (a.key === 'name' ? -1 : b.key === 'name' ? 1 : 0));
    return visible;
  }, [def]);

  if (!def) return null;

  return (
    <div className="space-y-4">
      {fields.map(({ key, schema, required }) => {
        const ui = schema?.['x-ui'] ?? {};
        const label: string =
          ui.label || schema?.title || schema?.description || key;
        const description: string | undefined = ui.help || schema?.description;
        const placeholder = ui.placeholder || schema?.placeholder;

        const control = resolveControl(key, schema);
        const rawVal = details[key];

        const error = attemptedSubmit
          ? validationMessageFor(key, schema, rawVal, required)
          : null;

        if (control === 'textarea') {
          return (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-1">
                {label}
                {required && <span className="text-destructive">*</span>}
              </Label>
              <textarea
                className={cn(
                  'w-full min-h-[96px] rounded-md border bg-background px-3 py-2 text-sm outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary/50',
                  error ? 'border-destructive' : 'border-border'
                )}
                placeholder={placeholder || 'Enter text'}
                maxLength={schema?.maxLength ?? undefined}
                value={typeof rawVal === 'string' ? rawVal : (rawVal ?? '')}
                onChange={(e) =>
                  onChange(key, applyTransform(e.target.value, schema))
                }
              />
              {description && (
                <p className="text-[11px] text-muted-foreground">
                  {description}
                </p>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          );
        }

        if (control === 'text') {
          return (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-1">
                {label}
                {required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                placeholder={placeholder || 'Enter value'}
                value={typeof rawVal === 'string' ? rawVal : (rawVal ?? '')}
                onChange={(e) =>
                  onChange(key, applyTransform(e.target.value, schema))
                }
              />

              {schema?.pattern && (
                <p className="text-[11px] text-muted-foreground">
                  Must match:{' '}
                  <code className="font-mono">{schema.pattern}</code>
                </p>
              )}

              {description && !schema?.pattern && (
                <p className="text-[11px] text-muted-foreground">
                  {description}
                </p>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          );
        }

        if (control === 'number') {
          const v = typeof rawVal === 'number' ? rawVal : coerceNumber(rawVal);
          return (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-1">
                {label}
                {required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                inputMode="numeric"
                placeholder={
                  schema?.placeholder ||
                  (schema?.minimum != null
                    ? `≥ ${schema.minimum}`
                    : 'Enter number')
                }
                value={v === '' ? '' : String(v)}
                onChange={(e) => onChange(key, coerceNumber(e.target.value))}
              />
              {description && (
                <p className="text-[11px] text-muted-foreground">
                  {description}
                </p>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          );
        }

        if (control === 'enum') {
          // enum from schema or special format
          let opts: string[] = schema.enum ?? [];
          if (!opts.length && schema?.['x-ui']?.format === 'academicYear') {
            opts = buildAcademicYears(); // compute window of AY options
          }
          const current = typeof rawVal === 'string' ? rawVal : '';

          return (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-1">
                {label}
                {required && <span className="text-destructive">*</span>}
              </Label>

              {/* pill/select style as you had, but from opts */}
              <div className="flex flex-wrap gap-2">
                {opts.map((opt) => {
                  const active = current === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onChange(key, opt)}
                      className={cn(
                        'h-9 rounded-md border px-3 text-sm transition-colors',
                        active
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:bg-muted/50 text-muted-foreground'
                      )}
                      aria-pressed={active}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {description && (
                <p className="text-[11px] text-muted-foreground">
                  {description}
                </p>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          );
        }

        if (control === 'multi-enum') {
          const opts: string[] = schema.items?.enum ?? schema.enum ?? [];
          const arr = Array.isArray(rawVal) ? (rawVal as string[]) : [];
          return (
            <MultiEnum
              key={key}
              label={label}
              description={description}
              options={opts}
              value={arr}
              onChange={(v) => onChange(key, v)}
              required={required}
              error={
                attemptedSubmit
                  ? validationMessageFor(key, schema, arr, required)
                  : null
              }
            />
          );
        }

        if (control === 'chips') {
          const arr = Array.isArray(rawVal) ? (rawVal as string[]) : [];
          return (
            <ChipsInput
              key={key}
              label={label}
              description={description}
              value={arr}
              onChange={(v) => onChange(key, v)}
              placeholder="comma separated values"
              required={required}
              error={
                attemptedSubmit
                  ? validationMessageFor(key, schema, arr, required)
                  : null
              }
            />
          );
        }

        if (control === 'switch') {
          const checked = Boolean(rawVal);
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <Label className="capitalize">{label}</Label>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
              <Switch
                checked={checked}
                onCheckedChange={(v) => onChange(key, v)}
              />
            </div>
          );
        }

        return (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={typeof rawVal === 'string' ? rawVal : (rawVal ?? '')}
              onChange={(e) => onChange(key, e.target.value)}
            />
            {description && (
              <p className="text-[11px] text-muted-foreground">{description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
