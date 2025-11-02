'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { useParams } from 'next/navigation';

// state (slices)
import { fetchOrgUnits, createOrgUnit, fetchOrgTree } from '@workspace/state'; // orgUnits thunks
import {
  fetchOrgUnitSchema,
  fetchOrgUnitFeatures,
  fetchAllowedChildTypes,
  selectAllowedChildTypes,
  selectAllowedStatus,
} from '@workspace/state'; // orgUnitTypes thunks + selectors
import type { OrgUnitType } from '@workspace/state';

// ui
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
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
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { Loader2, Check, Minus } from 'lucide-react';

// dynamic schema renderer
import SchemaFields from '@workspace/ui/components/app/schema-fields';

// modal atom
import { useCreateUnitModal } from './use-org-unit-atom';

/* ----------------------------- Local types ----------------------------- */

type JSONSchema = {
  type: 'object';
  title?: string;
  properties?: Record<string, any>;
};

type FeatureKey =
  | 'attendance'
  | 'assignments'
  | 'tests'
  | 'notes'
  | 'fees'
  | 'announcements'
  | 'content'
  | 'liveClass'
  | 'interactions';

type FeatureFlags = Record<FeatureKey, boolean>;

/* ------------------------------- Component ------------------------------- */

export default function CreateOrgUnitModal() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const orgId = (params as any)?.id as string;

  // ---- global state reads
  const units = useSelector((s: RootState) => s.orgUnit.list); // ✅ correct slice key

  // parent candidates: all units in this org
  const orgUnitsForOrg = useMemo(
    () => (units || []).filter((u) => u.orgId === orgId),
    [units, orgId]
  );

  // --- local form state
  const [open, setOpen] = useCreateUnitModal();
  const [name, setName] = useState('');
  const [type, setType] = useState<OrgUnitType | ''>('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // derived: parent type (for allowed children API + label)
  const parentType: OrgUnitType =
    (orgUnitsForOrg.find((u) => u.id === parentId)?.type as OrgUnitType) ||
    ('ORGANISATION' as OrgUnitType);

  // --- allowed child types state (curried selector usage)
  const allowedStatus = useSelector(selectAllowedStatus);
  const allowedTypes = useSelector(selectAllowedChildTypes(parentType));

  // schema/features state
  const schemaStatus = useSelector(
    (s: RootState) => s.orgUnitTypes.schemaStatus
  );
  const featuresByType = useSelector(
    (s: RootState) => s.orgUnitTypes.featuresByType
  ) as Partial<Record<OrgUnitType, FeatureFlags>>;
  const loadingSchema = schemaStatus === 'loading';
  const loadingTypes = allowedStatus === 'loading';

  const schemaForType = useSelector((s: RootState) =>
    type ? s.orgUnitTypes.schemaByType?.[type] : undefined
  );
  const def: JSONSchema | undefined = useSelector((s: RootState) =>
    type ? s.orgUnitTypes.schemaByType?.[type]?.definition : undefined
  ) as any;

  const groups = schemaForType?.groups;

  // feature preview for selected type
  const featurePreview: FeatureFlags | null = type
    ? (featuresByType[type] as FeatureFlags) || null
    : null;

  /* ------------------------------ Bootstrap ------------------------------ */
  useEffect(() => {
    if (!open || !orgId) return;

    dispatch(fetchOrgUnits(orgId));
    // initial allowed types for root-level (parentType = null)
    dispatch(fetchAllowedChildTypes({ orgId, parentType: null }));
  }, [open, orgId, dispatch]);

  // fetch allowed child types whenever parent selection changes
  useEffect(() => {
    if (!open || !orgId) return;
    // reset invalid type choice on parent change
    setType('');
    dispatch(fetchAllowedChildTypes({ orgId, parentType }));
  }, [open, orgId, parentType, dispatch]);

  // fetch schema + features when type changes
  useEffect(() => {
    if (!open || !type) return;
    dispatch(fetchOrgUnitSchema({ orgId, unitType: type }));
    dispatch(fetchOrgUnitFeatures({ orgId, unitType: type }));
  }, [open, type, orgId, dispatch]);

  // reset on close
  useEffect(() => {
    if (open) return;
    setName('');
    setType('');
    setParentId(null);
    setMeta({});
    setSubmitting(false);
  }, [open]);

  /* ------------------------------ Submission ----------------------------- */
  const canSubmit = !submitting && name.trim().length >= 2 && Boolean(type);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !type || !name.trim()) return;

    try {
      setSubmitting(true);
      const res = await dispatch(
        createOrgUnit({
          orgId,
          body: {
            name: name.trim(),
            type,
            parentId: parentId ?? null,
            meta: Object.keys(meta || {}).length ? meta : undefined,
          },
        })
      );
      setSubmitting(false);
      if ((res as any).error) return;

      // refresh lists/tree for page
      dispatch(fetchOrgUnits(orgId));
      dispatch(fetchOrgTree(orgId));

      setOpen(false);
    } catch {
      setSubmitting(false);
    }
  }

  /* ------------------------------- UI bits -------------------------------- */

  const FeatureBadge = ({ on, label }: { on: boolean; label: string }) => (
    <Badge
      variant={on ? 'default' : 'secondary'}
      className={on ? 'bg-emerald-600 text-white' : 'bg-muted'}
    >
      {on ? (
        <Check className="mr-1 h-3.5 w-3.5" />
      ) : (
        <Minus className="mr-1 h-3.5 w-3.5" />
      )}
      {label}
    </Badge>
  );

  /* --------------------------------- UI --------------------------------- */
  return (
    <Modal open={open} onOpenChange={() => setOpen(false)}>
      <ModalContent size="3xl">
        <ModalHeader>
          <ModalTitle>Create organisation unit</ModalTitle>
        </ModalHeader>
        <ModalBody className='min-h-full'>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={onSubmit}
          >
            {/* Name */}
            <div className="space-y-2">
              <Label>
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grade 10, Science Dept, Physics"
              />
            </div>

            {/* Parent */}
            <div className="space-y-2">
              <Label>Parent (optional)</Label>
              <Select
                value={parentId ?? 'none'}
                onValueChange={(v) => setParentId(v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {orgUnitsForOrg.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{u.name}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground">
                          • {u.type}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={type || ''}
                onValueChange={(v) => setType(v as OrgUnitType)}
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
                  {(allowedTypes || []).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {parentId
                  ? `Allowed under ${parentType}`
                  : 'Creating at organisation root'}
              </p>
            </div>

            {/* Feature preview */}
            <div className="space-y-2">
              <Label>Features this unit will have</Label>
              {type ? (
                featurePreview ? (
                  <div className="flex flex-wrap gap-1.5">
                    <FeatureBadge
                      on={!!featurePreview.attendance}
                      label="Attendance"
                    />
                    <FeatureBadge
                      on={!!featurePreview.assignments}
                      label="Assignments"
                    />
                    <FeatureBadge on={!!featurePreview.tests} label="Tests" />
                    <FeatureBadge on={!!featurePreview.notes} label="Notes" />
                    <FeatureBadge on={!!featurePreview.fees} label="Fees" />
                    <FeatureBadge
                      on={!!featurePreview.announcements}
                      label="Announcements"
                    />
                    <FeatureBadge
                      on={!!featurePreview.content}
                      label="Content"
                    />
                    <FeatureBadge
                      on={!!featurePreview.liveClass}
                      label="Live class"
                    />
                    <FeatureBadge
                      on={!!featurePreview.interactions}
                      label="Interactions"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading
                    features…
                  </div>
                )
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select a type to preview enabled features.
                </p>
              )}
            </div>

            {/* Divider across columns */}
            <div className="md:col-span-2">
              <Separator className="my-1" />
            </div>

            {/* Dynamic meta fields */}
            <div className="md:col-span-2">
              {loadingSchema && type ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading schema…
                </div>
              ) : type && def ? (
                <SchemaFields
                  def={def as any}
                  groups={groups}
                  details={meta}
                  onChange={(k, v) => setMeta((prev) => ({ ...prev, [k]: v }))}
                />
              ) : (
                <div className="text-xs text-muted-foreground">
                  Select a type to configure additional settings.
                </div>
              )}
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating…
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
