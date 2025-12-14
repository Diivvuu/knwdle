'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  listInvitesPage,
  clearOrgInvites,
  deleteInvite,
  listRoles,
  ParentRole,
} from '@workspace/state';
import { AppDispatch, RootState } from '@/store/store';
import { useAddInviteModal } from '@/features/invites/use-invite-atom';
import { useConfirmDialog } from '@/features/confirm/use-confirm-dialog';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import DataTable, {
  Column,
  FilterDef,
} from '@workspace/ui/components/data-table';
import { RowActions } from '@workspace/ui/components/row-actions';
import {
  Plus,
  RefreshCw,
  Upload,
  Shield,
  UserRoundCog,
  GraduationCap,
  Users,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Label } from '@workspace/ui/components/label';

type InviteRow = {
  id: string;
  orgId: string;
  email: string;
  role: ParentRole;
  audienceId: string | null;
  joinCode: string | null;
  expiresAt: string;
  acceptedBy: string | null;
  createdAt: string;
};

const ROLES = ['admin', 'staff', 'student', 'parent'] as const;
type SearchBy = 'email' | 'role' | 'audienceId';

/* ---------- small UI helpers ---------- */
const RoleIcon: Record<ParentRole, any> = {
  admin: Shield,
  staff: UserRoundCog,
  student: GraduationCap,
  parent: Users,
};
const roleBadgeClass: Record<ParentRole, string> = {
  admin: 'bg-primary text-primary-foreground',
  staff: 'bg-secondary text-secondary-foreground',
  student: 'bg-emerald-600 text-white',
  parent: 'bg-indigo-600 text-white',
};
const emailInitials = (email: string) => {
  const local = String(email ?? '');
  const namePart = local.split('@')[0] || '';
  const cleaned = namePart
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();
  return cleaned || 'U';
};

function ExpiryChip({ date }: { date: string }) {
  if (!date) return <span className="text-xs text-muted-foreground">—</span>;
  const d = new Date(date);
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  const exact = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
  let cls = 'bg-muted text-foreground',
    txt = 'Valid';
  if (days <= 3 && days >= 0) {
    cls = 'bg-amber-600 text-white';
    txt = 'Expiring';
  }
  if (days < 0) {
    cls = 'bg-red-600 text-white';
    txt = 'Expired';
  }
  return (
    <span
      title={exact}
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        cls
      )}
    >
      {txt}
      <span className="mx-1.5 opacity-70">•</span>
      <span className="tabular-nums">{exact}</span>
    </span>
  );
}
const EmailCell = ({ email }: { email: string }) => (
  <div className="flex items-center gap-2">
    <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-semibold text-[12px]">
      {emailInitials(email)}
    </div>
    <span className="font-medium">{email}</span>
  </div>
);
const RoleCell = ({ role }: { role: ParentRole }) => {
  const Icon = RoleIcon[role];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs capitalize font-medium',
        roleBadgeClass[role]
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {role}
    </span>
  );
};

