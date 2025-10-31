'use client';

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { AppDispatch, RootState } from '@/store/store';

import {
  fetchOrgBasic,
  fetchOrgSummary,
  fetchDashboardConfig,
  fetchUnitsGlance,
  fetchMembersPeek,
  fetchAnnouncementsPeek,
  fetchAttendanceSnapshot,
  fetchFeesSnapshot,
  clearOrgCache,
} from '@workspace/state';

import BrandingHeader from '@workspace/ui/components/app/branding-header';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { Label } from '@workspace/ui/components/label';
import {
  UserPlus,
  Building2,
  Megaphone,
  Settings,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const noop = () => {};
const fmt = (v?: number | string) => v ?? '—';

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function OrgDashboardPage() {
  const params = useParams<{ id: string }>();
  const orgId = params?.id;
  const dispatch = useDispatch<AppDispatch>();

  const basic = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.basicById[orgId] : undefined
  );
  const summary = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.summaryById[orgId] : undefined
  );
  const config = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.dashboardById[orgId] : undefined
  );

  const unitsGlance = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.unitsGlanceById[orgId]?.data : []
  );
  const membersPeek = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.membersPeekById[orgId]?.data : []
  );
  const announcementsPeek = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.announcementsPeekById[orgId]?.data : []
  );
  const attendanceSnapshot = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.attendanceSnapshotById[orgId]?.data : null
  );
  const feesSnapshot = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.feesSnapshotById[orgId]?.data : null
  );

  // Base fetches
  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchOrgBasic(orgId));
    dispatch(fetchOrgSummary(orgId));
    dispatch(fetchDashboardConfig(orgId));
  }, [dispatch, orgId]);
 
  // Conditional peek/snapshot fetches once config arrives
  useEffect(() => {
    if (!orgId || !config?.data) return;
    const widgets = config.data.widgets || [];

    if (widgets.includes('units_glance')) dispatch(fetchUnitsGlance(orgId));
    if (widgets.includes('members_peek')) dispatch(fetchMembersPeek(orgId));
    if (widgets.includes('announcements_peek'))
      dispatch(fetchAnnouncementsPeek(orgId));
    if (widgets.includes('attendance_snapshot'))
      dispatch(fetchAttendanceSnapshot(orgId));
    if (widgets.includes('fees_snapshot')) dispatch(fetchFeesSnapshot(orgId));
  }, [dispatch, orgId, config?.data]);

  // Derived state
  const loading =
    !orgId ||
    basic?.status === 'loading' ||
    summary?.status === 'loading' ||
    config?.status === 'loading';

  const error = basic?.error || summary?.error || config?.error;
  const org = basic?.data;
  const brandColor = org?.brand_color || undefined;
  const logoUrl = org?.logoUrl || undefined;
  const coverUrl = org?.coverUrl || undefined;

  const roleCounts = summary?.data?.roleCounts;
  const unitsCount = summary?.data?.unitsCount ?? 0;
  const pendingInvites = summary?.data?.pendingInvites ?? 0;

  const widgets = useMemo(
    () => config?.data?.widgets ?? [],
    [config?.data?.widgets]
  );
  const tables = useMemo(
    () => config?.data?.tables ?? [],
    [config?.data?.tables]
  );
  const userRole = config?.data?.role ?? 'guest';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {org?.name ?? 'Organisation'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {org?.type ? `Type: ${org.type}` : '—'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {orgId && (
            <Button
              variant="outline"
              onClick={() => {
                dispatch(clearOrgCache({ orgId }));
                dispatch(fetchOrgBasic(orgId));
                dispatch(fetchOrgSummary(orgId));
                dispatch(fetchDashboardConfig(orgId));
              }}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Branding header */}
      <div className="relative">
        <BrandingHeader
          coverUrl={coverUrl}
          logoUrl={logoUrl}
          brandColor={brandColor}
          onPickCover={noop}
          onPickLogo={noop}
          onBrandColorChange={noop}
          uploadingCover={false}
          uploadingLogo={false}
          coverProgress={0}
          logoProgress={0}
        />
        {!loading && !error && (
          <div className="-mt-6 px-2 sm:px-4">
            <div className="mx-auto max-w-5xl glass elev-2 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
              <StatPill
                icon={<Building2 size={16} />}
                label="Units"
                value={fmt(unitsCount)}
              />
              <StatPill
                icon={<UserPlus size={16} />}
                label="Admins"
                value={fmt(roleCounts?.admin)}
              />
              <StatPill
                icon={<UserPlus size={16} />}
                label="Staff"
                value={fmt(roleCounts?.staff)}
              />
              <StatPill
                icon={<UserPlus size={16} />}
                label="Students"
                value={fmt(roleCounts?.students)}
              />
              <StatPill
                icon={<UserPlus size={16} />}
                label="Parents"
                value={fmt(roleCounts?.parent)}
              />
              <StatPill
                icon={<Megaphone size={16} />}
                label="Invites"
                value={fmt(pendingInvites)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading / error */}
      {loading && <SkeletonGrid />}
      {!loading && error && (
        <ErrorBanner
          error={error}
          onRetry={() => {
            if (!orgId) return;
            dispatch(clearOrgCache({ orgId }));
            dispatch(fetchOrgBasic(orgId));
            dispatch(fetchOrgSummary(orgId));
            dispatch(fetchDashboardConfig(orgId));
          }}
        />
      )}

      {/* Main layout */}
      {!loading && !error && (
        <>
          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            <div className="lg:col-span-1">
              <CardSection title="Quick Actions">
                <QuickActions orgId={orgId!} />
              </CardSection>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Dynamic Widgets */}
          {widgets.includes('attendance_snapshot') && (
            <CardSection title="Attendance Snapshot">
              <SnapshotCard
                data={attendanceSnapshot}
                label="Average Attendance"
                unit="%"
              />
            </CardSection>
          )}

          {widgets.includes('fees_snapshot') && (
            <CardSection title="Finance Snapshot">
              <SnapshotCard data={feesSnapshot} label="Total Paid" unit="₹" />
            </CardSection>
          )}

          {widgets.includes('announcements_peek') && (
            <CardSection
              title="Announcements"
              actionHref={`/org/${orgId}/announcements`}
            >
              <AnnouncementsPeek data={announcementsPeek} />
            </CardSection>
          )}

          {widgets.includes('members_peek') && (
            <CardSection
              title="Recent Members"
              actionHref={`/org/${orgId}/members`}
            >
              <MembersPeek data={membersPeek} />
            </CardSection>
          )}

          {widgets.includes('units_glance') && (
            <CardSection
              title="Units at a glance"
              actionHref={`/org/${orgId}/units`}
            >
              <UnitsAtGlance orgId={orgId!} data={unitsGlance} />
            </CardSection>
          )}

          <Separator className="my-2" />

          {/* Tables */}
          {tables.length > 0 ? (
            <div className="space-y-3">
              <Label variant="muted" className="text-sm font-medium">
                Tables
              </Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tables.includes('members') && (
                  <PeekTable title="Members" href={`/org/${orgId}/members`} />
                )}
                {tables.includes('invites') && (
                  <PeekTable title="Invites" href={`/org/${orgId}/invites`} />
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tables configured for this role.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Shared UI
// -----------------------------------------------------------------------------
function CardSection({
  title,
  actionHref,
  actionLabel = 'View all',
  children,
}: any) {
  return (
    <div className="rounded-xl border bg-card p-4 elev-1 hover:bg-muted/30 transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <Label className="font-medium" variant="default">
          {title}
        </Label>
        {actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1 text-xs rounded-md border bg-background px-2.5 py-1 hover:bg-muted"
          >
            {actionLabel}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function StatPill({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 elev-1 hover:bg-muted/50">
      {icon}
      <div className="text-xs">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold leading-none">{value}</p>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
          <div className="mt-3 h-7 w-20 rounded bg-muted animate-pulse" />
          <div className="mt-5 h-2 w-28 rounded bg-muted/70 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ error, onRetry }: any) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <p className="text-destructive font-medium">Failed to load dashboard</p>
      <p className="text-muted-foreground mt-1">{error}</p>
      <div className="mt-3">
        <button
          className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm bg-background hover:bg-accent"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function QuickActions({ orgId }: any) {
  const items = [
    {
      label: 'Invite member',
      icon: <UserPlus size={16} />,
      href: `/org/${orgId}/members/invite`,
    },
    {
      label: 'Create unit',
      icon: <Building2 size={16} />,
      href: `/org/${orgId}/units/new`,
    },
    {
      label: 'Send announcement',
      icon: <Megaphone size={16} />,
      href: `/org/${orgId}/announcements/new`,
    },
    {
      label: 'Configure settings',
      icon: <Settings size={16} />,
      href: `/org/${orgId}/settings`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          className="overlay-sheen hover-glow hover-lift rounded-lg border bg-background px-3 py-2 text-sm flex items-center gap-2"
        >
          {it.icon}
          <span>{it.label}</span>
        </Link>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// New lightweight peek cards
// -----------------------------------------------------------------------------
function UnitsAtGlance({ orgId, data }: { orgId: string; data: any[] }) {
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No units found</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.map((u: any) => (
        <Link
          key={u.id}
          href={`/org/${orgId}/units/${u.id}`}
          className="hover-lift overlay-sheen hover-glow rounded-lg border bg-background p-3"
        >
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {u.memberCount} members
          </p>
        </Link>
      ))}
    </div>
  );
}

function MembersPeek({ data }: any) {
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No recent members</p>;
  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((m: any) => (
        <div
          key={m.id}
          className="flex justify-between border rounded-md px-3 py-2 bg-background"
        >
          <span className="font-medium">{m.name || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">{m.role}</span>
        </div>
      ))}
    </div>
  );
}

function AnnouncementsPeek({ data }: any) {
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No announcements</p>;
  return (
    <div className="space-y-2">
      {data.slice(0, 4).map((a: any) => (
        <div
          key={a.id}
          className="border rounded-md px-3 py-2 bg-background flex justify-between"
        >
          <span className="font-medium truncate">{a.title}</span>
          {a.pin && <span className="text-xs text-primary">📌</span>}
        </div>
      ))}
    </div>
  );
}

function SnapshotCard({ data, label, unit }: any) {
  if (!data) return <p className="text-sm text-muted-foreground">No data</p>;
  const val = Object.values(data)[1] ?? 0;
  return (
    <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-background">
      <span className="font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">
        {unit}
        {val}
      </span>
    </div>
  );
}

function PeekTable({ title, href }: any) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium" variant="default">
          {title}
        </Label>
        <Link
          href={href}
          className="text-xs inline-flex items-center gap-1 underline underline-offset-4 hover:no-underline"
        >
          View all <ChevronRight size={14} />
        </Link>
      </div>
      <div className="h-40 rounded-lg bg-muted/50 border flex items-center justify-center text-sm text-muted-foreground">
        Loading table preview...
      </div>
    </div>
  );
}
