'use client';

import Link from 'next/link';
import { useMemo, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { deleteOrg } from '@workspace/state';
import { toast } from 'sonner';
import {
  Building2,
  ShieldCheck,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpRight,
  Megaphone,
  CalendarCheck,
  Receipt,
  Users,
  Boxes,
} from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { cn } from '@workspace/ui/lib/utils';
import { ADMIN_BASE, CONNECT_BASE } from '@/lib/env';
import { useEditOrgModal } from '@/features/org/use-org-atom';
import { useTypeToConfirm } from '@/features/type-to-confirm-modal';

type OrgRowProps = {
  org: any;
  onQuickEdit?: (org: any) => void;
  onDelete?: (org: any) => void;
  className?: string;
};

export default function OrgRow({ org, className }: OrgRowProps) {
  const meta = org?.profile?.meta ?? {};
  const brand = org.brand_color ?? 'hsl(var(--primary))';
  const isAdmin = org.myRole === 'admin';
  const [open, setOpen] = useEditOrgModal();
  const dispatch = useDispatch<AppDispatch>();
  const { openConfirm } = useTypeToConfirm();

  const handleDelete = useCallback(() => {
    openConfirm({
      title: 'Delete organisation',
      description: (
        <>
          This action <b>cannot be undone</b>. This will permanently delete{' '}
          <b>{org.name}</b> and remove all associated data.
        </>
      ),
      label: 'Please type the organisation name to confirm',
      expectedText: org.name || '',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await dispatch(deleteOrg(org.id)).unwrap();
          toast.success('Organisation deleted');
        } catch (e: any) {
          toast.error(e?.message || 'Failed to delete organisation');
          throw e;
        }
      },
    });
  }, [dispatch, openConfirm, org.id, org.name]);
  // normalize common fields
  const teamSize = String(meta.teamSize ?? org.teamSize ?? '').trim();
  const focusArea = meta.focusArea as string | undefined;
  const features = meta.features ?? {};
  const units = meta?.stats?.units ?? org?.unitsCount;
  const members =
    meta?.stats?.members ??
    (Array.isArray(org?.members) ? org.members.length : undefined);
  const invoicesDue = meta?.stats?.invoicesDue ?? org?.invoicesDue;

  const permissions = Array.isArray(org.permissions) ? org.permissions : [];
  const canEdit =
    permissions.includes('org.update') || permissions.includes('*');
  const canDelete =
    permissions.includes('org.delete') || permissions.includes('*');
  useEffect(() => {
    console.log(canEdit, canDelete);
  }, [canEdit, canDelete]);
  const initials = useMemo(() => {
    const i = (org.name || '')
      .split(' ')
      .map((s: string) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
    return i || '—';
  }, [org.name]);

  const since = useMemo(() => {
    try {
      return new Date(org.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [org.createdAt]);

  function handleRedirect(userRole: string, orgId: string) {
    if (userRole === 'admin' || userRole === 'staff') {
      window.location.href = `${ADMIN_BASE}/org/${orgId}`;
    } else if (userRole === 'student' || userRole === 'parent') {
      window.location.href = `${CONNECT_BASE}/org/${orgId}`;
    } else {
      console.warn('Unknown role, staying on current app');
    }
  }

  return (
    <div
      role="row"
      tabIndex={-1}
      className={cn(
        'group grid gap-4 rounded-xl border bg-card px-3 py-2.5 hover:bg-muted/40 hover:border-border transition-colors',
        'grid-cols-1 sm:grid-cols-[minmax(220px,0.9fr),1.2fr,0.9fr,auto]',
        className
      )}
      data-org-id={org.id}
      onClick={(e) => e.stopPropagation()} // stop any unwanted bubbling
      onMouseDown={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
    >
      {/* identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-10 w-10 grid place-items-center rounded-lg border bg-background/80 overflow-hidden"
          style={{ boxShadow: 'inset 0 0 0 2px hsl(var(--background))' }}
        >
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-10 w-10 object-cover"
            />
          ) : (
            <span className="text-xs font-semibold">{initials}</span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={
                org.myRole === 'student' || org.myRole === 'parent'
                  ? `${CONNECT_BASE}/org/${org.id}`
                  : `${ADMIN_BASE}/org/${org.id}`
              }
              className="truncate font-medium hover:underline"
              title={org.name}
            >
              {org.name}
            </Link>
            {isAdmin && (
              <Badge className="gap-1 bg-amber-500/10 text-amber-700 border-amber-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            {since && <span>Since {since}</span>}
            {Array.isArray(org.myUnitRoles) && org.myUnitRoles.length > 1 && (
              <span className="hidden sm:inline">
                • {org.myUnitRoles.length} roles
              </span>
            )}
          </div>
          {/* brand line */}
          <div
            className="mt-1 h-1 w-16 rounded-full opacity-70"
            style={{ background: brand }}
          />
        </div>
      </div>

      {/* meta */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
          {org.type && (
            <span className="rounded-md border px-1.5 py-0.5 capitalize text-muted-foreground">
              {String(org.type).toLowerCase().replace(/_/g, ' ')}
            </span>
          )}
          {teamSize && (
            <span className="rounded-md border px-1.5 py-0.5 text-muted-foreground">
              {teamSize}
            </span>
          )}
          {org.country && (
            <span className="rounded-md border px-1.5 py-0.5 text-muted-foreground">
              {org.country}
            </span>
          )}
          {org.timezone && (
            <span className="rounded-md border px-1.5 py-0.5 text-muted-foreground">
              {org.timezone}
            </span>
          )}
          {focusArea && (
            <span className="rounded-md border px-1.5 py-0.5 text-muted-foreground">
              {focusArea}
            </span>
          )}
        </div>

        {/* feature flags */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px]">
          {'fees' in features && features.fees && (
            <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5">
              <Receipt className="h-3.5 w-3.5" /> Fees
            </span>
          )}
          {'attendance' in features && features.attendance && (
            <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5">
              <CalendarCheck className="h-3.5 w-3.5" /> Attendance
            </span>
          )}
          {'announcements' in features && features.announcements && (
            <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5">
              <Megaphone className="h-3.5 w-3.5" /> Announcements
            </span>
          )}
        </div>
      </div>

      {/* stats (render what you have) */}
      <div className="min-w-0 sm:justify-self-end">
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          {typeof units === 'number' && (
            <span className="inline-flex items-center gap-1">
              <Boxes className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{units}</span> units
            </span>
          )}
          {typeof members === 'number' && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">
                {members}
              </span>{' '}
              members
            </span>
          )}
          {typeof invoicesDue === 'number' && invoicesDue > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive">
              <Receipt className="h-3.5 w-3.5" />
              {invoicesDue} due
            </span>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2">
        <Link
          href={
            org.myRole === 'student' || org.myRole === 'parent'
              ? `${CONNECT_BASE}/org/${org.id}`
              : `${ADMIN_BASE}/org/${org.id}`
          }
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost" className="gap-1">
            Open <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>

        {permissions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                aria-label="Organisation actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="w-44 z-[9999]"
              onClick={(e) => e.stopPropagation()}
            >
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => setOpen({ open: true, org: org })}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Quick edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
