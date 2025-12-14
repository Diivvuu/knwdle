'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import type { AppDispatch, RootState } from '@/store/store';

import {
  listRoles,
  updateOrgMember,
  fetchOrgMember,
  selectOrgMember,
} from '@workspace/state';

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Separator } from '@workspace/ui/components/separator';
import { Loader2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { useEditMemberModal } from './use-members.atom';

/* ----------------------------- Constants ---------------------------------- */

const BUILTIN_ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Staff', value: 'staff' },
  { label: 'Student', value: 'student' },
  { label: 'Parent', value: 'parent' },
] as const;
type BuiltinRoleValue = (typeof BUILTIN_ROLES)[number]['value'];

/* ----------------------------- Component ---------------------------------- */

const EditMemberModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: orgId = '' } = useParams<{ id: string }>() ?? {};

  // { open, memberId }
  const [editState, setEditState] = useEditMemberModal();
  const open = editState.open;
  const memberId = editState.memberId ?? '';

  // The selected (single) member from the store
  const member = useSelector(selectOrgMember);

  // Custom roles
  const rolesState = useSelector((s: RootState) => s.roles.rolesByOrg[orgId]);
  const roles = rolesState?.items || [];

  // Local form
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [audienceId, setaudienceId] = useState<string>('');
  const [roleValue, setRoleValue] = useState<string>(''); // builtin key or custom roleId

  /* ------------------------- Fetching & Hydration ------------------------- */

  // Ensure roles are available on open
  useEffect(() => {
    if (!open || !orgId) return;
    if (!rolesState || rolesState.status === 'idle') {
      dispatch(listRoles({ orgId }));
    }
  }, [open, orgId, rolesState, dispatch]);

  // Ensure the member is fetched when we open (if memberId known)
  useEffect(() => {
    if (!open || !orgId || !memberId) return;
    // If current store member is a different id or null, fetch
    if (!member || member.id !== memberId) {
      dispatch(fetchOrgMember({ orgId, memberId })).catch(() => {
        toast.error('Failed to load member');
      });
    }
  }, [open, orgId, memberId, member, dispatch]);

  // Seed form once member is present & modal open
  useEffect(() => {
    if (!open || !member) return;
    setName(member.name || '');
    setaudienceId(member.audienceId || '');
    setRoleValue(member.roleId ?? member.role ?? '');
  }, [open, member]);

  const builtinValues = useMemo<BuiltinRoleValue[]>(
    () => ['admin', 'staff', 'student', 'parent'],
    []
  );
  const isBuiltin = useCallback(
    (val: string) => builtinValues.includes(val as BuiltinRoleValue),
    [builtinValues]
  );

  /* ------------------------------ Handlers -------------------------------- */

  const close = useCallback(() => {
    setEditState({ open: false, memberId: null });
  }, [setEditState]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) close();
    },
    [close]
  );

  const missingMember =
    open && (!member || (memberId && member.id !== memberId));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !member?.id) {
      toast.error('Missing organisation or member context');
      return;
    }
    if (!roleValue) {
      toast.error('Please choose a role');
      return;
    }

    const body: Record<string, any> = {
      ...(name.trim() &&
        name.trim() !== (member.name ?? '') && { name: name.trim() }),
      ...(audienceId ? { audienceId } : { audienceId: null }), // explicit clear
    };

    if (isBuiltin(roleValue)) {
      body.role = roleValue; // builtin
      body.roleId = null;
    } else {
      body.roleId = roleValue; // custom
      // omit role
    }

    try {
      setSaving(true);
      await dispatch(
        updateOrgMember({
          orgId,
          memberId: member.id,
          body,
        })
      ).unwrap();
      toast.success('Member updated');
      close();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------ UI Blocks ------------------------------- */

  function RoleAwareProfilePreview() {
    if (!member) return null;

    const effectiveRole: string = member.roleId
      ? member.customRoleName || 'Custom role'
      : member.role;

    return (
      <div className="rounded-md border p-3 bg-muted/40">
        <div className="text-xs text-muted-foreground mb-1">
          Profile preview
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="font-medium">Effective role</div>
            <div className="opacity-80">
              {effectiveRole}
              {member.roleId ? ' (custom)' : ''}
            </div>
          </div>
          <div>
            <div className="font-medium">Audience</div>
            <div className="opacity-80">{member.audienceName || '—'}</div>
          </div>
          <div>
            <div className="font-medium">Joined</div>
            <div className="opacity-80">
              {member.createdAt
                ? new Date(member.createdAt).toLocaleString()
                : '—'}
            </div>
          </div>
        </div>

        {/* Future: render role-specific panels here (read-only until APIs exist)
           - Student: rollNo, guardians
           - Parent: linked students
           - Staff: subjects/department
           You can mount extra data into selectOrgMember response and render it here. */}
      </div>
    );
  }

  /* -------------------------------- Render -------------------------------- */

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        size="lg"
        scroll="body"
        blur
        separators
        stickyFooter
        gradientHeader
      >
        <ModalHeader>
          <ModalTitle>Edit member</ModalTitle>
          <ModalDescription>
            Update core details, role and audience. Role-specific profiles will
            appear here as we wire their APIs.
          </ModalDescription>
        </ModalHeader>

        <Separator />

        <ModalBody>
          {missingMember ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading member…
            </div>
          ) : (
            <>
              <RoleAwareProfilePreview />

              <form
                id="edit-member-form"
                onSubmit={handleSubmit}
                className="mt-4 space-y-4"
              >
                {/* Email (readonly) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <Input value={member?.email ?? ''} readOnly />
                  </div>

                  {/* Name */}
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <Input
                      placeholder="Member name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Role + Audience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <Select
                      value={roleValue || ''}
                      onValueChange={(val) => setRoleValue(val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Built-in */}
                        {BUILTIN_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}

                        {/* Divider & custom */}
                        {roles.length > 0 && <div className="my-1 border-t" />}

                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Built-in roles send <code>role</code>. Custom roles send{' '}
                      <code>roleId</code>.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Audience ID (optional)
                    </Label>
                    <Input
                      placeholder="e.g. class_8A"
                      value={audienceId}
                      onChange={(e) => setaudienceId(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Leave blank to clear the member’s audience.
                    </p>
                  </div>
                </div>
              </form>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-member-form"
            // disabled={saving || missingMember}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditMemberModal;
