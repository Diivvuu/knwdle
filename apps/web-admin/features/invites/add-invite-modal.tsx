'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useAddInviteModal } from './use-invite-atom';
import { AppDispatch, RootState } from '@/store/store';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ParentRole, createInvite } from '@workspace/state';
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
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';

const ROLES: ParentRole[] = ['admin', 'staff', 'student', 'parent'];

type Mode = 'base' | 'custom';

export default function AddInviteModal() {
  const [open, setOpen] = useAddInviteModal();
  const dispatch = useDispatch<AppDispatch>();
  const { id: orgId } = useParams<{ id: string }>();

  const createStatus = useSelector(
    (state: RootState) => state.invites.createStatus
  );

  const rolesEntry = useSelector((state: RootState) =>
    orgId ? state.roles.rolesByOrg[orgId] : undefined
  );

  const customRoles = useMemo(() => rolesEntry?.items ?? [], [rolesEntry]);

  const [mode, setMode] = useState<Mode>('base');
  const [form, setForm] = useState<{
    email: string;
    role: ParentRole;
    roleId?: string;
    unitId?: string;
    meta?: string;
  }>({
    email: '',
    role: 'staff',
    roleId: undefined,
    unitId: '',
    meta: '',
  });

  useEffect(() => {
    if (createStatus === 'succeeded') {
      toast.success('Invite created');
      setOpen(false);
      setForm({
        email: '',
        role: 'staff',
        roleId: undefined,
        unitId: '',
        meta: '',
      });
    }
  }, [createStatus, setOpen]);

  const disabled =
    createStatus === 'loading' ||
    !form.email.trim() ||
    !orgId ||
    (mode === 'custom' && !form.roleId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return toast.error('Invalid organistion');

    let metaJson: Record<string, any> | undefined = undefined;
    if (form.meta?.trim()) {
      try {
        metaJson = JSON.parse(form.meta);
      } catch (error) {
        return toast.error('Meta must be valid JSON');
      }
    }

    const payload =
      mode === 'custom'
        ? {
            orgId,
            email: form.email.trim().toLowerCase(),
            roleId: form.roleId!,
            unitId: form.unitId?.trim() ? form.unitId.trim() : undefined,
            meta: metaJson,
          }
        : {
            orgId,
            email: form.email.trim().toLowerCase(),
            role: form.role,
            unitId: form.unitId?.trim() ? form.unitId.trim() : undefined,
            meta: metaJson,
          };

    dispatch(createInvite(payload as any));
  };

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setOpen(false);
    },
    [setOpen]
  );

  if (!open) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="xl" blur separators stickyFooter gradientHeader>
        <ModalHeader>
          <ModalTitle>Invite member</ModalTitle>
          <ModalDescription>
            Send an invitation to join this organisation
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          <form id="add-invite-form" onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
              {/* mode switch */}
              <div className="md:col-span-2">
                <Label>Assign using</Label>
                <div className="mt-2 inline-flex rounded-md border p-1 bg-background gap-2">
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-sm rounded-md ${mode === 'base' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setMode('base')}
                  >
                    Base Role
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-sm rounded-md ${mode === 'custom' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setMode('custom')}
                  >
                    Custom Role
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a built-in role (admin/staff/student/parent) or select
                  a custom role created in Roles Section.
                </p>
              </div>
              {mode === 'base' && (
                <div className="md:col-span-1">
                  <Label className="mb-1">Base role</Label>
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
              {mode === 'custom' && (
                <div className="md:col-span-1">
                  <Label className="mb-1">Custom role</Label>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Custom roles inherit a parent role and permissions defined
                    in the Roles Section.
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <Label className="mb-1">Unit (optional)</Label>
                <Input
                  placeholder="unit-id (e.g., class/department id)"
                  value={form.unitId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitId: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to invite at organisation scope.
                </p>
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1">Meta (optional JSON)</Label>
                <Textarea
                  rows={3}
                  className="w-full"
                  placeholder='{"note":"VIP"}'
                  value={form.meta}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, meta: e.target.value }))
                  }
                />
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant={'outline'} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-invite-form" disabled={disabled}>
            {createStatus === 'loading' ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
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
