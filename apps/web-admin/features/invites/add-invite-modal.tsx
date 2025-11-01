'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useAddInviteModal } from './use-invite-atom';
import { AppDispatch, RootState } from '@/store/store';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ParentRole,
  createInvite,
  resetCreateInviteStatus,
  fetchOrgUnits,
  selectOrgUnits,
  selectOrgUnitsStatus,
} from '@workspace/state';
import { toast } from 'sonner';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';

const ROLES: ParentRole[] = ['admin', 'staff', 'student', 'parent'];
type Mode = 'base' | 'custom';

export default function AddInviteModal() {
  const [open, setOpen] = useAddInviteModal();
  const dispatch = useDispatch<AppDispatch>();
  const { id: orgId } = useParams<{ id: string }>();

  const createStatus = useSelector((s: RootState) => s.invites.createStatus);
  const createError = useSelector((s: RootState) => s.invites.createError);

  const rolesEntry = useSelector((s: RootState) =>
    orgId ? s.roles.rolesByOrg[orgId] : undefined
  );
  const customRoles = useMemo(() => rolesEntry?.items ?? [], [rolesEntry]);

  // NEW: Units data
  const units = useSelector(selectOrgUnits);
  const unitsStatus = useSelector(selectOrgUnitsStatus);

  const [mode, setMode] = useState<Mode>('base');
  const [form, setForm] = useState<{
    email: string;
    role: ParentRole;
    roleId?: string;
    unitId?: string;
  }>({ email: '', role: 'staff', roleId: undefined, unitId: '' });

  // Fetch units when modal opens
  useEffect(() => {
    if (open && orgId) dispatch(fetchOrgUnits(orgId));
  }, [open, orgId, dispatch]);

  // Handle create invite status
  const prevStatus = useRef(createStatus);
  useEffect(() => {
    if (
      prevStatus.current === 'loading' &&
      createStatus === 'succeeded' &&
      open
    ) {
      toast.success('Invite created');
      setOpen(false);
      setForm({ email: '', role: 'staff', roleId: undefined, unitId: '' });
      dispatch(resetCreateInviteStatus());
    }
    prevStatus.current = createStatus;
  }, [createStatus, open, dispatch, setOpen]);

  useEffect(() => {
    if (open) {
      dispatch(resetCreateInviteStatus());
      setForm({ email: '', role: 'staff', roleId: undefined, unitId: '' });
      setMode('base');
    }
  }, [open, dispatch]);

  const disabled =
    createStatus === 'loading' ||
    !form.email.trim() ||
    !orgId ||
    (mode === 'custom' && !form.roleId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return toast.error('Invalid organisation');

    const payload =
      mode === 'custom'
        ? {
            orgId,
            email: form.email.trim().toLowerCase(),
            roleId: form.roleId!,
            unitId: form.unitId?.trim() ? form.unitId.trim() : undefined,
          }
        : {
            orgId,
            email: form.email.trim().toLowerCase(),
            role: form.role,
            unitId: form.unitId?.trim() ? form.unitId.trim() : undefined,
          };

    dispatch(createInvite(payload as any));
  }

  if (!open) return null;

  return (
    <Modal open={open} onOpenChange={(n) => !n && setOpen(false)}>
      <ModalContent size="lg" blur separators stickyFooter>
        <ModalHeader>
          <ModalTitle>Invite member</ModalTitle>
          <ModalDescription>
            Send an invitation to join this organisation.
          </ModalDescription>
          {createError && (
            <p className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 mb-3">
              {createError}
            </p>
          )}
        </ModalHeader>

        <ModalBody>
          <form id="add-invite-form" onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="user@company.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>

              {/* Role toggle */}
              <div className="md:col-span-2">
                <Label>Assign using</Label>
                <div className="mt-2 inline-flex rounded-md border p-1 bg-background gap-2">
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      mode === 'base'
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }`}
                    onClick={() => setMode('base')}
                  >
                    Base Role
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      mode === 'custom'
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }`}
                    onClick={() => setMode('custom')}
                  >
                    Custom Role
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a built-in role or a custom role from Roles.
                </p>
              </div>

              {/* Base roles */}
              {mode === 'base' && (
                <div>
                  <Label className="mb-2">Base role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, role: v as ParentRole }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a base role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom roles */}
              {mode === 'custom' && (
                <div>
                  <Label className="mb-2">Custom role</Label>
                  <Select
                    value={form.roleId ?? ''}
                    onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a custom role" />
                    </SelectTrigger>
                    <SelectContent>
                      {customRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{r.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({r.key})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Unit dropdown (NEW) */}
              <div className="md:col-span-2">
                <Label className="mb-2">Assign to Unit (optional)</Label>
                <Select
                  value={form.unitId ?? ''}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, unitId: v || undefined }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsStatus === 'loading' && (
                      <SelectItem value="none" disabled>
                        <Loader2 className="size-3 mr-2 animate-spin" /> Loading…
                      </SelectItem>
                    )}
                    {units.length === 0 && (
                      <SelectItem value="none" disabled>
                        No units found
                      </SelectItem>
                    )}
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} <span className="text-xs">({u.type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-invite-form" disabled={disabled}>
            {createStatus === 'loading' ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              'Send Invite'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}