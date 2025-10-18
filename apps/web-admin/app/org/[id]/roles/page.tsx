'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import {
  listRoles,
  listPermissions,
  type ParentRole,
  deleteRole,
} from '@workspace/state';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import DataTable, { Column } from '@workspace/ui/components/data-table';
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateRoleModal,
  useEditRoleModal,
} from '@/features/roles/use-role-atom';
import { useConfirmDialog } from '@/features/confirm/use-confirm-dialog';

export type RoleRow = {
  id: string;
  orgId: string;
  key: string;
  name: string;
  scope: string;
  parentRole?: 'admin' | 'staff' | 'student' | 'parent';
  createdAt?: string;
  permissions: {
    id: string;
    permission: { id: string; code: string; name: string };
  }[];
};

export default function RolesPage() {
  const { id: orgId = '' } = useParams<{ id: string }>() ?? {};
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [addOpen, setAddOpen] = useCreateRoleModal();
  const [editOpen, setEditOpen] = useEditRoleModal();
  const { confirm } = useConfirmDialog();

  const user = useSelector((s: RootState) => s.auth.user);
  const membership = user?.memberships?.find((m: any) => m.org?.id === orgId);
  const myRole = membership?.role as ParentRole | undefined;
  const isAllowed = myRole === 'admin' || myRole === 'staff';

  useEffect(() => {
    if (!orgId) return;
    if (!isAllowed) {
      toast.error('You do not have access to Roles.');
      router.replace(`/org/${orgId}/dashboard`);
      return;
    }
    dispatch(listRoles({ orgId }));
    dispatch(listPermissions({ orgId }));
  }, [dispatch, orgId, isAllowed, router]);

  const entry = useSelector((s: RootState) => s.roles.rolesByOrg[orgId]);
  const roles = (entry?.items ?? []) as RoleRow[];
  const loading = entry?.status === 'loading';

  const handleEdit = (r: RoleRow) => setEditOpen({ open: true, role: r });

  const handleDelete = (role: RoleRow) =>
    confirm({
      title: 'Delete Role?',
      description: (
        <>
          Are you sure you want to delete <b>{role?.name ?? ''}</b>? <br />
          This action cannot be undone.
        </>
      ),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await dispatch(deleteRole({ orgId, roleId: role.id }));
        toast.success('Role deleted successfully');
      },
    });

  // Table Columns
  const columns: Column<RoleRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Role Name',
        sortable: true,
        render: (r) => <span className="font-medium">{r.name}</span>,
      },
      {
        key: 'key',
        header: 'Key',
        sortable: true,
        render: (r) => <span className="font-mono text-xs">{r.key}</span>,
      },
      {
        key: 'scope',
        header: 'Scope',
        sortable: true,
        render: (r) => <span className="text-xs">{r.scope || 'org'}</span>,
      },
      {
        key: 'parentRole',
        header: 'Parent Role',
        sortable: true,
        render: (r) => (
          <Badge variant="secondary" className="capitalize">
            {r.parentRole ?? 'staff'}
          </Badge>
        ),
      },
      {
        key: 'permissions',
        header: 'Permissions',
        sortable: true,
        render: (r) => (
          <span className="text-xs text-muted-foreground">
            {r.permissions?.length ?? 0}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        align: 'right',
        sortable: true,
        render: (r) => (
          <span className="text-xs text-muted-foreground">
            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
          </span>
        ),
      },
    ],
    []
  );

  // Simple refresh handler
  const refresh = () => dispatch(listRoles({ orgId }));

  return (
    <div className="container mx-auto space-y-6">
      {/* Page Header (matches Invites page) */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Manage base and custom roles within this organisation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-md" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button className="rounded-md" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Role
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <DataTable<RoleRow>
        title=""
        columns={columns}
        rows={roles}
        rowKey={(r) => r.id}
        loading={loading}
        serverSearchMode="manual"
        toolbarActions={null}
        rightActionsFor={(r) => (
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md hover:bg-muted"
              onClick={() => handleEdit(r)}
              aria-label="Edit role"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(r)}
              aria-label="Delete role"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        ui={{
          hideSearch: false,
          zebra: true,
          stickyHeader: true,
          rounded: 'xl',
          headerUppercase: true,
          compactHeader: true,
          border: true,
          showSearchButton: true,
          searchPlaceholder: 'Search roles by name or key...',
        }}
      />
    </div>
  );
}
