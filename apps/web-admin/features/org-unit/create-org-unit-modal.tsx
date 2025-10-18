'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { useCreateUnitModal } from './use-org-unit-atom';

import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@workspace/ui/components/modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Textarea } from '@workspace/ui/components/textarea';
import { cn } from '@workspace/ui/lib/utils';
import { Loader2, Undo2 } from 'lucide-react';

// slices
import {
  fetchOrgUnits,
  fetchOrgUnitsTree,
  createOrgUnit,
} from '@workspace/state';
import { fetchOrgUnitTypes, fetchOrgUnitSchema } from '@workspace/state';

/* -------------------------- JSON Schema (simple) -------------------------- */
type JSONSchema = {
  type?: string;
  title?: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  default?: any;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  [k: string]: any;
};

type Errors = Record<string, string | undefined>;

export default function AddUnitModal() {
  const dispatch = useDispatch<AppDispatch>();
  const [createState, setCreateState] = useCreateUnitModal(); // { orgId, parentId?, presetType? } | null

  const open = Boolean(createState);
  const orgId = createState?.orgId ?? '';

  const orgUnitTypes = useSelector((s: RootState) => s.orgUnitTypes);
  const types = orgUnitTypes.types;
  const typesStatus = orgUnitTypes.typesStatus;
  const schemaByType = orgUnitTypes.schemaByType;
  const schemaStatus = orgUnitTypes.schemaStatus;

  const unitsState = useSelector((s: RootState) => s.orgUnit.unitsByOrg[orgId]);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [type, setType] = useState<string>('');
  const [meta, setMeta] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // bootstrap
  useEffect(() => {
    if (!open || !orgId) return;
    dispatch(fetchOrgUnits(orgId));
    dispatch(fetchOrgUnitTypes());
  }, [open, orgId, dispatch]);

  // preset parent/type from opener payload
  useEffect(() => {
    if (!open) return;
    if (createState?.parentId) setParentId(createState.parentId);
    if (createState?.presetType) setType(createState.presetType);
  }, [open, createState?.parentId, createState?.presetType]);

  // load schema whenever type changes
  useEffect(() => {
    if (!open || !type) return;
    dispatch(fetchOrgUnitSchema(type));
  }, [open, type, dispatch]);

  // reset form on modal close
  useEffect(() => {
    if (!open) {
      setName('');
      setCode('');
      setParentId(null);
      setType('');
      setMeta({});
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const loadingTypes = typesStatus === 'loading';
  const loadingSchema = schemaStatus === 'loading';
  const jsonSchema = schemaByType[type]?.schema as JSONSchema | undefined;

  // Apply defaults from schema to meta when schema loads or changes type
  useEffect(() => {
    if (!open || !jsonSchema) return;
    setMeta((prev) => deepApplyDefaults(jsonSchema, prev));
  }, [open, jsonSchema]);

  const units = unitsState?.items ?? [];

  // 1) pure function – no setState
  function computeErrors(
    schema: JSONSchema | undefined,
    meta: Record<string, any>
  ): Errors {
    const errs: Errors = {};
    if (!schema) return errs;

    function dfs(s: JSONSchema, val: any, path = '') {
      const r = s.required ?? [];
      for (const k of r) {
        const f = s.properties?.[k] as JSONSchema | undefined;
        const v = val?.[k];
        const full = path ? `${path}.${k}` : k;

        if (f?.type === 'string' && (v === undefined || v === ''))
          errs[full] = 'Required';
        else if (
          (f?.type === 'number' || f?.type === 'integer') &&
          (v === '' || v === undefined || v === null)
        )
          errs[full] = 'Required';
        else if (f?.type === 'object' && (v === undefined || v === null))
          errs[full] = 'Required';
        else if (f?.type === 'array' && (!Array.isArray(v) || v.length === 0))
          errs[full] = 'Required';
      }
      if (s.type === 'object' && s.properties) {
        for (const [k, child] of Object.entries(s.properties)) {
          dfs(child as JSONSchema, val?.[k], path ? `${path}.${k}` : k);
        }
      }
    }

    dfs(schema, meta, '');
    return errs;
  }

  // 2) derive validity without setState
  const derivedErrors = useMemo(
    () => computeErrors(jsonSchema, meta),
    [jsonSchema, meta]
  );
  const isValid = Object.keys(derivedErrors).length === 0;

  // 3) use derived validity (no setState here)
  const canSubmit = !submitting && name.trim().length >= 2 && !!type && isValid;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !type) return;

    const errs = computeErrors(jsonSchema, meta);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const ok = validateClient(jsonSchema, meta, setErrors);
    if (!ok) return;

    setSubmitting(true);
    const res = await dispatch(
      createOrgUnit({
        orgId,
        name: name.trim(),
        code: code.trim() || undefined,
        parentId: parentId ?? undefined,
        type,
        meta: cleanMetaForSubmit(meta),
      })
    );
    setSubmitting(false);

    if ((res as any).error) return;

    // refresh lists
    dispatch(fetchOrgUnits(orgId));
    dispatch(fetchOrgUnitsTree(orgId));

    // close
    setCreateState(null);
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && setCreateState(null)}>
      <ModalContent size="xl">
        <ModalHeader>
          <ModalTitle>Create organisation unit</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-6">
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={onSubmit}
          >
            {/* Basic fields */}
            <div className="space-y-2">
              <Label>
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Department of Physics"
              />
            </div>

            <div className="space-y-2">
              <Label>Code (optional)</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. PHY"
              />
            </div>

            <div className="space-y-2">
              <Label>Parent unit (optional)</Label>
              <Select
                value={parentId ?? ''}
                onValueChange={(v) => setParentId(v === '' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v)}
                disabled={loadingTypes}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingTypes ? 'Loading types…' : 'Select type'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Meta dynamic renderer */}
            <div className="md:col-span-2 pt-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium text-sm">Additional settings</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    setMeta((prev) => deepApplyDefaults(jsonSchema, {}))
                  }
                  disabled={!jsonSchema}
                >
                  <Undo2 className="h-4 w-4" />
                  Reset to defaults
                </Button>
              </div>

              {loadingSchema ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading schema…
                </div>
              ) : type && jsonSchema ? (
                <div className="space-y-4">
                  {/* Features block (if present & is object of booleans) */}
                  <FeaturesBlock
                    schema={jsonSchema}
                    meta={meta}
                    onChange={setMeta}
                  />

                  {/* All other properties */}
                  <MetaForm
                    schema={jsonSchema}
                    value={meta}
                    onChange={setMeta}
                  />

                  {/* Inline validation summary */}
                  <InlineErrors errors={errors} />
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Select a type to configure its settings.
                </div>
              )}
            </div>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setCreateState(null)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating…
              </>
            ) : (
              'Create'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ------------------------------ Features block ----------------------------- */

function FeaturesBlock({
  schema,
  meta,
  onChange,
}: {
  schema: JSONSchema;
  meta: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
}) {
  const featuresSchema = schema.properties?.features as JSONSchema | undefined;
  if (!featuresSchema || featuresSchema.type !== 'object') return null;

  const props = featuresSchema.properties ?? {};
  if (!Object.keys(props).length) return null;

  const value = (meta.features ?? {}) as Record<string, any>;
  function update(k: string, v: boolean) {
    const next = { ...(meta.features ?? {}), [k]: v };
    onChange({ ...meta, features: next });
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-semibold mb-2">Features</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {Object.entries(props).map(([key, def]) => {
          const label = def.title ?? startCase(key);
          const help = def.description as string | undefined;
          const checked =
            typeof value[key] === 'boolean'
              ? value[key]
              : typeof def.default === 'boolean'
                ? def.default
                : false;

          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="mr-3">
                <div className="text-sm font-medium">{label}</div>
                {help ? (
                  <div className="text-[11px] text-muted-foreground">
                    {help}
                  </div>
                ) : null}
              </div>
              <Switch
                checked={checked}
                onCheckedChange={(v) => update(key, v)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------- Generic meta form renderer ---------------------- */

function MetaForm({
  schema,
  value,
  onChange,
  prefix = '',
}: {
  schema: JSONSchema;
  value: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
  prefix?: string;
}) {
  const properties = schema.properties ?? {};
  const required = new Set<string>(schema.required ?? []);

  // Show everything except "schemaVersion" (internal marker)
  const entries = useMemo(
    () => Object.entries(properties).filter(([key]) => key !== 'schemaVersion'),
    [properties]
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        No additional fields for this type.
      </div>
    );
  }

  function update(key: string, v: any) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {entries.map(([key, prop]) => {
        // features are rendered in a dedicated block above — skip here
        if (key === 'features') return null;

        const fieldId = prefix ? `${prefix}.${key}` : key;
        const label = prop.title ?? startCase(key);
        const help = prop.description as string | undefined;
        const isReq = required.has(key);
        const current = value?.[key];

        // enums -> select
        if (prop.enum && Array.isArray(prop.enum)) {
          return (
            <div key={fieldId} className="space-y-2">
              <Label>
                {label} {isReq ? <span className="text-red-500">*</span> : null}
              </Label>
              <Select
                value={(current ?? '') as string}
                onValueChange={(v) => update(key, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {prop.enum.map((opt: string) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {help ? (
                <div className="text-[11px] text-muted-foreground">{help}</div>
              ) : null}
            </div>
          );
        }

        // boolean -> switch
        if (prop.type === 'boolean') {
          const checked =
            typeof current === 'boolean'
              ? current
              : typeof prop.default === 'boolean'
                ? prop.default
                : false;
          return (
            <div
              key={fieldId}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <div className="text-sm font-medium">
                  {label}{' '}
                  {isReq ? <span className="text-red-500">*</span> : null}
                </div>
                {help ? (
                  <div className="text-[11px] text-muted-foreground">
                    {help}
                  </div>
                ) : null}
              </div>
              <Switch
                checked={checked}
                onCheckedChange={(v) => update(key, v)}
              />
            </div>
          );
        }

        // number / integer
        if (prop.type === 'number' || prop.type === 'integer') {
          return (
            <div key={fieldId} className="space-y-2">
              <Label>
                {label} {isReq ? <span className="text-red-500">*</span> : null}
              </Label>
              <Input
                type="number"
                value={current ?? ''}
                onChange={(e) => {
                  const txt = e.target.value;
                  update(
                    key,
                    txt === ''
                      ? ''
                      : Number.isNaN(Number(txt))
                        ? ''
                        : Number(txt)
                  );
                }}
                placeholder={help}
                min={prop.minimum as number | undefined}
                max={prop.maximum as number | undefined}
              />
              {help ? (
                <div className="text-[11px] text-muted-foreground">{help}</div>
              ) : null}
            </div>
          );
        }

        // string (long text for likely description/body)
        if (prop.type === 'string') {
          const long =
            /description|notes|about|detail|body/i.test(key) ||
            prop.format === 'multiline';
          if (long) {
            return (
              <div key={fieldId} className="space-y-2 md:col-span-2">
                <Label>
                  {label}{' '}
                  {isReq ? <span className="text-red-500">*</span> : null}
                </Label>
                <Textarea
                  value={current ?? ''}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={help}
                  className="min-h-[96px]"
                />
                {help ? (
                  <div className="text-[11px] text-muted-foreground">
                    {help}
                  </div>
                ) : null}
              </div>
            );
          }
          return (
            <div key={fieldId} className="space-y-2">
              <Label>
                {label} {isReq ? <span className="text-red-500">*</span> : null}
              </Label>
              <Input
                value={current ?? ''}
                onChange={(e) => update(key, e.target.value)}
                placeholder={help}
              />
              {help ? (
                <div className="text-[11px] text-muted-foreground">{help}</div>
              ) : null}
            </div>
          );
        }

        // arrays of strings -> comma separated input
        if (prop.type === 'array' && prop.items?.type === 'string') {
          const arr: string[] = Array.isArray(current) ? current : [];
          return (
            <div key={fieldId} className="space-y-2 md:col-span-2">
              <Label>
                {label} {isReq ? <span className="text-red-500">*</span> : null}
              </Label>
              <Input
                value={arr.join(', ')}
                onChange={(e) =>
                  update(
                    key,
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder={help ?? 'Comma-separated'}
              />
              {help ? (
                <div className="text-[11px] text-muted-foreground">{help}</div>
              ) : null}
            </div>
          );
        }

        // nested object -> recurse
        if (prop.type === 'object' && prop.properties) {
          const nestedVal = (current ?? {}) as Record<string, any>;
          return (
            <div key={fieldId} className="md:col-span-2 rounded-md border p-3">
              <div className="text-sm font-semibold mb-3">{label}</div>
              <MetaForm
                schema={prop}
                value={nestedVal}
                onChange={(nv) => update(key, nv)}
                prefix={fieldId}
              />
            </div>
          );
        }

        // fallback: string
        return (
          <div key={fieldId} className="space-y-2">
            <Label>{label}</Label>
            <Input
              value={current ?? ''}
              onChange={(e) => update(key, e.target.value)}
              placeholder={help}
            />
            {help ? (
              <div className="text-[11px] text-muted-foreground">{help}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------- Inline error list --------------------------- */

function InlineErrors({ errors }: { errors: Errors }) {
  const list = Object.entries(errors).filter(([, v]) => !!v);
  if (!list.length) return null;
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <div className="font-semibold mb-1">Please fix the following:</div>
      <ul className="list-disc pl-5 space-y-1">
        {list.map(([k, v]) => (
          <li key={k}>
            <span className="font-medium">{startCase(k)}:</span> {v}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- Helpers -------------------------------- */

function startCase(s: string) {
  return s
    .replace(/[_\-]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

// Deep apply defaults from schema into current value (without clobbering edits)
function deepApplyDefaults(schema?: JSONSchema, current?: any): any {
  if (!schema) return current ?? {};
  const t = schema.type;

  if (t === 'object' && schema.properties) {
    const out: Record<string, any> = { ...(current ?? {}) };
    for (const [k, s] of Object.entries(schema.properties)) {
      const existing = out[k];
      const applied = deepApplyDefaults(s as JSONSchema, existing);
      // if no value and schema has default at this node
      const nodeDefault = (s as JSONSchema).default;
      if (existing === undefined) {
        if (nodeDefault !== undefined) out[k] = nodeDefault;
        else out[k] = applied === undefined ? applied : applied;
      } else {
        out[k] = applied;
      }
    }
    return out;
  }

  if (current !== undefined) return current;
  if (schema.default !== undefined) return schema.default;

  // primitive fallback
  if (t === 'array') return Array.isArray(current) ? current : [];
  if (t === 'boolean') return typeof current === 'boolean' ? current : false;
  return current;
}

// minimal client-side validation based on "required"
function validateClient(
  schema: JSONSchema | undefined,
  meta: Record<string, any>,
  setErrors: (e: Errors) => void
): boolean {
  if (!schema) {
    setErrors({});
    return true;
  }
  const errs: Errors = {};
  function dfs(s: JSONSchema, val: any, path = '') {
    const r = s.required ?? [];
    for (const k of r) {
      const v = val?.[k];
      const f = s.properties?.[k] as JSONSchema | undefined;
      const full = path ? `${path}.${k}` : k;
      if (f?.type === 'string' && (v === undefined || v === '')) {
        errs[full] = 'Required';
      } else if (
        (f?.type === 'number' || f?.type === 'integer') &&
        (v === '' || v === undefined || v === null)
      ) {
        errs[full] = 'Required';
      } else if (f?.type === 'object' && (v === undefined || v === null)) {
        errs[full] = 'Required';
      } else if (f?.type === 'array' && (!Array.isArray(v) || v.length === 0)) {
        errs[full] = 'Required';
      }
    }
    if (s.type === 'object' && s.properties) {
      for (const [k, child] of Object.entries(s.properties)) {
        dfs(child as JSONSchema, val?.[k], path ? `${path}.${k}` : k);
      }
    }
  }
  dfs(schema, meta, '');
  setErrors(errs);
  return Object.keys(errs).length === 0;
}

// drop null/empty strings recursively to keep payload clean
function cleanMetaForSubmit(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (v === '' || v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const inner = cleanMetaForSubmit(v);
      if (Object.keys(inner).length) out[k] = inner;
      continue;
    }
    out[k] = v;
  }
  return out;
}
