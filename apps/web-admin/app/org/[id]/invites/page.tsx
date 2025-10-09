'use client';

import { useConfirmDialog } from '@/features/confirm/use-confirm-dialog';
import { useAddInviteModal } from '@/features/invites/use-invite-atom';
import { AppDispatch, RootState } from '@/store/store';
import {
  deleteInvite,
  listInvites,
  listRoles,
  ParentRole,
} from '@workspace/state';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import DataTable, { Column } from '@workspace/ui/components/data-table';
import PageBody from '@workspace/ui/components/page-body';
import PageHeader from '@workspace/ui/components/page-header';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

type InviteRow = {
  id: string;
  orgId: string;
  email: string;
  role: ParentRole;
  unitId: string | null;
  joinCode: string | null;
  expiresAt: string;
  acceptedBy: string | null;
  createdAt: string;
};

const InvitesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: orgId = '' } = useParams<{ id: string }>() ?? {};

  const [open, setOpen] = useAddInviteModal();
  // const [editOpen, setEditOpen]  = useEditInviteModal()
  const { confirm } = useConfirmDialog();

  const entry = useSelector((state: RootState) => state.invites.byOrg[orgId]);
  const invites = (entry?.items ?? []) as InviteRow[];
  const loading = entry?.status === 'loading';

  useEffect(() => {
    if (!orgId) return;
    dispatch(listInvites({ orgId }));
    dispatch(listRoles({ orgId }));
  }, [dispatch, orgId]);

  const columns: Column<InviteRow>[] = useMemo(
    () => [
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        sortAccessor: (r) => r.email,
        render: (r) => <span className="font-medium">{r.email}</span>,
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        sortAccessor: (r) => r.role,
        render: (r) => (
          <Badge variant={'secondary'} className="capitalize">
            {r.role}
          </Badge>
        ),
      },
      {
        key: 'unit',
        header: 'Unit',
        sortable: true,
        sortAccessor: (r) => r.unitId ?? '',
        render: (r) => <span className="text-xs">{r.unitId ?? '-'}</span>,
      },
      {
        key: 'expiresAt',
        header: 'Expires',
        sortable: true,
        sortAccessor: (r) => (r.expiresAt ? Date.parse(r.expiresAt) : 0),
        render: (r) => (
          <span className="text-xs text-muted-foreground">
            {r.expiresAt ? new Date(r.expiresAt).toLocaleString() : '-'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortAccessor: (r) => (r.acceptedBy ? 'accepted' : 'pending'),
        render: (r) => (
          <Badge variant={r.acceptedBy ? 'default' : 'outline'}>
            {r.acceptedBy ? 'Accepted' : 'Pending'}
          </Badge>
        ),
      },
    ],
    []
  );
  const handleEdit = (inv: InviteRow) => {
    // setEditOpen({open : true, invite:  inv})
  };

  const handleDelete = (inv: InviteRow) => {
    confirm({
      title: 'Delete invite?',
      description: (
        <>
          This will revoke the email for <b>{inv.email}</b>. This action cannot
          be undone.
        </>
      ),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const res = await dispatch(deleteInvite({ orgId, inviteId: inv.id }));
        if ((res as any).error) toast.error('Failed to delete invite');
        else toast.success('Invite deleted');
      },
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Invites"
        subtitle="Send and manage invitations to join this organisation."
        actions={
          <>
            <Button
              variant={'outline'}
              onClick={() => dispatch(listInvites({ orgId }))}
            >
              <RefreshCw className="size-4 mr-2" /> Refresh
            </Button>
            <Button
              onClick={() => {
                setOpen(true);
              }}
            >
              <Plus className="size-4 mr-2" />
              Create Invite
            </Button>
          </>
        }
      />
      <PageBody>
        <DataTable<InviteRow>
          title="Invites"
          columns={columns}
          rows={invites}
          rowKey={(r) => r.id}
          loading={loading}
          onRefresh={() => dispatch(listInvites({ orgId }))}
          rightActionsFor={(r) => (
            <div className="flex justify-end gap-2">
              <Button
                variant={'outline'}
                size="icon"
                onClick={() => {
                  handleDelete(r);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant={'destructive'}
                size={'icon'}
                onClick={() => {
                  handleDelete(r);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        />
      </PageBody>
    </div>
  );
};

export default InvitesPage;
