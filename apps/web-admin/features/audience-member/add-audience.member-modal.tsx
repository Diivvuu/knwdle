'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import type { AppDispatch, RootState } from '@/store/store';
import {
  addAudienceMember,
  fetchAudienceMembers,
  fetchAvailableAudienceMembers,
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
import { Label } from '@workspace/ui/components/label';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

import DataTableClean, { Column } from '@workspace/ui/components/data-table';
import { useAddAudienceMemberModal } from './use-audience.member';

/* -------------------------------- Types -------------------------------- */

type AssignRole = 'student' | 'staff' | 'parent' | 'admin';

/* ----------------------------- Component -------------------------------- */

const AddAudienceMemberModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: orgId = '', audienceId = '' } =
    useParams<{ id: string; audienceId: string }>() ?? {};

  const [open, setOpen] = useAddAudienceMemberModal();

  const availableMembers = useSelector(
    (s: RootState) => s.audienceMembers.available
  );
  const availableLoading =
    useSelector((s: RootState) => s.audienceMembers.availableStatus) ===
    'loading';

  const audienceMembers = useSelector((s: RootState) => s.audienceMembers.list);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<AssignRole>('student');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  /* ------------------------- Derived state ------------------------- */

  

  /* ----------------------------- Effects ----------------------------- */

  useEffect(() => {
    if (!open || !orgId) return;
    dispatch(
      fetchAvailableAudienceMembers({
        orgId,
        audienceId,
      })
    );
  }, [open, orgId, audienceId, dispatch]);

  /* ----------------------------- Helpers ----------------------------- */

  const toggle = useCallback((userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSelected(new Set());
    setRole('student');
    setSearch('');
  }, [setOpen]);

  /* ----------------------------- Submit ------------------------------ */

  async function handleSubmit() {
    if (!orgId || !audienceId) {
      toast.error('Missing context');
      return;
    }

    if (selected.size === 0) {
      toast.error('Select at least one member');
      return;
    }

    try {
      setSaving(true);

      await Promise.all(
        Array.from(selected).map((userId) =>
          dispatch(
            addAudienceMember({
              orgId,
              audienceId,
              body: {
                userId,
                role,
                // roleId: null,
              },
            })
          ).unwrap()
        )
      );

      toast.success(`${selected.size} member(s) added`);
      dispatch(fetchAudienceMembers({ orgId, audienceId }));
      close();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add members');
    } finally {
      setSaving(false);
    }
  }

  /* ----------------------------- Table ------------------------------ */

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return availableMembers;
    const q = search.trim().toLowerCase();
    return availableMembers.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        (m.name ?? '').toLowerCase().includes(q)
    );
  }, [availableMembers, search]);

  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: 'select',
        header: '',
        render: (r) => (
          <Checkbox
            checked={selected.has(r.userId)}
            onCheckedChange={() => toggle(r.userId)}
          />
        ),
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (r) => <span className="font-medium">{r.email}</span>,
      },
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (r) => r.name || '—',
      },
      {
        key: 'role',
        header: 'Org Role',
        sortable: true,
        render: (r) => r.role,
      },
    ],
    [selected, toggle]
  );

  /* ------------------------------ Render ------------------------------ */

  return (
    <Modal open={open} onOpenChange={(v) => !v && close()}>
      <ModalContent size="xl" blur separators stickyFooter>
        <ModalHeader>
          <ModalTitle>Add members to audience</ModalTitle>
          <ModalDescription>
            Select one or more organisation members and assign them to this
            audience.
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          {availableLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading members…
            </div>
          ) : (
            <>
              {/* Role selector */}
              <div className="mb-4 max-w-xs">
                <Label className="text-sm font-medium">Assign role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as AssignRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Role will apply to all selected members.
                </p>
              </div>

              {/* Members table */}
              <DataTableClean
                title=""
                rows={filteredMembers}
                rowKey={(r) => r.userId}
                columns={columns}
                serverSearchMode="manual"
                initialQuery={search}
                handlers={{
                  onQueryChange: ({ query }) => setSearch(query),
                }}
                ui={{
                  hideSearch: false,
                  zebra: true,
                  stickyHeader: true,
                  rounded: 'xl',
                  compactHeader: true,
                  border: true,
                  searchPlaceholder: 'Search members…',
                }}
              />
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || selected.size === 0}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding…
              </>
            ) : (
              `Add ${selected.size} member(s)`
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddAudienceMemberModal;
