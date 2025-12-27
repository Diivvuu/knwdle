'use client';

import {
  useCreateAudienceModal,
  useEditAudienceModal,
} from '@/features/audience/use-audience.atom';
import { AppDispatch, RootState } from '@/store/store';
import { deleteAudience, fetchAudiences } from '@workspace/state';
import { Button } from '@workspace/ui/components/button';
import DataTableClean, { Column } from '@workspace/ui/components/data-table';
import { Label } from '@workspace/ui/components/label';
import { Layers, Pencil, Trash2, Users } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/features/confirm/use-confirm-dialog';

const AudiencePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useSearchParams();
  const { id: orgId = '' } = useParams<{ id: string }>() ?? {};
  const { confirm } = useConfirmDialog();

  //global state
  const [open, setOpen] = useCreateAudienceModal();
  const [editOpen, setEditOpen] = useEditAudienceModal();

  const audiences = useSelector((state: RootState) => state.audience.list);
  const status = useSelector((state: RootState) => state.audience.status);

  const loading = status === 'loading';

  const search = params.get('search') ?? '';
  const limit = Number(params.get('limit') || 25);

  const lastSig = useRef('');
  useEffect(() => {
    if (!orgId) return;

    const sig = JSON.stringify({ orgId });
    if (lastSig.current === sig) return;
    lastSig.current = sig;

    dispatch(fetchAudiences(orgId));
  }, [dispatch, orgId]);

  //delete

  const handleDelete = useCallback(
    (a: any) => {
      if (!orgId) return;
      confirm({
        title: 'Delete audience?',
        description: (
          <div>
            Are you sure you want to delete <b>{a.name}</b>? This cannot be
            undone.
          </div>
        ),
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await dispatch(deleteAudience({ orgId, audienceId: a.id })).unwrap();
            toast.success('Audience deleted');
          } catch (error: any) {
            toast.error(error?.message || 'Failed to delete audience');
          }
        },
      });
    },
    [confirm, dispatch, orgId]
  );

  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Audience',
        sortable: true,
        render: (r) => (
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{r.name}</span>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        render: (r) => (
          <span className="capitalize text-sm">{r.type.toLowerCase()}</span>
        ),
      },
      {
        key: 'level',
        header: 'Level',
        sortable: true,
        render: (r) => <span>{r.level}</span>,
      },
      {
        key: 'isExclusive',
        header: 'Exclusive',
        sortable: true,
        render: (r) =>
          r.isExclusive ? (
            <span className="text-xs font-semibold text-emerald-600">Yes</span>
          ) : (
            <span className="text-xs text-muted-foreground">No</span>
          ),
      },
      {
        key: 'members',
        header: 'Members',
        render: (r) => (
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{r._count?.members ?? '-'}</span>
          </div>
        ),
      },
    ],
    []
  );

  const onServerQueryChange = useCallback(
    ({
      pageSize,
      query,
    }: {
      page: number;
      pageSize: number;
      query: string;
      filters: Record<string, string>;
    }) => {
      const current = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : ''
      );
      const sp = new URLSearchParams(current.toString());

      if (query) sp.set('search', query);
      else sp.delete('search');

      sp.set('limit', String(pageSize || 25));

      const nextQS = sp.toString();
      if (nextQS !== current.toString()) {
        router.replace(`?${nextQS}`, {
          scroll: false,
        });
      }
    },
    [router]
  );

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            Audiences
          </Label>
          <p className="text-sm text-muted-foreground">
            Manage academic and activity audiences inside the organisation.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          + Create Audience
        </Button>
      </div>

      <DataTableClean
        title=""
        columns={columns}
        rows={audiences}
        rowKey={(r) => r.id}
        onRowClick={(row) => {
          router.push(`/org/${orgId}/audience/${row.id}/members`);
        }}
        loading={loading}
        handlers={{ onQueryChange: onServerQueryChange }}
        serverSearchMode="manual"
        initialQuery={search}
        initialPageSize={limit}
        filters={[]}
        rightActionsFor={(r) => (
          <div className="flex justify-end gap-1.5">
            <Button
              variant={'ghost'}
              size="icon"
              className="rounded-md hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen({ open: true, audienceId: r.id });
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={'ghost'}
              size="icon"
              className="rounded-md text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(r);
              }}
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
          searchPlaceholder: 'Search audiences...',
        }}
      />
    </div>
  );
};

export default AudiencePage;
