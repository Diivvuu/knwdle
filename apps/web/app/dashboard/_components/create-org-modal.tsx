// apps/web/src/components/create-org/CreateOrgModal.tsx
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { z } from 'zod';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';

import { ADMIN_BASE } from '@/lib/env';
import { api } from '@workspace/state';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Loader2, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { fetchOrgTypes, fetchOrgTypeSchema, createOrg } from '@workspace/state';
import MagicDialogShell from './magic-dialog-shell';
import { StepperHeader } from './stepper-chrome';
import { TypePicker } from './type-picker';
import SchemaFields from './schema-fields';
import { Switch } from '@workspace/ui/components/switch';
import { DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';

type Props = { open: boolean; onOpenChange: (v: boolean) => void };
type JsonSchema = any;

const TeamSizeSchema = z.object({
  teamSize: z
    .string()
    .min(1, 'Select or enter team size')
    .regex(
      /^(\d+|\d+\+\b|\d+\-\d+)$/,
      'Use a bucket (e.g. 1-10, 10+) or a number'
    ),
});

function TeamSizePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const OPTIONS = ['1-10', '11-50', '50+', '100+'];
  const [custom, setCustom] = React.useState<string>('');

  const isSelected = (v: string) => value === v;

  return (
    <div className="space-y-3">
      <Label className="text-sm">Approximate team size</Label>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Team size options"
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={[
              'h-10 rounded-xl border text-sm transition-all outline-none',
              'hover:shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/50',
              isSelected(opt)
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-muted-foreground/20 hover:border-muted-foreground/40',
            ].join(' ')}
            role="radio"
            aria-checked={isSelected(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-center">
        <Input
          inputMode="numeric"
          placeholder="Custom number e.g. 37"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && custom) onChange(custom);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() => custom && onChange(custom)}
          disabled={!custom}
        >
          Use custom
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Buckets help pre-set sensible defaults. You can fine-tune later.
      </p>
    </div>
  );
}

