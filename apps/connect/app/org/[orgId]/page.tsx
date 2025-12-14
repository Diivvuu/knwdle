'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import {
  fetchConnectHero,
  fetchConnectSummary,
  fetchConnectTimetable,
  fetchConnectAnnouncements,
  fetchConnectConfig,
  selectConnectHero,
  selectConnectSummary,
  selectConnectTimetable,
  selectConnectAnnouncements,
  selectConnectConfig,
  selectConnectLoading,
  fetchOrgAudiences,
  selectOrgAudiences,
} from '@workspace/state';

import { DashboardSection } from '@workspace/ui/components/app/dashboard/dashboard-section';
import { DashboardSnapshotCard } from '@workspace/ui/components/app/dashboard/dashboard-snapshot-card';
import { DashboardPeekList } from '@workspace/ui/components/app/dashboard/dashboard-peek-list';
import { DashboardErrorBanner } from '@workspace/ui/components/app/dashboard/dashboard-error-banner';
import { DashboardSkeletonGrid } from '@workspace/ui/components/app/dashboard/dashboard-skeleton-grid';
import { Separator } from '@workspace/ui/components/separator';
import { CheckCircle2, Bell, CalendarDays, Building2 } from 'lucide-react';

export default function OrgConnectDashboardPage() {
  const { orgId } = useParams() as { orgId: string };
  const dispatch = useDispatch<AppDispatch>();

  const hero = useSelector(selectConnectHero);
  const summary = useSelector(selectConnectSummary);
  const timetable = useSelector(selectConnectTimetable);
  const announcements = useSelector(selectConnectAnnouncements);
  const config = useSelector(selectConnectConfig);
  const loading = useSelector(selectConnectLoading);
  const audiences = useSelector(selectOrgAudiences);

  useEffect(() => {
    if (orgId) {
      Promise.all([
        dispatch(fetchConnectHero(orgId)),
        dispatch(fetchConnectSummary(orgId)),
        dispatch(fetchConnectTimetable(orgId)),
        dispatch(fetchConnectAnnouncements(orgId)),
        dispatch(fetchConnectConfig(orgId)),
        dispatch(fetchOrgAudiences(orgId)),
      ]).catch(() => toast.error('Failed to load dashboard'));
    }
  }, [orgId, dispatch]);

  // ─────────────── LOADING / ERROR ───────────────
  if (loading) return <DashboardSkeletonGrid count={6} />;
  if (!hero)
    return (
      <DashboardErrorBanner message="Unable to load organisation details." />
    );

  const widgets = config?.widgets ?? [];

  // ─────────────── RENDERER ───────────────
  const renderWidget = (key: string) => {
    switch (key) {
      case 'attendance_summary':
        return (
          <DashboardSnapshotCard
            label="Attendance"
            value={`${summary?.attendance?.avgRate ?? 0}%`}
            // tone="primary"
          />
        );

      case 'fees_summary':
        return (
          <DashboardSnapshotCard
            label="Fees Paid"
            value={`₹${summary?.fees?.totalPaid ?? 0}`}
            // tone="secondary"
          />
        );

      case 'results_summary':
        return (
          <DashboardSnapshotCard
            label="Results"
            value={`${summary?.results?.avgScore ?? '--'}%`}
            // tone="accent"
          />
        );

      case 'timetable_today':
        return (
          <DashboardSection title="Today’s Timetable" accent="mint">
            {timetable.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No classes scheduled for today.
              </p>
            ) : (
              <DashboardPeekList
                items={timetable}
                renderItem={(t: any) => (
                  <div className="flex justify-between text-sm">
                    <span>{t.subject || '—'}</span>
                    <span className="text-muted-foreground">
                      {t.startTime} – {t.endTime}
                    </span>
                  </div>
                )}
              />
            )}
          </DashboardSection>
        );

      case 'achievements_peek':
        return (
          <DashboardSection
            title="Achievements"
            // accent="orange"
            actionHref={`/org/${orgId}/achievements`}
          >
            {summary?.achievements?.length ? (
              <DashboardPeekList
                items={summary.achievements}
                renderItem={(a: any) => (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      {a.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {a.date}
                    </span>
                  </div>
                )}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent achievements.
              </p>
            )}
          </DashboardSection>
        );

      case 'announcements_peek':
        return (
          <DashboardSection
            title="Announcements"
            // accent="candy"
            actionHref={`/org/${orgId}/announcements`}
          >
            <DashboardPeekList
              items={announcements}
              renderItem={(a: any) => (
                <div className="flex justify-between">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            />
          </DashboardSection>
        );

      default:
        return null;
    }
  };

  // ─────────────── UNITS SECTION ───────────────
  const renderAudiencesSection = () => {
    console.log(audiences);
    if (!audiences || audiences.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No organisational audiences found.
        </p>
      );
    }

    return (
      <DashboardSection title="Audiences in this Organisation" accent="blue">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {audiences.map((u: any) => (
            <Link
              key={u.id}
              href={`http://localhost:3001/org/${orgId}/audience/${u.id}`}
              className="hover-lift overlay-sheen rounded-lg border bg-background/80 p-3 flex items-center justify-between hover:bg-muted/50 transition-all"
            >
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {u.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{u.type}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {u._count?.members ?? 0} members
              </span>
            </Link>
          ))}
        </div>
      </DashboardSection>
    );
  };

  // ─────────────── LAYOUT ───────────────
  return (
    <motion.div
      className="min-h-screen bg-background px-6 py-8 custom-scroll container mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gradient-candy">
          {hero.org.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enrolled Audience: {hero.audience?.name || '—'} ({hero.audience?.type}
          )
        </p>
      </motion.div>

      {/* UNITS */}
      {renderAudiencesSection()}

      <Separator className="my-6" />

      {/* WIDGETS */}
      <div className="space-y-6">
        {widgets.map((key: any) => (
          <div key={key}>{renderWidget(key)}</div>
        ))}
      </div>
    </motion.div>
  );
}
