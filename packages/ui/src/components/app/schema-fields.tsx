'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { Label } from '../label';
import { Badge } from '../badge';
import { Input } from '../input';
import { Switch } from '../switch';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '../button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import { Textarea as AutoTextarea } from '../textarea';
import CountrySelect from './country-select';
import TimezoneSelect from './timezone-select';
// --- Date/Time/Datetime Pickers ---
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Calendar } from '../calendar';
import { format as formatDate, parseISO } from 'date-fns';

type JsonSchema = any;
type FlattenedField = {
  key: string;
  schema: JsonSchema;
  required: boolean;
  path: string[];
  parent: string | null;
  groupTitle?: string;
  isGroup: boolean;
};

type Props = {
  def: JsonSchema | undefined;
  groups?: Array<{ name: string; fields: string[] }>;
  details: Record<string, any>;
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

function toInputValue(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  return '';
}

function toStartCase(input: string): string {
  return input
    .replace(/[_\-]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

const FRIENDLY_LABELS: Record<string, string> = {
  description: 'Short Description',
  descriptionLong: 'Long Description',
  visibility: 'Visibility',
  timezone: 'Timezone',
  tags: 'Tags',
  startDate: 'Start Date',
  endDate: 'End Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  scheduleDays: 'Schedule Days',
  daysOfWeek: 'Days of the Week',
  meetingDay: 'Meeting Day',
  meetingTime: 'Meeting Time',
  meetingVenue: 'Meeting Venue',
  shift: 'Shift',
  grade: 'Grade / Year',
  section: 'Section',
  medium: 'Medium of Instruction',
  gradingScheme: 'Grading Scheme',
  code: 'Unit Code',
  departmentCode: 'Department Code',
  classRef: 'Linked Class',
  credits: 'Credits',
  subjectsOffered: 'Subjects Offered',
  prerequisites: 'Prerequisites',
  mentor: 'Mentor',
  instructor: 'Instructor',
  teacherAssigned: 'Assigned Teacher',
  ownerName: 'Owner / Coordinator',
  head: 'Head of Department',
  contactEmail: 'Contact Email',
  contactPhone: 'Contact Number',
  officeLocation: 'Office / Location',
  room: 'Room / Venue',
  focus: 'Focus Area',
  customTypeLabel: 'Custom Type Label',
  syllabusUrl: 'Syllabus URL',
  website: 'Website',
  notes: 'Notes',
  type: 'Group Type',
};

const FRIENDLY_DESCRIPTIONS: Record<string, string> = {
  tags: 'Add keywords that help search and filter this unit.',
  startDate: 'Choose when this unit becomes active.',
  endDate: 'Optional end date for the unit lifecycle.',
  meetingDay: 'Pick the usual day this unit meets.',
  meetingTime: 'Specify the meeting start time (HH:mm).',
  scheduleDays: 'List the days the unit is active or classes run.',
  daysOfWeek: 'Pick the regular working days.',
  focus: 'Give a short theme or focus area.',
  customTypeLabel: 'Display name for the “Other” unit type.',
  officeLocation: 'Where team members can find this unit.',
  contactPhone: 'Include country code if required.',
  contactEmail: 'Who should receive communications for this unit?',
  syllabusUrl: 'Link to syllabus or curriculum overview.',
  website: 'Link to an external site or resource hub.',
};

type ControlType =
  | 'textarea'
  | 'text'
  | 'number'
  | 'enum'
  | 'chips'
  | 'multi-enum'
  | 'switch'
  | 'date'
  | 'time'
  | 'datetime'
  | 'unknown';

function resolveControl(prop: string, schema: any): ControlType {
  const widget = schema?.['x-ui']?.widget;
  const format = schema?.['x-ui']?.format || schema?.format;

  if (widget === 'chips') return 'chips';
  if (widget === 'textarea') return 'textarea';
  if (widget === 'switch') return 'switch';
  if (
    widget === 'number' ||
    schema?.type === 'number' ||
    schema?.type === 'integer'
  )
    return 'number';
  if (widget === 'select') return 'enum';

  // ✅ check for format *before* string fallback
  if (schema?.type === 'string') {
    if (format === 'date') return 'date';
    if (format === 'time') return 'time';
    if (format === 'date-time') return 'datetime';
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

const isCountryField = (key: string) => key.toLowerCase().includes('country');
const isTimezoneField = (key: string) => key.toLowerCase().includes('timezone');

function parseYMD(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function validationMessageFor(
  prop: string,
  schema: any,
  value: any,
  required: boolean,
  details: Record<string, any>
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
    const fmt = schema?.['x-ui']?.format || schema?.format;
    if (fmt === 'date' && (prop === 'endDate' || prop === 'startDate')) {
      const start = details?.startDate ? parseYMD(details.startDate) : null;
      const end = details?.endDate ? parseYMD(details.endDate) : null;
      if (start && end && end < start) {
        return 'End date cannot be before start date';
      }
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

// --- Utility: flatten properties for nested object support ---
function flattenFields(
  schema: any,
  details: Record<string, any>,
  parentKey = '',
  parentRequired: string[] = []
): FlattenedField[] {
  const properties = schema?.properties as
    | Record<string, JsonSchema>
    | undefined;
  if (!properties) return [];
  const req = schema.required ?? [];
  const entries = Object.entries(properties) as Array<[string, JsonSchema]>;
  const result: FlattenedField[] = [];
  for (const [k, propSchema] of entries) {
    const pathArr = parentKey ? [...parentKey.split('.'), k] : [k];
    const pathStr = pathArr.join('.');
    const isObj =
      propSchema?.type === 'object' && (propSchema as any)?.properties;
    if (isObj) {
      const groupTitle = propSchema?.title || k;
      result.push({
        key: pathStr,
        schema: propSchema,
        required: req.includes(k),
        path: pathArr,
        parent: parentKey || null,
        groupTitle,
        isGroup: true,
      });
      result.push(
        ...flattenFields(
          propSchema,
          details?.[k] ?? {},
          pathStr,
          (propSchema as any)?.required ?? []
        )
      );
    } else {
      result.push({
        key: pathStr,
        schema: propSchema,
        required: req.includes(k),
        path: pathArr,
        parent: parentKey || null,
        groupTitle: undefined,
        isGroup: false,
      });
    }
  }
  return result;
}

export default function SchemaFields({
  def,
  details,
  onChange,
  attemptedSubmit,
}: Props) {
  // Flatten fields for nested object support
  const fields = useMemo<FlattenedField[]>(() => {
    if (!def) return [];
    const HIDE = new Set(['schemaVersion', 'teamSize', 'features']);
    let all = flattenFields(def, details);
    all = all.filter(({ key }) => !HIDE.has(key.split('.').pop()!));
    // Move "name" up
    all.sort((a, b) => {
      const oa = a.schema?.['x-ui']?.order ?? 999;
      const ob = b.schema?.['x-ui']?.order ?? 999;
      return oa - ob;
    });
    return all;
  }, [def, details]);

  if (!def) return null;

  // Group fields by sections for object properties with titles
  const sections: Array<{ title?: string; fields: FlattenedField[] }> = [];
  let currentSection: { title?: string; fields: FlattenedField[] } = {
    title: undefined,
    fields: [],
  };
  for (const field of fields) {
    if (field.isGroup) {
      // Start new section for object group
      if (currentSection.fields.length > 0) sections.push(currentSection);
      currentSection = { title: field.groupTitle, fields: [] };
    } else {
      currentSection.fields.push(field);
    }
  }
  if (currentSection.fields.length > 0) sections.push(currentSection);

  // Helper to get/set nested value
  function getValue(path: string[]) {
    let v = details;
    for (const k of path) {
      if (typeof v !== 'object' || v == null) return undefined;
      v = v[k];
    }
    return v;
  }
  function setValue(path: string[], value: any) {
    if (path.length === 0) return;
    // Shallow copy chain for immutability
    const obj: Record<string, any> = { ...details };
    let curr: Record<string, any> = obj;
    for (let i = 0; i < path.length - 1; ++i) {
      const k = path[i];
      if (!k) return;
      const existing = curr[k];
      curr[k] =
        typeof existing === 'object' &&
        existing !== null &&
        !Array.isArray(existing)
          ? { ...existing }
          : {};
      curr = curr[k] as Record<string, any>;
    }
    const leafKey = path[path.length - 1];
    if (!leafKey) return;
    curr[leafKey] = value;
    const rootKey = path[0];
    if (!rootKey) return;
    onChange(rootKey, obj[rootKey]);
  }

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div
          key={section.title || idx}
          className={section.title ? 'rounded-lg bg-muted/40 p-4' : ''}
        >
          {section.title && (
            <div className="mb-3 font-semibold text-base text-foreground/90">
              {section.title}
            </div>
          )}
          <div
            className={cn(
              'grid gap-4',
              section.fields.length > 1 ? 'sm:grid-cols-2' : ''
            )}
          >
            {section.fields.map(({ key, schema, required, path }) => {
              const ui = schema?.['x-ui'] ?? {};
              const rawLabel =
                ui.label ||
                schema?.title ||
                schema?.description ||
                path[path.length - 1];
              const label = toStartCase(rawLabel);
              const description: string | undefined =
                ui.help || schema?.description;
              const placeholder = ui.placeholder || schema?.placeholder;
              const control = resolveControl(key, schema);
              const rawVal = getValue(path);
              let error: string | null = null;
              if (attemptedSubmit || key === 'startDate' || key === 'endDate') {
                error = validationMessageFor(
                  key,
                  schema,
                  rawVal,
                  required,
                  details
                );
              }

              // Responsive: textareas/arrays full width, others 2-col
              const fieldClass =
                control === 'textarea' ||
                control === 'multi-enum' ||
                control === 'chips'
                  ? 'col-span-full'
                  : '';

              if (control === 'textarea') {
                return (
                  <div key={key} className={cn('space-y-1.5', fieldClass)}>
                    <Label className="flex items-center gap-1">
                      {label}
                      {required && <span className="text-destructive">*</span>}
                    </Label>
                    <AutoTextarea
                      className={cn(
                        'w-full min-h-[96px] rounded-md border bg-background px-3 py-2 text-sm outline-none resize-y',
                        'focus-visible:ring-2 focus-visible:ring-primary/50',
                        error ? 'border-destructive' : 'border-border'
                      )}
                      placeholder={placeholder || 'Enter text'}
                      maxLength={schema?.maxLength ?? undefined}
                      value={toInputValue(rawVal)}
                      onChange={(e) =>
                        setValue(path, applyTransform(e.target.value, schema))
                      }
                    />
                    {description && (
                      <p className="text-[11px] text-muted-foreground">
                        {description}
                      </p>
                    )}
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                );
              }

              if (control === 'text') {
                const textValue = toInputValue(rawVal);
                if (isCountryField(key)) {
                  return (
                    <div key={key} className={cn('space-y-1.5', fieldClass)}>
                      <CountrySelect
                        value={textValue}
                        onChange={(val) =>
                          setValue(path, applyTransform(val, schema))
                        }
                        label={`${label}${required ? ' *' : ''}`}
                        error={error ?? undefined}
                      />
                      {description && (
                        <p className="text-[11px] text-muted-foreground">
                          {description}
                        </p>
                      )}
                    </div>
                  );
                }
                if (isTimezoneField(key)) {
                  return (
                    <div key={key} className={cn('space-y-1.5', fieldClass)}>
                      <TimezoneSelect
                        value={textValue}
                        onChange={(val) =>
                          setValue(path, applyTransform(val, schema))
                        }
                        label={`${label}${required ? ' *' : ''}`}
                        error={error ?? undefined}
                      />
                      {description && (
                        <p className="text-[11px] text-muted-foreground">
                          {description}
                        </p>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={key} className={cn('space-y-1.5', fieldClass)}>
                    <Label className="flex items-center gap-1">
                      {label}
                      {required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      placeholder={placeholder || 'Enter value'}
                      value={textValue}
                      onChange={(e) =>
                        setValue(path, applyTransform(e.target.value, schema))
                      }
                      className={error ? 'border-destructive' : undefined}
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
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                );
              }

              if (control === 'number') {
                const v =
                  typeof rawVal === 'number' ? rawVal : coerceNumber(rawVal);
                return (
                  <div key={key} className={cn('space-y-1.5', fieldClass)}>
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
                      onChange={(e) =>
                        setValue(path, coerceNumber(e.target.value))
                      }
                      className={error ? 'border-destructive' : undefined}
                    />
                    {description && (
                      <p className="text-[11px] text-muted-foreground">
                        {description}
                      </p>
                    )}
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                );
              }

              if (control === 'enum') {
                // enum from schema or special format
                let opts: string[] = schema.enum ?? [];
                if (
                  !opts.length &&
                  schema?.['x-ui']?.format === 'academicYear'
                ) {
                  opts = buildAcademicYears();
                }
                const current = typeof rawVal === 'string' ? rawVal : '';
                return (
                  <div key={key} className={cn('space-y-1.5', fieldClass)}>
                    <Label className="flex items-center gap-1">
                      {label}
                      {required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={current}
                      onValueChange={(v) => setValue(path, v)}
                    >
                      <SelectTrigger
                        className={`w-full ${error ? 'border-destructive' : undefined}`}
                      >
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {opts.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {description && (
                      <p className="text-[11px] text-muted-foreground">
                        {description}
                      </p>
                    )}
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                );
              }

              if (control === 'multi-enum') {
                const opts: string[] = schema.items?.enum ?? schema.enum ?? [];
                const arr = Array.isArray(rawVal) ? (rawVal as string[]) : [];
                return (
                  <div key={key} className={cn(fieldClass)}>
                    <MultiEnum
                      label={label}
                      description={description}
                      options={opts}
                      value={arr}
                      onChange={(v) => setValue(path, v)}
                      required={required}
                      error={
                        attemptedSubmit
                          ? validationMessageFor(
                              key,
                              schema,
                              arr,
                              required,
                              details
                            )
                          : null
                      }
                    />
                  </div>
                );
              }

              if (control === 'chips') {
                const arr = Array.isArray(rawVal) ? (rawVal as string[]) : [];
                return (
                  <div key={key} className={cn(fieldClass)}>
                    <ChipsInput
                      label={label}
                      description={description}
                      value={arr}
                      onChange={(v) => setValue(path, v)}
                      placeholder="comma separated values"
                      required={required}
                      error={
                        attemptedSubmit
                          ? validationMessageFor(
                              key,
                              schema,
                              arr,
                              required,
                              details
                            )
                          : null
                      }
                    />
                  </div>
                );
              }

              if (control === 'switch') {
                const checked = Boolean(rawVal);
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex items-center justify-between rounded-md border p-3',
                      error ? 'border-destructive' : undefined,
                      fieldClass
                    )}
                  >
                    <div>
                      <Label className="capitalize">{label}</Label>
                      {description && (
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={(v) => setValue(path, v)}
                    />
                  </div>
                );
              }

              // ---- Date, Time, Datetime controls ----
              if (
                control === 'date' ||
                control === 'datetime' ||
                control === 'time'
              ) {
                // Import Popover, Calendar, Input, Button, etc.
                // For date/datetime, use calendar picker; for time/datetime, use time input
                // Value is always stored as ISO string
                // Show user-friendly formatted value
                const valueStr = typeof rawVal === 'string' ? rawVal : '';
                let dateValue: Date | null = null;
                let timeValue: string = '';
                if (control === 'date' || control === 'datetime') {
                  if (valueStr) {
                    // Try parsing as ISO
                    try {
                      dateValue = parseISO(valueStr);
                    } catch {
                      dateValue = null;
                    }
                  }
                }
                if (control === 'time' || control === 'datetime') {
                  if (valueStr) {
                    const strVal = String(valueStr);
                    if (control === 'datetime' && strVal.includes('T')) {
                      timeValue = strVal.split('T')[1]?.slice(0, 5) || '';
                    } else {
                      timeValue = valueStr;
                    }
                  }
                }
                // Handler for date change
                function handleDateChange(d: Date | undefined) {
                  if (!d) {
                    setValue(path, '');
                  } else if (control === 'date') {
                    // Only date (YYYY-MM-DD)
                    setValue(path, formatDate(d, 'yyyy-MM-dd'));
                  } else if (control === 'datetime') {
                    // Combine with time if available
                    let t = timeValue || '00:00';
                    const isoDate = formatDate(d, 'yyyy-MM-dd');
                    setValue(path, `${isoDate}T${t}`);
                  }
                }
                // Handler for time change
                function handleTimeChange(
                  e: React.ChangeEvent<HTMLInputElement>
                ) {
                  const t = e.target.value;
                  if (control === 'time') {
                    // Store as "HH:mm"
                    setValue(path, t);
                  } else if (control === 'datetime') {
                    // Combine with date if available
                    if (dateValue) {
                      const isoDate = dateValue.toISOString().slice(0, 10);
                      setValue(path, `${isoDate}T${t}`);
                    } else {
                      setValue(path, `T${t}`);
                    }
                  }
                }
                // Display value
                let displayValue = '';
                if (control === 'date' && dateValue) {
                  displayValue = formatDate(dateValue, 'yyyy-MM-dd');
                } else if (control === 'time' && timeValue) {
                  displayValue = timeValue;
                } else if (control === 'datetime' && dateValue && timeValue) {
                  displayValue =
                    formatDate(dateValue, 'yyyy-MM-dd') + ' ' + timeValue;
                }
                return (
                  <div key={key} className={cn('space-y-1.5', fieldClass)}>
                    <Label className="flex items-center gap-1">
                      {label}
                      {required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="flex gap-2 items-center">
                      {(control === 'date' || control === 'datetime') && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-[160px] justify-start text-left font-normal',
                                !dateValue && 'text-muted-foreground',
                                error ? 'border-destructive' : undefined
                              )}
                            >
                              {dateValue
                                ? formatDate(dateValue, 'yyyy-MM-dd')
                                : placeholder || 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateValue ?? undefined}
                              onSelect={handleDateChange}
                              disabled={(date) => {
                                if (key === 'endDate' && details.startDate) {
                                  const start = parseYMD(details.startDate);
                                  if (
                                    start instanceof Date &&
                                    !isNaN(start.getTime())
                                  ) {
                                    return date < start;
                                  }
                                }
                                return false;
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                      {(control === 'time' || control === 'datetime') && (
                        <Input
                          type="time"
                          value={timeValue}
                          onChange={handleTimeChange}
                          className={cn(
                            'w-[110px]',
                            error ? 'border-destructive' : undefined
                          )}
                          placeholder={placeholder || 'HH:mm'}
                        />
                      )}
                    </div>
                    {description && (
                      <p className="text-[11px] text-muted-foreground">
                        {description}
                      </p>
                    )}
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                );
              }

              return (
                <div key={key} className={cn('space-y-1.5', fieldClass)}>
                  <Label>{label}</Label>
                  <Input
                    value={toInputValue(rawVal)}
                    onChange={(e) => setValue(path, e.target.value)}
                    className={error ? 'border-destructive' : undefined}
                  />
                  {description && (
                    <p className="text-[11px] text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
