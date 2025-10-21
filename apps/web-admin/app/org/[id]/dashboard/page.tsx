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
  Check,
  X,
  ChevronRight,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------
const noop = () => {};
const fmt = (v?: number | string) => (v ?? '—');

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

  // Kick off fetches whenever orgId changes
  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchOrgBasic(orgId));
    dispatch(fetchOrgSummary(orgId));
    dispatch(fetchDashboardConfig(orgId));
  }, [dispatch, orgId]);

  const loading =
    !orgId ||
    basic?.status === 'loading' ||
    summary?.status === 'loading' ||
    config?.status === 'loading';

  const error = basic?.error || summary?.error || config?.error;

  const org = basic?.data;
  const brandColor = org?.brand_color || undefined;
  const logoUrl = org?.logoUrl || undefined; // presigned/public from API
  const coverUrl = org?.coverUrl || undefined; // presigned/public from API

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top bar: title + actions */}
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

        {/* KPI strip floating over the bottom of cover */}
        {!loading && !error ? (
          <div className="-mt-6 px-2 sm:px-4">
            <div className="mx-auto max-w-5xl glass elev-2 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
              <StatPill icon={<Building2 size={16} />} label="Units" value={fmt(unitsCount)} />
              <StatPill icon={<UserPlus size={16} />} label="Admins" value={fmt(roleCounts?.admin)} />
              <StatPill icon={<UserPlus size={16} />} label="Staff" value={fmt(roleCounts?.staff)} />
              <StatPill icon={<UserPlus size={16} />} label="Students" value={fmt(roleCounts?.students)} />
              <StatPill icon={<UserPlus size={16} />} label="Parents" value={fmt(roleCounts?.parent)} />
              <StatPill icon={<Megaphone size={16} />} label="Invites" value={fmt(pendingInvites)} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Loading / error states */}
      {loading && (
        <SkeletonGrid />
      )}
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

      {/* MAIN LAYOUT */}
      {!loading && !error && (
        <>
          {/* Row A: Quick Actions + Org Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <CardSection title="Quick Actions" actionHref={`/org/${orgId}/actions`} actionLabel="Manage">
                <QuickActions orgId={orgId!} />
              </CardSection>
            </div>
            <div className="lg:col-span-2">
              <CardSection title="Organisation Health" actionHref={`/org/${orgId}/settings`} actionLabel="Settings">
                <OrgHealthCard pendingInvites={pendingInvites} totalUnits={unitsCount} />
              </CardSection>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Row B: Activity + Approvals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CardSection title="Recent Activity" actionHref={`/org/${orgId}/activity`} actionLabel="View all">
              <ActivityTimeline orgId={orgId!} />
            </CardSection>
            <CardSection title="Awaiting Attention" actionHref={`/org/${orgId}/invites`} actionLabel="Review">
              <ApprovalsList orgId={orgId!} pendingInvites={pendingInvites} />
            </CardSection>
          </div>

          <Separator className="my-2" />

          {/* Row C: Units glance + Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CardSection title="Units at a glance" actionHref={`/org/${orgId}/units`} actionLabel="View all">
                <UnitsAtGlance orgId={orgId!} count={unitsCount} />
              </CardSection>
            </div>
            <div className="lg:col-span-1">
              <CardSection title="This month’s goals" actionHref={`/org/${orgId}/goals`} actionLabel="Manage">
                <div className="space-y-4">
                  <Goal title="Onboard new students" pct={62} />
                  <Goal title="Configure fee structure" pct={35} />
                  <Goal title="Publish first newsletter" pct={80} />
                </div>
              </CardSection>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Row D: Peek tables */}
          {tables.length > 0 ? (
            <div className="space-y-3">
              <Label variant="muted" className="text-sm font-medium">Tables</Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PeekTable title="Members" href={`/org/${orgId}/members`} />
                <PeekTable title="Invites" href={`/org/${orgId}/invites`} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tables configured for this role.</p>
          )}
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// UI Sections (composed of Label + content) to keep consistent header actions
// -----------------------------------------------------------------------------
function CardSection({
  title,
  actionHref,
  actionLabel = 'View all',
  children,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 elev-1 hover:bg-muted/30 transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <Label className="font-medium" variant="default">{title}</Label>
        {actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1 text-xs rounded-md border bg-background px-2.5 py-1 hover:bg-muted"
          >
            {actionLabel}
            <ChevronRight size={14} />
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Components used inside sections
// -----------------------------------------------------------------------------
function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
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

function ErrorBanner({ error, onRetry }: { error?: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <p className="text-destructive font-medium">Failed to load the dashboard</p>
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

function QuickActions({ orgId }: { orgId: string }) {
  const items = [
    { label: 'Invite member', icon: <UserPlus size={16} />, href: `/org/${orgId}/members/invite` },
    { label: 'Create unit', icon: <Building2 size={16} />, href: `/org/${orgId}/units/new` },
    { label: 'Send announcement', icon: <Megaphone size={16} />, href: `/org/${orgId}/announcements/new` },
    { label: 'Configure settings', icon: <Settings size={16} />, href: `/org/${orgId}/settings` },
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

function OrgHealthCard({ pendingInvites, totalUnits }: { pendingInvites: number; totalUnits: number }) {
  // naive health metric for now
  const healthScore = Math.max(20, Math.min(100, 100 - pendingInvites * 3 + totalUnits * 4));
  const barClass =
    healthScore >= 75 ? 'bg-success' : healthScore >= 50 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="space-y-3">
      <div className="h-2 rounded bg-muted/60 overflow-hidden">
        <div style={{ width: `${healthScore}%` }} className={`h-full ${barClass}`} />
      </div>
      <p className="text-sm text-muted-foreground">
        Composite score from invites, unit setup, and activity. <span className="font-medium text-foreground">{healthScore}% healthy</span>.
      </p>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="badge-teal px-2 py-1 rounded-full">{totalUnits} units</span>
        <span className="badge-yellow px-2 py-1 rounded-full">{pendingInvites} invites pending</span>
      </div>
    </div>
  );
}

function ActivityTimeline({ orgId }: { orgId: string }) {
  // Placeholder items (wire real data later)
  const items = [
    { who: 'A. Sharma', what: 'joined Staff unit', when: '2h ago', href: `/org/${orgId}/members` },
    { who: 'System', what: 'generated monthly report', when: '1d ago', href: `/org/${orgId}/reports` },
    { who: 'R. Khan', what: 'invited 5 parents', when: '3d ago', href: `/org/${orgId}/invites` },
  ];
  return (
    <div className="divide-y">
      {items.map((i, idx) => (
        <TimelineRow key={idx} who={i.who} what={i.what} when={i.when} href={i.href} />
      ))}
    </div>
  );
}

function TimelineRow({ who, what, when, href }: { who: string; what: string; when: string; href: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 py-2 hover:bg-muted/40 rounded-md px-2">
      <div className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-medium">{who}</span> {what}
        </p>
        <p className="text-xs text-muted-foreground">{when}</p>
      </div>
    </Link>
  );
}

function ApprovalsList({ orgId, pendingInvites }: { orgId: string; pendingInvites: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-background">
        <div className="text-sm">
          <p className="font-medium">Invites awaiting action</p>
          <p className="text-xs text-muted-foreground">{pendingInvites} pending</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href={`/org/${orgId}/invites`} className="inline-flex items-center gap-1 text-xs rounded-md border bg-background px-2.5 py-1 hover:bg-muted">
            Review
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-background">
        <div className="text-sm">
          <p className="font-medium">Profile completion</p>
          <p className="text-xs text-muted-foreground">Finish setup to boost health</p>
        </div>
        <Link href={`/org/${orgId}/settings`} className="inline-flex items-center gap-1 text-xs rounded-md border bg-background px-2.5 py-1 hover:bg-muted">
          Complete
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function UnitsAtGlance({ orgId, count }: { orgId: string; count: number }) {
  const items = Array.from({ length: Math.min(6, Math.max(1, count)) }).map((_, i) => ({
    name: `Unit ${i + 1}`,
    href: `/org/${orgId}/units/${i + 1}`,
    meta: `${Math.floor(Math.random() * 60) + 10} members`,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((u, i) => (
        <Link
          key={i}
          href={u.href}
          className="hover-lift overlay-sheen hover-glow rounded-lg border bg-background p-3"
        >
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{u.meta}</p>
        </Link>
      ))}
      {count === 0 && (
        <Link
          href={`/org/${orgId}/units/new`}
          className="rounded-lg border-dashed border bg-background p-3 flex items-center justify-center gap-2 text-sm hover:bg-muted"
        >
          <PlusCircle size={16} /> Create your first unit
        </Link>
      )}
    </div>
  );
}

function Goal({ title, pct }: { title: string; pct: number }) {
  return (
    <div className="space-y-1.5">
      <Label variant="default" className="text-sm">{title}</Label>
      <div className="h-2 rounded bg-muted/60 overflow-hidden">
        <div style={{ width: `${pct}%` }} className="h-full bg-grad-primary" />
      </div>
    </div>
  );
}

function PeekTable({ title, href }: { title: string; href: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium" variant="default">{title}</Label>
        <Link
          href={href}
          className="text-xs inline-flex items-center gap-1 underline underline-offset-4 hover:no-underline"
        >
          View all <ChevronRight size={14} />
        </Link>
      </div>

      <div className="h-40 rounded-lg bg-muted/50 border">
        {/* Faux table header */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground px-3 py-2 border-b">
          <span>Name</span>
          <span>Role</span>
          <span>Updated</span>
        </div>
        {/* Faux rows */}
        <div className="p-3 space-y-2">
          {[0,1,2].map(i => (
            <div key={i} className="grid grid-cols-3 gap-2 text-sm">
              <div className="h-6 rounded bg-background/60 border" />
              <div className="h-6 rounded bg-background/60 border" />
              <div className="h-6 rounded bg-background/60 border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
