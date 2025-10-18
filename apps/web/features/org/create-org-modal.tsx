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
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Loader2, PartyPopper } from 'lucide-react';
import { fetchOrgTypes, fetchOrgTypeSchema, createOrg } from '@workspace/state';
import { StepperHeader } from '../../app/dashboard/_components/stepper-chrome';
import { TypePicker } from '../../app/dashboard/_components/type-picker';
import SchemaFields from '../../app/dashboard/_components/schema-fields';
import { Switch } from '@workspace/ui/components/switch';
import { useCreateOrgModal } from './use-org-atom';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@workspace/ui/components/modal';
import { TeamSizePicker } from '@/_components/team-size-picker';

type JsonSchema = any;

export default function CreateOrgModal() {
  const prefersReduced = useReducedMotion();
  const dispatch = useDispatch<AppDispatch>();
  const [pulse, setPulse] = useState(0);
  const [open, setOpen] = useCreateOrgModal();

  // org types + schemas from Redux
  const orgTypes = useSelector((s: RootState) => s.orgType.types);
  const orgTypesStatus = useSelector((s: RootState) => s.orgType.status);
  const schemas = useSelector((s: RootState) => s.orgType.schemas);
  const schemaStatus = useSelector((s: RootState) => s.orgType.schemaStatus);

  // local state
  const [step, setStep] = useState(0);
  const [teamSize, setTeamSize] = useState<string>(''); // optional
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
  const [success, setSuccess] = useState(false);

  // UX flags
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // fetch types on first open
  const fetchedTypesOnce = useRef(false);
  useEffect(() => {
    if (open && !fetchedTypesOnce.current && orgTypesStatus === 'idle') {
      fetchedTypesOnce.current = true;
      dispatch(fetchOrgTypes());
    }
  }, [open, orgTypesStatus, dispatch]);

  // hit /org-types/:type/schema on change
  useEffect(() => {
    if (!orgType) return;
    const status = schemaStatus[orgType] || 'idle';
    if (status === 'idle' || status === 'failed') {
      dispatch(fetchOrgTypeSchema({ type: orgType }));
    }
  }, [orgType, schemaStatus, dispatch]);

  // current schema payload from store
  const schemaPayload:
    | {
        definition: any;
        groups?: { name: string; fields: string[] }[];
        uiVersion?: number;
      }
    | undefined = orgType ? (schemas[orgType] as any) : undefined;

  const currentSchemaStatus = orgType
    ? schemaStatus[orgType] || 'idle'
    : 'idle';
  const loadingSchema = currentSchemaStatus === 'loading';

  // seed defaults when payload arrives
  const lastSeedType = useRef<string | null>(null);
  useEffect(() => {
    if (!orgType) return;
    const status = schemaStatus[orgType];
    const payload = schemas[orgType] as any | undefined;
    const definition = payload?.definition;
    if (status !== 'succeeded' || !definition) return;
    if (lastSeedType.current === orgType) return;
    lastSeedType.current = orgType;

    const props = definition?.properties ?? {};
    const init: Record<string, any> = {};

    Object.entries(props).forEach(([k, v]: [string, any]) => {
      if (v?.default !== undefined) init[k] = v.default;
    });

    if (props.features && init.features == null) init.features = {};
    init.teamSize = teamSize || undefined;

    setDetails((prev) => ({ ...init, ...prev }));
  }, [orgType, schemas, schemaStatus, teamSize]);

  useEffect(() => {
    setPulse((x) => x + 1);
  }, [orgType, teamSize]);

  // definition for field renderer
  const def: JsonSchema | undefined = useMemo(() => {
    return schemaPayload?.definition ?? undefined;
  }, [schemaPayload]);

  // features block
  const featureProps: Record<string, any> =
    def?.properties?.features?.properties ?? {};

  // required keys
  const requiredKeys: string[] = useMemo(() => {
    if (!def) return [];
    const req = def?.required ?? [];
    const HIDE = new Set(['schemaVersion', 'teamSize']);
    return req.filter((k: string) => !HIDE.has(k));
  }, [def]);

  // validators
  const isNonEmptyString = (v: any) =>
    typeof v === 'string' && v.trim().length > 0;
  const rawName = (details.name ?? details.affiliation ?? '') as string;
  const trimmedName = typeof rawName === 'string' ? rawName.trim() : '';
  const nameValid = trimmedName.length >= 2;

  const missingRequired = useMemo(() => {
    if (!def) return [];
    const isValidArray = (v: any) => Array.isArray(v) && v.length > 0;
    const isNumberLike = (v: any) => typeof v === 'number' && !Number.isNaN(v);

    return requiredKeys.filter((k) => {
      const v = k === 'features' ? details.features : details[k];
      if (k === 'features') return v == null;
      if (typeof v === 'boolean') return false;
      if (Array.isArray(v)) return !isValidArray(v);
      if (typeof v === 'number') return !isNumberLike(v);
      return !isNonEmptyString(v);
    });
  }, [requiredKeys, details, def]);

  // step validity
  const isStep1Ready = orgTypesStatus === 'succeeded';
  const isStep1Valid = isStep1Ready && Boolean(orgType);
  const isStep2Valid =
    !loadingSchema &&
    currentSchemaStatus !== 'failed' &&
    nameValid &&
    missingRequired.length === 0;

  // keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (loadingCreate) return;

      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
      if (e.key === 'Enter') {
        if ((e as any).isComposing) return;
        const el = document.activeElement as HTMLElement | null;
        const tag = (el?.tagName || '').toLowerCase();
        if (tag === 'textarea') return;
        if (step < 2) next();
        else submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, loadingCreate, isStep1Valid, isStep2Valid]);

  const next = useCallback(() => {
    setAttemptedStep(step);
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!isStep1Valid) {
        toast.error('Select an organisation type');
        return;
      }
      setStep(2);
    }
  }, [step, isStep1Valid]);

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const goto = useCallback(
    (i: number) => {
      if (i < step) return setStep(i);
      if (i === 1) return setStep(1);
      if (i === 2 && isStep1Valid) return setStep(2);
    },
    [step, isStep1Valid]
  );

  const onChangeField = (key: string, value: any) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const submit = useCallback(() => {
    setAttemptedSubmit(true);
    if (!isStep1Valid) {
      toast.error('Please select an organisation type');
      setStep(1);
      return;
    }
    if (!nameValid) {
      toast.error('Organisation name must be at least 2 characters');
      setStep(2);
      return;
    }
    if (!isStep2Valid) {
      toast.error('Please complete the required details');
      setStep(2);
      return;
    }
    onSubmit();
  }, [isStep1Valid, isStep2Valid, nameValid]);

  const onSubmit = useCallback(async () => {
    setLoadingCreate(true);
    try {
      const name = trimmedName || 'New Organisation'; // use trimmedName above
      if (name.length < 2) {
        throw new Error('Organisation name must be at least 2 characters');
      }

      const payload = {
        name,
        type: orgType,
        teamSize: teamSize || undefined,
        meta: { ...details, teamSize: teamSize || undefined },
      };

      const action = await dispatch(createOrg(payload as any));
      if (createOrg.fulfilled.match(action)) {
        setSuccess(true);
        const org = action.payload;
        setTimeout(
          () => {
            window.location.href = `${ADMIN_BASE}/onboard?org=${encodeURIComponent(org.id)}`;
          },
          prefersReduced ? 0 : 450
        );
      } else {
        throw new Error(action.error.message || 'Create org failed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Create org failed');
    } finally {
      setLoadingCreate(false);
    }
  }, [dispatch, orgType, details, teamSize, prefersReduced]);

  // ordered fields for preview (use groups if provided)
  const fields = useMemo(() => {
    if (!def) return [];
    const props = def?.properties ?? {};
    const required: string[] = def?.required ?? [];
    const HIDE = new Set(['schemaVersion', 'teamSize', 'features']);

    const allKeys = Object.keys(props).filter((k) => !HIDE.has(k));
    const groups = (schemaPayload?.groups ?? []) as {
      name: string;
      fields: string[];
    }[];

    const orderedFromGroups: string[] = groups.flatMap((g) =>
      g.fields.filter((f) => allKeys.includes(f))
    );

    const remaining = allKeys.filter((k) => !orderedFromGroups.includes(k));
    remaining.sort((a, b) => (a === 'name' ? -1 : b === 'name' ? 1 : 0));

    const finalKeys = [...orderedFromGroups, ...remaining];

    return finalKeys.map((key) => ({
      key,
      schema: props[key] || {},
      required: required.includes(key),
    }));
  }, [def, schemaPayload]);

  // reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0);
        setTeamSize('');
        setOrgType('');
        setDetails({});
        setLoadingCreate(false);
        setSuccess(false);
        setAttemptedStep(null);
        setAttemptedSubmit(false);
        lastSeedType.current = null;
      }, 120);
    }
  }, [open]);

  const showInlineMissing =
    attemptedSubmit &&
    step === 2 &&
    !loadingSchema &&
    currentSchemaStatus !== 'failed' &&
    missingRequired.length > 0;

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent size="full">
        <ModalHeader>
          <ModalTitle>
            <StepperHeader
              step={step}
              onBack={prev}
              canBack={step > 0 && !loadingCreate}
              onStepChange={goto}
              steps={['Team', 'Type', 'Details']}
            />
          </ModalTitle>
          <ModalDescription className="sr-only">
            Create a new organisation
          </ModalDescription>
        </ModalHeader>

        <div className="grid md:grid-cols-[1.2fr_.8fr] gap-0 h-[calc(78vh-88px-64px)] md:h-[calc(78vh-96px-72px)]">
          {/* left: step content */}
          <div className="overflow-y-auto px-5 py-4">
            <div className="rounded-xl border bg-card p-4 md:p-5">
              {step === 0 && (
                <TeamSizePicker value={teamSize} onChange={setTeamSize} />
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
                    <>
                      <TypePicker
                        value={orgType}
                        onChange={setOrgType as any}
                        options={orgTypes}
                      />
                      {attemptedStep === 1 && !isStep1Valid && (
                        <p className="text-xs text-destructive">
                          Please pick an organisation type to continue.
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Pick the closest fit — you can adjust features later.
                  </p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organisation name</Label>
                      <Input
                        placeholder="e.g. Greenwood College"
                        value={details.name ?? ''}
                        onChange={(e) => onChangeField('name', e.target.value)}
                      />
                      {attemptedSubmit && !nameValid && (
                        <p className="text-xs text-destructive">
                          Name must be at least 2 characters.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Team size</Label>
                      <Input
                        value={teamSize || ''}
                        placeholder="(optional)"
                        onChange={(e) => setTeamSize(e.target.value)}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        You can set or adjust this later.
                      </p>
                    </div>
                  </div>

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
                      def={def}
                      details={details}
                      onChange={onChangeField}
                      attemptedSubmit={attemptedSubmit}
                    />
                  )}

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

          {/* right: preview */}
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

        <ModalFooter className="sticky bottom-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t px-5 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {step === 0 && 'Pick a bucket or skip — you can set it later.'}
              {step === 1 && 'Choose the closest organisation type.'}
              {step === 2 &&
                'Review details before creating your organisation.'}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={loadingCreate}
              >
                Cancel
              </Button>
              {step < 2 ? (
                <Button onClick={next} disabled={loadingCreate}>
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={loadingCreate || loadingSchema || !nameValid}
                >
                  {loadingCreate ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create organisation
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
