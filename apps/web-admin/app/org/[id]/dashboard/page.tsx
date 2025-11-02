'use client';

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { DashboardSection } from '@workspace/ui/components/app/dashboard/dashboard-section';
import { DashboardSnapshotCard } from '@workspace/ui/components/app/dashboard/dashboard-snapshot-card';
import { DashboardPeekList } from '@workspace/ui/components/app/dashboard/dashboard-peek-list';
import { DashboardErrorBanner } from '@workspace/ui/components/app/dashboard/dashboard-error-banner';
import { DashboardSkeletonGrid } from '@workspace/ui/components/app/dashboard/dashboard-skeleton-grid';
import { DashboardStatPill } from '@workspace/ui/components/app/dashboard/dashboard-stat-pill';
import {
  UserPlus,
  Building2,
  Megaphone,
  Settings,
  ChevronRight,
} from 'lucide-react';

const fmt = (v?: number | string) => v ?? '—';

export default function OrgAdminDashboardPage() {
  const { id: orgId } = useParams<{ id: string }>();
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

  // ─────────────────────────── FETCH LOGIC ───────────────────────────
  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchOrgBasic(orgId));
    dispatch(fetchOrgSummary(orgId));
    dispatch(fetchDashboardConfig(orgId));
  }, [dispatch, orgId]);

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

  // ─────────────────────────── STATE ───────────────────────────
  const loading =
    !orgId ||
    basic?.status === 'loading' ||
    summary?.status === 'loading' ||
    config?.status === 'loading';

  const error = basic?.error || summary?.error || config?.error;
  const org = basic?.data;
  const widgets = useMemo(() => config?.data?.widgets ?? [], [config]);
  const tables = useMemo(() => config?.data?.tables ?? [], [config]);
  const roleCounts = summary?.data?.roleCounts;
  const unitsCount = summary?.data?.unitsCount ?? 0;
  const pendingInvites = summary?.data?.pendingInvites ?? 0;

  // ─────────────────────────── UI ───────────────────────────
  if (loading) return <DashboardSkeletonGrid count={6} />;
  if (error)
    return (
      <DashboardErrorBanner
        message={error}
        onRetry={() => {
          if (!orgId) return;
          dispatch(clearOrgCache({ orgId }));
          dispatch(fetchOrgBasic(orgId));
          dispatch(fetchOrgSummary(orgId));
          dispatch(fetchDashboardConfig(orgId));
        }}
      />
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-6 space-y-8"
    >
      {/* ─────────────── HEADER + BRANDING ─────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-candy">
            {org?.name ?? 'Organisation'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {org?.type ? `Type: ${org.type}` : '—'}
          </p>
        </div>
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

      <BrandingHeader
        coverUrl={org?.coverUrl}
        logoUrl={org?.logoUrl}
        brandColor={org?.brand_color}
        onPickCover={() => {}}
        onPickLogo={() => {}}
        onBrandColorChange={() => {}}
        uploadingCover={false}
        uploadingLogo={false}
        coverProgress={0}
        logoProgress={0}
      />

      {/* ─────────────── SUMMARY STATS ─────────────── */}
      <div className="-mt-6 px-2 sm:px-4">
        <div className="mx-auto max-w-5xl glass elev-2 rounded-xl px-4 py-3 flex flex-wrap gap-3 justify-center">
          <DashboardStatPill
            icon={<Building2 size={16} />}
            label="Units"
            value={fmt(unitsCount)}
            tone="mint"
          />
          <DashboardStatPill
            icon={<UserPlus size={16} />}
            label="Admins"
            value={fmt(roleCounts?.admin)}
            tone="purple"
          />
          <DashboardStatPill
            icon={<UserPlus size={16} />}
            label="Staff"
            value={fmt(roleCounts?.staff)}
            tone="blue"
          />
          <DashboardStatPill
            icon={<UserPlus size={16} />}
            label="Students"
            value={fmt(roleCounts?.students)}
            tone="orange"
          />
          <DashboardStatPill
            icon={<UserPlus size={16} />}
            label="Parents"
            value={fmt(roleCounts?.parent)}
            tone="pink"
          />
          <DashboardStatPill
            icon={<Megaphone size={16} />}
            label="Invites"
            value={fmt(pendingInvites)}
            tone="accent"
          />
        </div>
      </div>

      <Separator className="my-4" />

      {/* ─────────────── QUICK ACTIONS ─────────────── */}
      <DashboardSection title="Quick Actions" accent="candy">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
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
              label: 'Settings',
              icon: <Settings size={16} />,
              href: `/org/${orgId}/settings`,
            },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-2 text-sm rounded-lg border bg-background/80 px-3 py-2 overlay-sheen hover-glow hover-lift"
            >
              {a.icon}
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </DashboardSection>

      {/* ─────────────── SNAPSHOT WIDGETS ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {widgets.includes('attendance_snapshot') && (
          <DashboardSection title="Attendance Snapshot" accent="mint">
            <DashboardSnapshotCard
              label="Average Attendance"
              value={Object.values(attendanceSnapshot ?? {})[1] ?? 0}
              unit="%"
              tone="primary"
            />
          </DashboardSection>
        )}
        {widgets.includes('fees_snapshot') && (
          <DashboardSection title="Finance Snapshot" accent="orange">
            <DashboardSnapshotCard
              label="Total Paid"
              value={Object.values(feesSnapshot ?? {})[1] ?? 0}
              unit="₹"
              tone="secondary"
            />
          </DashboardSection>
        )}
      </div>

      {/* ─────────────── PEEK WIDGETS ─────────────── */}
      {widgets.includes('announcements_peek') && (
        <DashboardSection
          title="Recent Announcements"
          accent="purple"
          actionHref={`/org/${orgId}/announcements`}
        >
          <DashboardPeekList
            items={announcementsPeek}
            renderItem={(a) => (
              <div className="flex justify-between">
                <span className="font-medium truncate">{a.title}</span>
                {a.pin && <span className="text-xs text-primary">📌</span>}
              </div>
            )}
          />
        </DashboardSection>
      )}

      {widgets.includes('members_peek') && (
        <DashboardSection
          title="Recent Members"
          accent="blue"
          actionHref={`/org/${orgId}/members`}
        >
          <DashboardPeekList
            items={membersPeek}
            renderItem={(m) => (
              <div className="flex justify-between">
                <span className="font-medium">{m.name || 'Unknown'}</span>
                <span className="text-xs text-muted-foreground">{m.role}</span>
              </div>
            )}
          />
        </DashboardSection>
      )}

      {widgets.includes('units_glance') && (
        <DashboardSection
          title="Units at a glance"
          accent="mint"
          actionHref={`/org/${orgId}/units`}
        >
          <DashboardPeekList
            items={unitsGlance}
            renderItem={(u) => (
              <div className="flex justify-between">
                <span className="font-medium">{u.name}</span>
                <span className="text-xs text-muted-foreground">
                  {u.memberCount} members
                </span>
              </div>
            )}
          />
        </DashboardSection>
      )}

      {/* ─────────────── TABLE PLACEHOLDERS ─────────────── */}
      <Separator className="my-4" />
      {tables.length > 0 ? (
        <DashboardSection title="Tables" accent="candy">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tables.includes('members') && (
              <Link
                href={`/org/${orgId}/members`}
                className="rounded-xl border bg-card p-4 hover-lift hover-glow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Members</span>
                  <ChevronRight size={14} />
                </div>
                <div className="h-36 bg-muted/40 border rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  Members table preview...
                </div>
              </Link>
            )}
            {tables.includes('invites') && (
              <Link
                href={`/org/${orgId}/invites`}
                className="rounded-xl border bg-card p-4 hover-lift hover-glow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Invites</span>
                  <ChevronRight size={14} />
                </div>
                <div className="h-36 bg-muted/40 border rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  Invites table preview...
                </div>
              </Link>
            )}
          </div>
        </DashboardSection>
      ) : (
        <p className="text-sm text-muted-foreground">
          No tables configured for this role.
        </p>
      )}
    </motion.div>
  );
}