export default function CreateOrgModal({ open, onOpenChange }: Props) {
  const prefersReduced = useReducedMotion();
  const dispatch = useDispatch<AppDispatch>();
  const [pulse, setPulse] = useState(0);
  // org types + schemas from store (slice key: orgType)
  const orgTypes = useSelector((s: RootState) => s.orgType.types);
  const orgTypesStatus = useSelector((s: RootState) => s.orgType.status);
  const schemas = useSelector((s: RootState) => s.orgType.schemas);
  const schemaStatus = useSelector((s: RootState) => s.orgType.schemaStatus);

  // local step state
  const [step, setStep] = useState(0);
  const [teamSize, setTeamSize] = useState<string>('');
  const teamSizeError = useMemo(() => {
    const p = TeamSizeSchema.safeParse({ teamSize });
    return p.success ? '' : (p.error.issues[0]?.message ?? 'Invalid');
  }, [teamSize]);

  const [orgType, setOrgType] = useState<
    | 'SCHOOL'
    | 'COACHING_CENTER'
    | 'TUITION_CENTER'
    | 'COLLEGE'
    | 'UNIVERSITY'
    | 'EDTECH'
    | 'TRAINING'
    | 'NGO'
    | ''
  >('');

  const [details, setDetails] = useState<Record<string, any>>({});
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // UX: only show inline missing errors on step 3 after an attempt
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // fetch all org types on first open
  const fetchedTypesOnce = useRef(false);
  useEffect(() => {
    if (open && !fetchedTypesOnce.current && orgTypesStatus === 'idle') {
      fetchedTypesOnce.current = true;
      dispatch(fetchOrgTypes());
    }
  }, [open, orgTypesStatus, dispatch]);

  // when orgType changes, fetch schema (if needed)
  useEffect(() => {
    if (!orgType) return;
    const status = schemaStatus[orgType] || 'idle';
    if (status === 'idle' || status === 'failed') {
      dispatch(fetchOrgTypeSchema(orgType));
    }
  }, [orgType, schemaStatus, dispatch]);

  // when schema arrives, seed defaults (only once per type switch)
  const lastSeedType = useRef<string | null>(null);
  useEffect(() => {
    if (!orgType) return;
    const status = schemaStatus[orgType];
    const schema: JsonSchema | undefined = schemas[orgType];
    if (status !== 'succeeded' || !schema) return;
    if (lastSeedType.current === orgType) return;
    lastSeedType.current = orgType;

    // Extract defaults
    const def =
      schema.definitions?.[`OrgMeta_${orgType}`] ??
      schema.definitions?.[`OrgMeta_${orgType.toUpperCase()}`] ??
      schema;

    const props = def?.properties ?? {};
    const init: Record<string, any> = {};
    Object.entries(props).forEach(([k, v]: [string, any]) => {
      if (v?.default !== undefined) init[k] = v.default;
    });
    // seed features default container if missing
    if (props.features && init.features == null) init.features = {};
    init.teamSize = teamSize || undefined;
    setDetails((prev) => ({ ...init, ...prev }));
  }, [orgType, schemas, schemaStatus, teamSize]);

  useEffect(() => {
    setPulse((x) => x + 1);
  }, [orgType, teamSize]);

  // helpers
  const schema: JsonSchema | undefined = orgType ? schemas[orgType] : undefined;
  const currentSchemaStatus = orgType
    ? schemaStatus[orgType] || 'idle'
    : 'idle';
  const loadingSchema = currentSchemaStatus === 'loading';

  // resolve active definition
  const def = useMemo(() => {
    if (!schema || !orgType) return undefined;
    return (
      schema.definitions?.[`OrgMeta_${orgType}`] ??
      schema.definitions?.[`OrgMeta_${orgType.toUpperCase()}`] ??
      schema
    );
  }, [schema, orgType]);

  // features sub-schema (render separately)
  const featureProps: Record<string, any> =
    def?.properties?.features?.properties ?? {};

  // build required field list (excluding base-only)
  const requiredKeys: string[] = useMemo(() => {
    if (!def) return [];
    const req = def?.required ?? [];
    // we still validate "features" if present; hide only schemaVersion/teamSize (handled elsewhere)
    const HIDE_FROM_REQUIRED = new Set(['schemaVersion', 'teamSize']);
    return req.filter((k: string) => !HIDE_FROM_REQUIRED.has(k));
  }, [def]);

  // validators
  const isNonEmptyString = (v: any) =>
    typeof v === 'string' && v.trim().length > 0;
  const isValidArray = (v: any) => Array.isArray(v) && v.length > 0;
  const isNumberLike = (v: any) => typeof v === 'number' && !Number.isNaN(v);

  const nameValid = isNonEmptyString(details.name ?? details.affiliation ?? '');
  const missingRequired = useMemo(() => {
    return requiredKeys.filter((k) => {
      const v = k === 'features' ? details.features : details[k];
      if (k === 'features') {
        // if features is required, ensure object exists (zod default usually provides it)
        return v == null;
      }
      if (typeof v === 'boolean') return false;
      if (Array.isArray(v)) return !isValidArray(v);
      if (typeof v === 'number') return !isNumberLike(v);
      return !isNonEmptyString(v);
    });
  }, [requiredKeys, details]);

  const isStep0Valid = TeamSizeSchema.safeParse({ teamSize }).success;
  const isStep1Ready = orgTypesStatus === 'succeeded';
  const isStep1Valid = isStep1Ready && Boolean(orgType);
  const isStep2Valid =
    !loadingSchema &&
    currentSchemaStatus !== 'failed' &&
    nameValid &&
    missingRequired.length === 0;

  // keyboard nav mirrors buttons
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onOpenChange(false);
      if (loadingCreate) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if ((step === 0 && isStep0Valid) || (step === 1 && isStep1Valid))
          next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 0) prev();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (step < 2) {
          if ((step === 0 && isStep0Valid) || (step === 1 && isStep1Valid))
            next();
        } else if (step === 2) {
          setSubmitAttempted(true);
          if (isStep2Valid) onSubmit();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, isStep0Valid, isStep1Valid, isStep2Valid, loadingCreate]);

  const next = useCallback(() => {
    if (step === 0) {
      if (!isStep0Valid)
        return toast.error('Team size required', {
          description: teamSizeError,
        });
      setStep(1);
    } else if (step === 1) {
      if (!isStep1Valid) return toast.error('Select organisation type');
      setStep(2);
    }
  }, [step, isStep0Valid, isStep1Valid, teamSizeError]);

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const goto = useCallback(
    (i: number) => {
      if (i < step) return setStep(i);
      if (i === 1 && !isStep0Valid) return;
      if (i === 2 && !(isStep0Valid && isStep1Valid)) return;
      setStep(i);
    },
    [step, isStep0Valid, isStep1Valid]
  );

  const onChangeField = (key: string, value: any) =>
    setDetails((d) => ({ ...d, [key]: value }));

  // create with your `api`
  const onSubmit = useCallback(async () => {
    setSubmitAttempted(true);
    if (!orgType || !isStep2Valid) return;
    setLoadingCreate(true);
    setError('');

    try {
      const name =
        details?.name?.toString?.().trim?.() ||
        details?.affiliation?.toString?.() ||
        'New Organisation';

      const action = await dispatch(
        createOrg({
          name,
          type: orgType,
          teamSize,
          meta: { ...details },
        })
      );

      if (createOrg.fulfilled.match(action)) {
        const org = action.payload;
        setSuccess(true);
        setTimeout(
          () => {
            window.location.href = `${ADMIN_BASE}/onboard?org=${encodeURIComponent(
              org.id
            )}`;
          },
          prefersReduced ? 0 : 450
        );
      } else if (createOrg.rejected.match(action)) {
        throw new Error(action.error.message || 'Create org failed');
      }
    } catch (e: any) {
      setError(e.message || 'Create failed');
      toast.error('Create org failed', {
        description: e?.message ?? 'Something went wrong',
      });
    } finally {
      setLoadingCreate(false);
    }
  }, [orgType, isStep2Valid, details, teamSize, prefersReduced, dispatch]);
  const fields = useMemo(() => {
    if (!def) return [];
    const props = def?.properties ?? {};
    const required: string[] = def?.required ?? [];
    const HIDE_KEYS = new Set(['schemaVersion', 'teamSize']);
    const keys = Object.keys(props).filter(
      (k) => !HIDE_KEYS.has(k) && k !== 'features'
    );
    keys.sort((a, b) => (a === 'name' ? -1 : b === 'name' ? 1 : 0));
    return keys.map((key) => ({
      key,
      schema: props[key] || {},
      required: required.includes(key),
    }));
  }, [def]);

  // reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0);
        setTeamSize('');
        setOrgType('');
        setDetails({});
        setError('');
        setLoadingCreate(false);
        setSuccess(false);
        setSubmitAttempted(false);
        lastSeedType.current = null;
      }, 150);
    }
  }, [open]);

  // final button states
  const primaryLabel = step < 2 ? 'Next' : 'Create organisation';
  const primaryDisabled =
    loadingCreate ||
    (step === 0 && !isStep0Valid) ||
    (step === 1 && !isStep1Valid) ||
    (step === 2 && !isStep2Valid);

  const showInlineMissing =
    submitAttempted &&
    step === 2 &&
    !loadingSchema &&
    currentSchemaStatus !== 'failed' &&
    missingRequired.length > 0;

  return (
    <MagicDialogShell open={open} onOpenChange={onOpenChange}>
      {/* header */}
      <DialogHeader>
        <DialogTitle>
          <StepperHeader
            step={step}
            onBack={prev}
            canBack={step > 0 && !loadingCreate}
            onStepChange={goto}
            steps={['Team', 'Type', 'Details']}
          />
        </DialogTitle>
      </DialogHeader>

      {/* body */}
      <div className="grid md:grid-cols-[1.2fr_.8fr] gap-0 h-[calc(78vh-88px-64px)] md:h-[calc(78vh-96px-72px)]">
        {/* left: step content */}
        <div className="overflow-y-auto px-5 py-4 rounded-none md:rounded-tr-none">
          <div className="rounded-xl border bg-card p-4 md:p-5">
            {step === 0 && (
              <>
                <TeamSizePicker value={teamSize} onChange={setTeamSize} />
                {teamSize && teamSizeError && (
                  <p className="text-xs text-destructive mt-1">
                    {teamSizeError}
                  </p>
                )}
              </>
            )}
            {step === 1 && (
              <div className="space-y-3">
                {orgTypesStatus === 'loading' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading types…
                  </div>
                )}
                {orgTypesStatus === 'failed' && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Failed to load organisation types
                    </AlertDescription>
                  </Alert>
                )}
                {orgTypesStatus === 'succeeded' && (
                  <TypePicker
                    value={orgType}
                    onChange={setOrgType as any}
                    options={orgTypes}
                  />
                )}
                <p className="text-[11px] text-muted-foreground">
                  Pick the closest fit — you can adjust features later.
                </p>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                {/* Name + Team size (context) */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Organisation name</Label>
                    <Input
                      placeholder="e.g. Greenwood College"
                      value={details.name ?? ''}
                      onChange={(e) => onChangeField('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Team size</Label>
                    <Input value={teamSize} disabled aria-readonly />
                    <p className="text-[11px] text-muted-foreground">
                      Set in Step 1
                    </p>
                  </div>
                </div>

                {/* Features (render everything from API if present) */}
                {Object.keys(featureProps).length > 0 && (
                  <div className="rounded-xl border p-3 sm:p-4">
                    <div className="text-sm font-medium mb-2">Features</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.keys(featureProps).map((k) => (
                        <div
                          key={k}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div>
                            <Label className="capitalize">{k}</Label>
                            {featureProps[k]?.description && (
                              <p className="text-xs text-muted-foreground">
                                {featureProps[k].description}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={Boolean(details.features?.[k])}
                            onCheckedChange={(v) =>
                              onChangeField('features', {
                                ...(details.features ?? {}),
                                [k]: v,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other fields from schema */}
                {loadingSchema ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading fields…
                  </div>
                ) : currentSchemaStatus === 'failed' ? (
                  <Alert variant="destructive">
                    <AlertDescription>Failed to load fields</AlertDescription>
                  </Alert>
                ) : (
                  <SchemaFields
                    schemaFields={fields}
                    details={details}
                    onChange={onChangeField}
                  />
                )}

                {/* Inline validation (only after submit attempted) */}
                {showInlineMissing && (
                  <p className="text-xs text-destructive">
                    {missingRequired.length} required field
                    {missingRequired.length > 1 ? 's' : ''} missing:{' '}
                    {missingRequired.slice(0, 4).join(', ')}
                    {missingRequired.length > 4 ? '…' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* right: live preview */}
        <div className="hidden md:block border-l">
          <div className="h-full overflow-y-auto px-5 py-4">
            <div className="text-sm font-medium mb-3">Preview</div>
            <div
              key={pulse}
              className="rounded-xl border p-4 bg-muted/30 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="text-xs text-muted-foreground mb-2">
                Organisation
              </div>
              <div className="text-base font-semibold">
                {details.name || '—'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Type: {orgType || '—'} • Team size: {teamSize || '—'}
              </div>

              {orgType && (
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-2">
                    Key Fields
                  </div>
                  <ul className="space-y-1 text-sm">
                    {fields.slice(0, 6).map(({ key }) => (
                      <li key={key} className="flex justify-between gap-4">
                        <span className="capitalize text-muted-foreground">
                          {key}
                        </span>
                        <span className="truncate max-w-[12rem] text-right">
                          {Array.isArray(details[key])
                            ? details[key].join(', ')
                            : typeof details[key] === 'boolean'
                              ? details[key]
                                ? 'Yes'
                                : 'No'
                              : (details[key] ?? '—')}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {Object.keys(featureProps).length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Features
                      </div>
                      <ul className="space-y-1 text-sm">
                        {Object.keys(featureProps).map((k) => (
                          <li key={k} className="flex justify-between gap-4">
                            <span className="capitalize text-muted-foreground">
                              {k}
                            </span>
                            <span className="text-right">
                              {details.features?.[k] ? 'On' : 'Off'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {success && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-primary/10 text-primary">
                  <PartyPopper className="h-4 w-4" />
                  Created! Redirecting…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="sticky bottom-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {step === 0 && 'Choose team size bucket or enter a custom number.'}
            {step === 1 &&
              'Pick the closest org type. You can fine-tune later.'}
            {step === 2 &&
              'Review key fields before creating your organisation.'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loadingCreate}
            >
              Cancel
            </Button>
            <Button
              onClick={step < 2 ? next : onSubmit}
              disabled={
                loadingCreate ||
                (step === 0 && !isStep0Valid) ||
                (step === 1 && !isStep1Valid) ||
                (step === 2 && !isStep2Valid)
              }
              className="focus-visible:ring-2 focus-visible:ring-primary/50 data-[state=open]:shadow-none"
            >
              {loadingCreate ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {step < 2 ? 'Continue' : 'Create organisation'}
            </Button>
          </div>
        </div>
      </div>
    </MagicDialogShell>
  );
}
