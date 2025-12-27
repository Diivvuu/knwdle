'use client';

import { useAddAudienceMemberModal } from '@/features/audience-member/use-audience.member';
import { useConfirmDialog } from '@/features/confirm/use-confirm-dialog';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchAudience,
  fetchAudienceMembers,
  removeAudienceMember,
} from '@workspace/state';
import { Button } from '@workspace/ui/components/button';
import DataTableClean, { Column } from '@workspace/ui/components/data-table';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/ui/lib/utils';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

const AudienceMembersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const params = useSearchParams();

  const { id: orgId = '', audienceId = '' } =
    useParams<{ id: string; audienceId: string }>() ?? {};

  const [open, setOpen] = useAddAudienceMemberModal();
  const { confirm } = useConfirmDialog();

  const audience = useSelector((state: RootState) => state.audience.selected);
  const members = useSelector((state: RootState) => state.audienceMembers.list);
  const loading =
    useSelector((state: RootState) => state.audienceMembers.status) ===
    'loading';

  const search = params.get('search') ?? '';
  const limit = Number(params.get('limit') || 25);

  useEffect(() => {
    if (!orgId || !audienceId) return;
    dispatch(fetchAudience({ orgId, audienceId })).catch(() => {
      toast.error('Failed to loading audience');
    });
  }, [dispatch, orgId, audienceId]);

  const lastSig = useRef('');
  useEffect(() => {
    if (!orgId || !audienceId) return;

    const sig = JSON.stringify({ orgId, audienceId, search, limit });
    if (lastSig.current === sig) return;
    lastSig.current = sig;

    dispatch(
      fetchAudienceMembers({
        orgId,
        audienceId,
        search,
        limit,
      })
    );
  }, [dispatch, orgId, audienceId, search, limit]);

  const handleRemove = async (userId: string) => {
    if (!orgId || !audienceId) return;

    confirm({
      title: 'Remove Member?',
      description: (
        <>
          Are you sure you want to remove this member from audience
          {/* <b>{role?.name ?? ''}</b>? <br /> */}
          {/* This action cannot be undone. */}
        </>
      ),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await dispatch(
          removeAudienceMember({ orgId, audienceId, userId })
        ).unwrap();
        toast.success('Member Removed');
      },
    });
  };

  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (r) => <span className="font-medium">{r.user?.email}</span>,
      },
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (r) => r.user?.name || '-',
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (r) => (
          <span
            className={cn(
              'inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize',
              r.role === 'student' ? 'bg-emerald-600 text-white' : 'bg-muted'
            )}
          >
            {r.role}
          </span>
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
      sp.delete('cursor');

      const nextQS = sp.toString();
      if (nextQS !== current.toString()) {
        router.replace(`?${nextQS}`, { scroll: false });
      }
    },
    [router]
  );

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2 pt-4">
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            {audience?.name || 'Audience'}
          </Label>
          <p className="text-sm text-muted-foreground">
            {audience?.type === 'ACADEMIC' ? 'Academic' : 'Activity'}
            {audience?.isExclusive && ' • Exclusive'}
          </p>
        </div>
      </div>
      <DataTableClean
        title=""
        columns={columns}
        rows={members}
        rowKey={(r) => r.userId}
        loading={loading}
        handlers={{ onQueryChange: onServerQueryChange }}
        serverSearchMode="manual"
        initialQuery={search}
        initialPageSize={limit}
        filters={[]}
        rightActionsFor={(r) => (
          <Button
            variant={'ghost'}
            size="sm"
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(r.userId);
            }}
          >
            Remove
          </Button>
        )}
        toolbarActions={
          <>
            <Button
              variant={'outline'}
              size="sm"
              onClick={() =>
                dispatch(
                  fetchAudienceMembers({
                    orgId,
                    audienceId,
                    search,
                    limit,
                  })
                )
              }
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(true)}
              className="gap-2"
            >
              Add Member
            </Button>
          </>
        }
        ui={{
          hideSearch: false,
          zebra: true,
          stickyHeader: true,
          rounded: 'xl',
          headerUppercase: true,
          compactHeader: true,
          border: true,
          showSearchButton: true,
          searchPlaceholder: 'Search member...',
        }}
      />
    </div>
  );
};

export default AudienceMembersPage;
