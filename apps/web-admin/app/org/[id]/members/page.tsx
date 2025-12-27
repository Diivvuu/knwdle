'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  fetchOrgMembers,
  selectOrgMembers,
  selectOrgMembersStatus,
  listRoles,
  fetchOrgMember,
} from '@workspace/state';
import { AppDispatch, RootState } from '@/store/store';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import DataTable, { Column } from '@workspace/ui/components/data-table';
import {
  Pencil,
  Trash2,
  Shield,
  UserRoundCog,
  GraduationCap,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@workspace/ui/components/select';
import { useEditMemberModal } from '@/features/members/use-members.atom';

const BUILTIN_ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Staff', value: 'staff' },
  { label: 'Student', value: 'student' },
  { label: 'Parent', value: 'parent' },
];

const RoleIcon: Record<string, any> = {
  admin: Shield,
  staff: UserRoundCog,
  student: GraduationCap,
  parent: Users,
};

const roleBadgeClass: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  staff: 'bg-secondary text-secondary-foreground',
  student: 'bg-emerald-600 text-white',
  parent: 'bg-indigo-600 text-white',
};

export default function OrgMembersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useSearchParams();
  const { id: orgId = '' } = useParams<{ id: string }>() ?? {};

  const [editState, setEditState] = useEditMemberModal();

  const members = useSelector(selectOrgMembers);
  const loading = useSelector(selectOrgMembersStatus) === 'loading';
  const rolesState = useSelector((s: RootState) => s.roles.rolesByOrg[orgId]);
  const roles = rolesState?.items || [];

  const search = params.get('search') ?? '';
  const role = params.get('role') ?? '';
  const roleId = params.get('roleId') ?? '';
  const audienceId = params.get('audienceId') ?? '';
  const limit = Number(params.get('limit') || 25);

  // Load roles on mount
  useEffect(() => {
    if (orgId) dispatch(listRoles({ orgId }));
  }, [dispatch, orgId]);

  // Fetch members when query params change
  const lastSig = useRef('');
  useEffect(() => {
    if (!orgId) return;
    const sig = JSON.stringify({
      orgId,
      search,
      role,
      roleId,
      audienceId,
      limit,
    });
    if (lastSig.current === sig) return;
    lastSig.current = sig;

    dispatch(
      fetchOrgMembers({
        orgId,
        search: search || undefined,
        role: role === 'all' ? undefined : role || undefined,
        roleId: roleId || undefined,
        audienceId: audienceId || undefined,
        limit,
      })
    );
  }, [dispatch, orgId, search, role, roleId, audienceId, limit]);

  const handleDelete = (r: any) => {};

  // Columns
  const columns: Column<any>[] = useMemo(
    () => [
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
        render: (r) => <span>{r.name || '—'}</span>,
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (r) => {
          const roleKey = r.orgRole || '—';
          const Icon = RoleIcon[roleKey] ?? Shield;
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs capitalize font-medium',
                roleBadgeClass[roleKey] || ''
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {roleKey}
            </span>
          );
        },
      },
      {
        key: 'audiences',
        header: 'Audiences',
        sortable: true,
        render: (r) => (
          <span>
            {r.audiences?.length
              ? r.audiences.map((a: any) => a.name).join(', ')
              : '—'}
          </span>
        ),
      },
    ],
    []
  );

  // Unified server-query sync
  const onServerQueryChange = useCallback(
    ({
      page,
      pageSize,
      query,
      filters,
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

      if (filters.audienceId) sp.set('audienceId', filters.audienceId);
      else sp.delete('audienceId');

      if (filters.roleId) {
        sp.set('roleId', filters.roleId);
        sp.delete('role');
      } else if (filters.role) {
        sp.set('role', filters.role);
        sp.delete('roleId');
      }

      sp.set('limit', String(pageSize || 25));
      sp.delete('cursor');

      const nextQS = sp.toString();
      if (nextQS !== current.toString())
        router.replace(`?${nextQS}`, { scroll: false });
    },
    [router]
  );

  // Handle role dropdown change
  const handleRoleChange = (val: string) => {
    const sp = new URLSearchParams(params.toString());
    const builtinValues = BUILTIN_ROLES.map((r) => r.value);
    const customValues = roles.map((r) => r.id);

    if (val === 'all') {
      sp.delete('role');
      sp.delete('roleId');
    } else if (builtinValues.includes(val)) {
      // built-in role → use role param
      sp.set('role', val);
      sp.delete('roleId');
    } else if (customValues.includes(val)) {
      // custom role → use roleId param
      sp.set('roleId', val);
      sp.delete('role');
    }

    sp.delete('cursor');
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            Members
          </Label>
          <p className="text-sm text-muted-foreground">
            View and manage members in this organisation.
          </p>
        </div>

        {/* Role Filter */}
        <div className="flex gap-2 justify-end">
          <Select
            value={roleId || role || 'all'}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {/* Built-in roles */}
              {BUILTIN_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
              {/* Custom roles (from backend) */}
              {roles.length > 0 && (
                <>
                  <div className="border-t my-1" />
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        title=""
        columns={columns}
        rows={members}
        rowKey={(r) => r.userId}
        loading={loading}
        handlers={{ onQueryChange: onServerQueryChange }}
        serverSearchMode="manual"
        initialQuery={search}
        initialPageSize={limit}
        initialFilters={{ role, roleId, audienceId }}
        filters={[]}
        toolbarActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              dispatch(
                fetchOrgMembers({
                  orgId,
                  search: search || undefined,
                  role: role || undefined,
                  roleId: roleId || undefined,
                  audienceId: audienceId || undefined,
                  limit,
                })
              )
            }
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
        rightActionsFor={(r) => (
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md hover:bg-muted"
              onClick={async () => {
                await dispatch(fetchOrgMember({ orgId, memberId: r.userId }));
                setEditState({ open: true, memberId: r.userId }); // using your atom
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(r)}
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
          searchPlaceholder: 'Search email…',
        }}
      />
    </div>
  );
}