/* ---------- page ---------- */
export default function InvitesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useSearchParams();
  const { id: orgId = '' } = useParams<{ id: string }>() ?? {};

  const [open, setOpen] = useAddInviteModal();
  const { confirm } = useConfirmDialog();

  const entry = useSelector((s: RootState) => s.invites.byOrg[orgId]);
  const invites = (entry?.items ?? []) as InviteRow[];
  const loading = entry?.status === 'loading';
  const hasMore = entry?.hasMore;

  // read URL state
  const searchByParam = (params.get('searchBy') as SearchBy) ?? 'email';
  const q = params.get('q') ?? '';
  const roleParam = (params.get('role') as ParentRole | null) ?? null;
  const audienceId = params.get('audienceId') ?? '';
  const status =
    (params.get('status') as 'pending' | 'accepted' | null) ?? null;
  const sortKey = params.get('sortKey') ?? '';
  const sortDir = (params.get('sortDir') as 'asc' | 'desc' | null) ?? null;
  const limit = Number(params.get('limit') || 25);

  // derived (server)
  const effectiveQ =
    searchByParam === 'email'
      ? q
      : searchByParam === 'audienceId'
        ? audienceId
        : '';
  const effectiveRole = searchByParam === 'role' ? (roleParam ?? '') : '';

  // initial fetch
  const lastSig = useRef('');
  useEffect(() => {
    if (!orgId) return;
    dispatch(listRoles({ orgId }));
  }, [dispatch, orgId]);

  useEffect(() => {
    if (!orgId) return;
    const sig = [
      orgId,
      searchByParam,
      effectiveQ,
      effectiveRole,
      status || '',
      sortKey || '',
      sortDir || '',
      String(limit),
    ].join('|');
    if (lastSig.current === sig) return;
    lastSig.current = sig;

    dispatch(clearOrgInvites({ orgId }));
    dispatch(
      listInvitesPage({
        orgId,
        limit,
        cursor: null,
        q: effectiveQ || undefined,
        role: (effectiveRole as ParentRole) || undefined,
        status: status || undefined,
        audienceId:
          searchByParam === 'audienceId' ? audienceId || undefined : undefined,
        sortKey: sortKey || undefined,
        sortDir: sortDir || undefined,
      })
    );
  }, [
    dispatch,
    orgId,
    searchByParam,
    effectiveQ,
    effectiveRole,
    audienceId,
    status,
    sortKey,
    sortDir,
    limit,
  ]);

  // columns
  const columns: Column<InviteRow>[] = useMemo(
    () => [
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (r) => <EmailCell email={r.email} />,
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (r) => <RoleCell role={r.role} />,
      },
      {
        key: 'audienceId',
        header: 'Audience',
        sortable: true,
        render: (r) => (
          <span className="text-xs text-muted-foreground">
            {r.audienceId ?? '—'}
          </span>
        ),
      },
      {
        key: 'expiresAt',
        header: 'Expires',
        sortable: true,
        sortAccessor: (r) => new Date(r.expiresAt || 0).getTime(),
        render: (r) => <ExpiryChip date={r.expiresAt} />,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortAccessor: (r) => (r.acceptedBy ? 1 : 0),
        render: (r) =>
          r.acceptedBy ? (
            <Badge className="rounded-md bg-emerald-600 text-white">
              Accepted
            </Badge>
          ) : (
            <Badge className="rounded-md border bg-white">Pending</Badge>
          ),
      },
    ],
    []
  );

  // table toolbar filters
  const filters: FilterDef[] = useMemo(
    () => [
      {
        type: 'select',
        key: 'status',
        label: 'Status',
        options: [
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Accepted', value: 'accepted' },
        ],
      },
      {
        type: 'select',
        key: 'searchBy',
        label: 'Search by',
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Role', value: 'role' },
          { label: 'Audience ID', value: 'audienceId' },
        ],
      },
    ],
    []
  );

  // single source of truth: table notifies URL
  const onServerQueryChange = useCallback(
    (p: {
      page: number;
      pageSize: number;
      query: string;
      sort?: { key: string; dir: 'asc' | 'desc' } | null;
      filters: Record<string, string>;
    }) => {
      const current = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : ''
      );
      const sp = new URLSearchParams(current.toString());

      const nextSearchBy = (p.filters.searchBy as SearchBy) || 'email';
      sp.set('searchBy', nextSearchBy);
      sp.delete('q');
      sp.delete('role');
      sp.delete('audienceId');

      const text = (p.query || '').trim();
      if (nextSearchBy === 'email' && text) sp.set('q', text);
      if (nextSearchBy === 'audienceId' && text) sp.set('audienceId', text);
      if (nextSearchBy === 'role' && text) sp.set('role', text as ParentRole); // allow typing role

      const nextStatus = p.filters.status ?? '';
      nextStatus ? sp.set('status', nextStatus) : sp.delete('status');

      p.sort?.key ? sp.set('sortKey', p.sort.key) : sp.delete('sortKey');
      p.sort?.dir ? sp.set('sortDir', p.sort.dir) : sp.delete('sortDir');

      sp.set('limit', String(p.pageSize || 25));
      const nextQS = sp.toString();
      if (nextQS !== current.toString())
        router.replace(`?${nextQS}`, { scroll: false });
    },
    [router]
  );

  const handleDelete = (inv: InviteRow) =>
    confirm({
      title: 'Delete invite?',
      description: (
        <>
          This will revoke <b>{inv.email}</b>. This action cannot be undone.
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

  const loadMore = () => {
    if (!entry?.nextCursor) return;
    dispatch(
      listInvitesPage({
        orgId,
        limit,
        cursor: entry.nextCursor,
        q: effectiveQ || undefined,
        role: (effectiveRole as ParentRole) || undefined,
        status: status || undefined,
        audienceId:
          searchByParam === 'audienceId' ? audienceId || undefined : undefined,
        sortKey: sortKey || undefined,
        sortDir: sortDir || undefined,
      })
    );
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Minimal page header: keep CTAs only */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            Invites
          </Label>
          <p className="text-sm text-muted-foreground">
            Send and manage invitations for this organisation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-md">
            <Upload className="mr-2 h-4 w-4" /> Bulk invite
          </Button>
          <Button className="rounded-md" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create invite
          </Button>
        </div>
      </div>

      {/* Single toolbar inside the table; no duplicate search */}
      <DataTable<InviteRow>
        title=""
        columns={columns}
        rows={invites}
        rowKey={(r) => r.id}
        loading={loading}
        handlers={{ onQueryChange: onServerQueryChange }}
        serverSearchMode="manual"
        initialQuery={
          (searchByParam === 'email' && q) ||
          (searchByParam === 'audienceId' && audienceId) ||
          (searchByParam === 'role' && (roleParam ?? '')) ||
          ''
        }
        initialSort={
          sortKey && sortDir ? ({ key: sortKey, dir: sortDir } as const) : null
        }
        initialFilters={{ status: status ?? '', searchBy: searchByParam }}
        initialPageSize={limit}
        filters={filters}
        toolbarActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch(
                listInvitesPage({
                  orgId,
                  limit,
                  cursor: null,
                  q: effectiveQ || undefined,
                  role: (effectiveRole as ParentRole) || undefined,
                  status: status || undefined,
                  audienceId:
                    searchByParam === 'audienceId'
                      ? audienceId || undefined
                      : undefined,
                  sortKey: sortKey || undefined,
                  sortDir: sortDir || undefined,
                })
              );
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
        rightActionsFor={(r) => (
          <RowActions
            // onView={() => toast.info(`View ${r.email}`)}
            // onEdit={() => toast.info(`Edit ${r.email}`)}
            onDelete={() => handleDelete(r)}
          />
        )}
        ui={{
          hideSearch: false, // <-- only this search is visible
          zebra: true,
          stickyHeader: true,
          rounded: 'xl',
          headerUppercase: true,
          compactHeader: true,
          border: true,
          showSearchButton: true,
          searchPlaceholder:
            searchByParam === 'role'
              ? 'Search role (admin, staff, ...)'
              : searchByParam === 'audienceId'
                ? 'Search audience id…'
                : 'Search email…',
        }}
      />

      {hasMore && (
        <div className="mt-3 flex justify-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="rounded-md"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
