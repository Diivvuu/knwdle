'use client';
import * as React from 'react';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import {
  listRoles,
  listPermissions,
  type ParentRole,
  deleteRole,
} from '@workspace/state';

import PageHeader from '@workspace/ui/components/page-header';
import PageBody from '@workspace/ui/components/page-body';
import DataTable, { type Column } from '@workspace/ui/components/data-table'; // ✅ correct import
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAtom } from 'jotai';
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

  const handleEdit = (r: RoleRow) => {
    setEditOpen({ open: true, role: r });
  };
  const handleDelete = (role: RoleRow) => {
    confirm({
      title: 'Delete Role?',
      description: (
        <>
          Are you sure you want to delete the role <b>{role?.name ?? ''}</b>{' '}
          <br />
          This action cannot be undone
        </>
      ),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await dispatch(deleteRole({ orgId, roleId: role.id }));
        toast.success('Role deleted successfully');
      },
    });
  };

  // Columns for DataTable
  const columns: Column<RoleRow>[] = [
    {
      key: 'name',
      header: 'Role',
      sortable: true,
      sortAccessor: (r) => r.name,
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: 'key',
      header: 'Key',
      sortable: true,
      sortAccessor: (r) => r.key,
      render: (r) => <span className="font-mono text-xs">{r.key}</span>,
    },
    {
      key: 'scope',
      header: 'Scope',
      sortable: true,
      sortAccessor: (r) => r.scope,
      render: (r) => <span className="text-xs">{r.scope || 'org'}</span>,
    },
    {
      key: 'parentRole',
      header: 'Parent',
      sortable: true,
      sortAccessor: (r) => r.parentRole ?? 'staff',
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
      sortAccessor: (r) => r.permissions?.length ?? 0,
      render: (r) => (
        <span className="text-xs">{r.permissions?.length ?? 0}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      align: 'right',
      sortable: true,
      sortAccessor: (r) => (r.createdAt ? Date.parse(r.createdAt) : 0),
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Roles"
        subtitle="Custom roles for this organisation."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => dispatch(listRoles({ orgId }))}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button
              onClick={() => {
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Role
            </Button>
          </>
        }
      />

      <PageBody>
        <DataTable<RoleRow>
          title="Roles"
          columns={columns}
          rows={roles}
          rowKey={(r) => r.id}
          loading={loading}
          onRefresh={() => dispatch(listRoles({ orgId }))}
          // client-side search/sort/paginate by default; switch to server mode by passing handlers.onQueryChange
          rightActionsFor={(r) => (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEdit(r)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(r)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          // Optional filters example:
          // filters={[
          //   { type: 'text', key: 'q', label: 'Keyword' },
          //   { type: 'select', key: 'scope', label: 'Scope', options: [
          //     { label: 'Org', value: 'org' }, { label: 'Unit', value: 'unit' }
          //   ]},
          // ]}
        />
      </PageBody>
    </div>
  );
}
