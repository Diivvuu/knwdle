'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  fetchOrgTypes,
  fetchOrgTypeSchema,
  createOrg,
  fetchOrgTypeStructure,
} from '@workspace/state';
import SchemaFields from '@workspace/ui/components/app/schema-fields';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Label } from '@workspace/ui/components/label';
import {
  Loader2,
  PartyPopper,
  Eye,
  EyeOff,
  Building2,
  Target,
  BookOpen,
  GraduationCap,
  Laptop,
  Briefcase,
  Heart,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { ADMIN_BASE } from '@/lib/env';
import { TeamSizePicker } from '@/_components/team-size-picker';
import { OrgTypePicker } from '@workspace/ui/components/app/type-picker';

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

type JsonSchema = any;

const ORG_TEMPLATES = [
  {
    key: 'SCHOOL',
    name: 'School',
    icon: Building2,
    tagline: 'Classes, teachers & parents',
  },
  {
    key: 'COACHING_CENTER',
    name: 'Coaching Center',
    icon: Target,
    tagline: 'Focused test prep batches',
  },
  {
    key: 'TUITION_CENTER',
    name: 'Tuition Center',
    icon: BookOpen,
    tagline: 'Neighborhood tutoring setup',
  },
  {
    key: 'COLLEGE',
    name: 'College / University',
    icon: GraduationCap,
    tagline: 'Departments & faculties',
  },
  {
    key: 'UNIVERSITY',
    name: 'University',
    icon: GraduationCap,
    tagline: 'Higher education ecosystem',
  },
  {
    key: 'EDTECH',
    name: 'EdTech',
    icon: Laptop,
    tagline: 'Online learning platform',
  },
  {
    key: 'TRAINING',
    name: 'Training',
    icon: Briefcase,
    tagline: 'Professional or skill courses',
  },
  {
    key: 'NGO',
    name: 'NGO',
    icon: Heart,
    tagline: 'Community or volunteer group',
  },
];
// ---- Motion variants (subtle, reduced-motion aware) ----
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ---- Reusable type picker (shadcn-friendly) ----

export default function CreateOrgPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const prefersReducedMotion = useReducedMotion();

  const orgTypes = useSelector((s: RootState) => s.orgType.types);
  const orgTypesStatus = useSelector((s: RootState) => s.orgType.status);
  const schemas = useSelector((s: RootState) => s.orgType.schemas);
  const schemaStatus = useSelector((s: RootState) => s.orgType.schemaStatus);

  const structures = useSelector((s: RootState) => s.orgType.structures);
  const structureStatus = useSelector(
    (s: RootState) => s.orgType.structureStatus
  );

  const [step, setStep] = useState(0);
  const [teamSize, setTeamSize] = useState<string>('');
  const [sizeSkipped, setSizeSkipped] = useState(false);
  const [orgType, setOrgType] = useState<OrgTypeKey>('');
  const [details, setDetails] = useState<Record<string, any>>({});
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (orgTypesStatus === 'idle') dispatch(fetchOrgTypes());
  }, [dispatch, orgTypesStatus]);

  useEffect(() => {
    if (!orgType) return;
    const status = schemaStatus[orgType] || 'idle';
    if (status === 'idle' || status === 'failed') {
      dispatch(fetchOrgTypeSchema({ type: orgType }));
    }
  }, [orgType, schemaStatus, dispatch]);

  useEffect(() => {
    if (!orgType) return;
    const status = structureStatus[orgType] || 'idle';
    if (status === 'idle' || status === 'failed') {
      dispatch(fetchOrgTypeStructure({ type: orgType }));
    }
  }, [orgType, structureStatus, dispatch]);

  const structureData = orgType ? structures[orgType] : undefined;
  const loadingStructure = orgType && structureStatus[orgType] === 'loading';

  const schemaPayload = orgType ? (schemas[orgType] as any) : undefined;
  const currentSchemaStatus = orgType
    ? schemaStatus[orgType] || 'idle'
    : 'idle';
  const loadingSchema = currentSchemaStatus === 'loading';

  const lastSeedType = useRef<string | null>(null);
  useEffect(() => {
    if (!orgType) return;
    const payload = schemas[orgType];
    if (schemaStatus[orgType] !== 'succeeded' || !payload?.definition) return;
    if (lastSeedType.current === orgType) return;
    lastSeedType.current = orgType;
    const props = payload.definition.properties ?? {};
    const init: Record<string, any> = {};
    Object.entries(props).forEach(([k, v]: [string, any]) => {
      if (v?.default !== undefined) init[k] = v.default;
    });
    if (props.features && init.features == null) init.features = {};
    init.teamSize = teamSize || undefined;
    setDetails((prev) => ({ ...init, ...prev }));
  }, [orgType, schemas, schemaStatus, teamSize]);

  const schemaDef: JsonSchema | undefined = schemaPayload?.definition;
  const featureProps: Record<string, any> =
    schemaDef?.properties?.features?.properties ?? {};

  const requiredKeys = useMemo(() => {
    if (!schemaDef) return [];
    const HIDE = new Set(['schemaVersion', 'teamSize']);
    return (schemaDef.required ?? []).filter((k: string) => !HIDE.has(k));
  }, [schemaDef]);

  const trimmedName =
    typeof details.name === 'string' ? details.name.trim() : '';
  const nameValid = trimmedName.length >= 2;

  const missingRequired = useMemo(() => {
    if (!schemaDef) return [];
    const isValidArray = (v: any) => Array.isArray(v) && v.length > 0;
    const isNumber = (v: any) => typeof v === 'number' && !Number.isNaN(v);
    return requiredKeys.filter((key: any) => {
      const value = key === 'features' ? details.features : details[key];
      if (key === 'features') return value == null;
      if (typeof value === 'boolean') return false;
      if (Array.isArray(value)) return !isValidArray(value);
      if (typeof value === 'number') return !isNumber(value);
      return !(typeof value === 'string' && value.trim().length > 0);
    });
  }, [schemaDef, requiredKeys, details]);

  const fields = useMemo(() => {
    if (!schemaDef) return [];
    const props = schemaDef.properties ?? {};
    const HIDE = new Set(['schemaVersion', 'teamSize', 'features']);
    const baseKeys = Object.keys(props).filter((k) => !HIDE.has(k));
    const groupedKeys =
      (schemaPayload?.groups ?? []).flatMap((g: any) => g.fields) ?? [];
    const ordered = [
      ...groupedKeys.filter((k: string) => baseKeys.includes(k)),
      ...baseKeys.filter((k) => !groupedKeys.includes(k)),
    ];
    return ordered.map((key) => ({
      key,
      schema: props[key] || {},
      required: (schemaDef.required ?? []).includes(key),
    }));
  }, [schemaDef, schemaPayload]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (loadingCreate) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Enter') {
        if ((e as any).isComposing) return;
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag === 'textarea') return;
        if (step < 2) next();
        else submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, loadingCreate, teamSize, orgType, nameValid]);

  const isStep1Valid = Boolean(teamSize) || sizeSkipped;
  const isStep2Valid = Boolean(orgType);

  const next = useCallback(() => {
    if (step === 0) {
      if (!isStep1Valid) {
        toast.error('Select a team size (or continue with Small).');
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!isStep2Valid) {
        toast.error('Select an organisation type.');
        return;
      }
      setStep(2);
      return;
    }
  }, [step, isStep1Valid, isStep2Valid]);

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const goto = useCallback(
    (target: number) => {
      if (target < step) return setStep(target);
      if (target === 1 && isStep1Valid) return setStep(1);
      if (target === 2 && isStep1Valid && isStep2Valid) return setStep(2);
    },
    [step, isStep1Valid, isStep2Valid]
  );

  const onChangeField = (key: string, value: any) =>
    setDetails((prev) => ({ ...prev, [key]: value }));

  const submit = useCallback(() => {
    setAttemptedSubmit(true);
    if (!isStep1Valid) {
      toast.error('Select a team size.');
      setStep(0);
      return;
    }
    if (!isStep2Valid) {
      toast.error('Select an organisation type.');
      setStep(1);
      return;
    }
    if (!nameValid) {
      toast.error('Organisation name must be at least 2 characters.');
      setStep(2);
      return;
    }
    if (missingRequired.length) {
      toast.error('Complete required fields.');
      setStep(2);
      return;
    }
    onSubmit();
  }, [isStep1Valid, isStep2Valid, nameValid, missingRequired]);

  const onSubmit = useCallback(async () => {
    setLoadingCreate(true);
    try {
      const payload = {
        name: trimmedName || 'New Organisation',
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
          prefersReducedMotion ? 0 : 450
        );
      } else {
        throw new Error(action.error.message || 'Create org failed');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Create org failed');
    } finally {
      setLoadingCreate(false);
    }
  }, [dispatch, trimmedName, orgType, teamSize, details, prefersReducedMotion]);

  const featureChips = useMemo(() => {
    // Prefer features from rulebook in Redux store if your state keeps it; fallback empty
    const rb =
      //@ts-ignore
      schemas?.[orgType as string]?.rulebook ??
      (typeof window !== 'undefined' ? (window as any).__RB__ : null);
    return rb?.features?.enabledByDefault ?? [];
  }, [schemas, orgType]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-5 py-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create organisation
            </h1>
            <p className="text-sm text-muted-foreground">
              A short, calm setup. Three steps. You can adjust later.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowPreview((v) => !v)}
              aria-pressed={showPreview}
              title={showPreview ? 'Hide preview' : 'Show preview'}
              className="h-9 w-9"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle preview</span>
            </Button>
          </div>
        </div>
      </header>

      <main
        className={cn(
          'mx-auto grid max-w-6xl gap-8 px-5 py-8',
          showPreview
            ? 'md:grid-cols-[220px_1fr_320px]'
            : 'md:grid-cols-[220px_1fr]'
        )}
      >
        <nav className="hidden md:block">
          <ol className="space-y-2 text-sm">
            <li>
              <button
                type="button"
                onClick={() => goto(0)}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left transition',
                  step === 0 ? 'bg-muted font-medium' : 'hover:bg-muted/60'
                )}
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] align-middle">
                  1
                </span>
                Team size
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => isStep1Valid && goto(1)}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left transition',
                  step === 1 ? 'bg-muted font-medium' : 'hover:bg-muted/60'
                )}
                disabled={!isStep1Valid}
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] align-middle">
                  2
                </span>
                Organisation type
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => isStep1Valid && isStep2Valid && goto(2)}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left transition',
                  step === 2 ? 'bg-muted font-medium' : 'hover:bg-muted/60'
                )}
                disabled={!isStep1Valid || !isStep2Valid}
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] align-middle">
                  3
                </span>
                Details
              </button>
            </li>
          </ol>
        </nav>
        <section className="space-y-6">
          {/* Top action bar */}
          <div className="sticky top-[60px] z-30 -mt-2 mb-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
            <div className="flex items-center justify-between py-3">
              <div className="text-xs text-muted-foreground px-1">
                {step === 0 && 'Choose a size. It tunes defaults.'}
                {step === 1 && 'Pick a type. This sets structure.'}
                {step === 2 && 'Review and create.'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={prev}
                  disabled={step === 0 || loadingCreate}
                >
                  Back
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
                    {loadingCreate && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create organisation
                  </Button>
                )}
              </div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.section
                key="step-0"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.14 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">
                    Who’s joining Knwdle?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Pick a ballpark size. It helps us tune defaults.
                  </p>
                </div>
                <TeamSizePicker
                  value={teamSize}
                  onChange={(v) => {
                    setSizeSkipped(false);
                    setTeamSize(v);
                  }}
                  label="Approximate team size (optional)"
                  options={['1-10', '11-50', '50+', '100+']}
                />
              </motion.section>
            )}
            {step === 1 && (
              <motion.section
                key="step-1"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.14 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">
                    What kind of organisation is this?
                  </h2>
                </div>
                <OrgTypePicker
                  value={orgType}
                  onChange={(val) => setOrgType(val)}
                  templates={ORG_TEMPLATES.map((t) => ({
                    key: t.key as OrgTypeKey,
                    name: t.name,
                    tagline: t.tagline,
                    icon: t.icon,
                  }))}
                  renderExtra={(t) =>
                    orgType === t.key &&
                    structureData &&
                    Object.keys(structureData.hierarchy).length > 0 && (
                      <div className="mt-3 rounded-md bg-muted/30 p-2 text-[11px]">
                        <div className="font-medium text-foreground mb-2 text-[12px]">
                          Structure Overview
                        </div>
                        <div className="space-y-1.5">
                          {Object.entries(structureData.hierarchy).map(
                            ([parent, children]) => (
                              <div
                                key={parent}
                                className="flex flex-wrap items-center gap-1.5"
                              >
                                <span className="rounded bg-primary/10 text-primary px-2 py-0.5 font-medium">
                                  {parent}
                                </span>
                                {children.length > 0 && (
                                  <>
                                    <span className="text-muted-foreground">
                                      →
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1">
                                      {children.map((child) => (
                                        <span
                                          key={child}
                                          className="rounded border border-border bg-background px-1.5 py-0.5"
                                        >
                                          {child}
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  }
                />
              </motion.section>
            )}
            {step === 2 && (
              <motion.section
                key="step-2"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.14 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold">Final details</h2>
                  <p className="text-sm text-muted-foreground">
                    Review fields before creating your organisation.
                  </p>
                </div>
                <div className="space-y-4 rounded-xl border bg-card p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
                      <Label>Team size</Label>
                      <Input
                        value={teamSize || ''}
                        placeholder="(not set)"
                        disabled
                        aria-describedby="team-size-note"
                      />
                      <div className="flex items-center justify-between">
                        <p
                          id="team-size-note"
                          className="text-[11px] text-muted-foreground"
                        >
                          Team size is chosen in <strong>Step 1</strong>.
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          className="h-8 px-0 text-xs"
                          onClick={() => goto(0)}
                        >
                          Change in Step 1
                        </Button>
                      </div>
                    </div>
                  </div>

                  {featureChips.length > 0 && (
                    <div>
                      <div className="text-sm font-medium">
                        Features you’ll get
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {featureChips.map((feat : any) => (
                          <Badge
                            key={feat}
                            className="badge-feature"
                            data-feature={feat}
                          >
                            {feat}
                          </Badge>
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
                      <AlertDescription>
                        Failed to load fields.{' '}
                        <button
                          type="button"
                          className="underline"
                          onClick={() =>
                            orgType &&
                            dispatch(fetchOrgTypeSchema({ type: orgType }))
                          }
                        >
                          Retry
                        </button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <SchemaFields
                      def={schemaDef}
                      details={details}
                      onChange={onChangeField}
                      attemptedSubmit={attemptedSubmit}
                    />
                  )}

                  {attemptedSubmit && missingRequired.length > 0 && (
                    <p className="text-xs text-destructive">
                      {missingRequired.length} required field
                      {missingRequired.length > 1 ? 's' : ''} missing:{' '}
                      {missingRequired.slice(0, 4).join(', ')}
                      {missingRequired.length > 4 ? '…' : ''}
                    </p>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </section>

        {showPreview && (
          <aside className="hidden md:block">
            <div className="rounded-xl border bg-card p-5">
              <div className="text-sm font-medium mb-3">Preview</div>
              <motion.div
                key={`${step}-${teamSize}-${orgType}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14 }}
                className="space-y-4"
              >
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Organisation
                  </div>
                  <div className="text-xl font-semibold">
                    {details.name || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Type: {orgType || '—'} • Team size: {teamSize || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    Key Fields
                  </div>
                  <ul className="space-y-1 text-sm">
                    {fields.slice(0, 6).map(({ key }) => (
                      <li key={key} className="flex justify-between gap-3">
                        <span className="capitalize text-muted-foreground">
                          {key}
                        </span>
                        <span className="truncate text-right">
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
                </div>
                {featureChips.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                      Features
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-sm">
                      {featureChips.map((feat : any) => (
                        <Badge
                          key={feat}
                          className="badge-feature"
                          data-feature={feat}
                        >
                          {feat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {success && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    <PartyPopper className="h-3.5 w-3.5" />
                    Created! Redirecting…
                  </div>
                )}
              </motion.div>
            </div>
          </aside>
        )}
      </main>

      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-6xl px-5 py-4 text-xs text-muted-foreground">
          {step === 0 && 'Choose a size. It tunes defaults.'}
          {step === 1 && 'Pick a type. This sets structure.'}
          {step === 2 && 'Review and create.'}
        </div>
      </footer>
    </div>
  );
}
