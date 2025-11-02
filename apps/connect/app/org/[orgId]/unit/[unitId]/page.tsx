'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  fetchUnitDashboardConfig,
  fetchUnitHero,
  fetchUnitSummary,
  fetchUnitTimetableToday,
  fetchUnitAnnouncements,
  fetchUnitAssignments,
  fetchUnitTests,
  fetchUnitFees,
  selectUnitDashboardConfig,
  selectUnitHero,
  selectUnitSummary,
  selectUnitTimetable,
  selectUnitAnnouncements,
  selectUnitAssignments,
  selectUnitTests,
  selectUnitFees,
  selectUnitDashboardStatus,
  selectUnitDashboardError,
} from '@workspace/state';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { DashboardSection } from '@workspace/ui/components/app/dashboard/dashboard-section';
import { DashboardSnapshotCard } from '@workspace/ui/components/app/dashboard/dashboard-snapshot-card';
import { DashboardPeekList } from '@workspace/ui/components/app/dashboard/dashboard-peek-list';
import { DashboardErrorBanner } from '@workspace/ui/components/app/dashboard/dashboard-error-banner';
import { DashboardSkeletonGrid } from '@workspace/ui/components/app/dashboard/dashboard-skeleton-grid';
import { toast } from 'sonner';
import { Separator } from '@workspace/ui/components/separator';
import { Award, CalendarDays, FileCheck, FlaskConical, BookOpen, Bell } from 'lucide-react';

export default function UnitDashboardPage() {
  const { orgId, unitId } = useParams() as { orgId: string; unitId: string };
  const dispatch = useDispatch<AppDispatch>();

  const config = useSelector(selectUnitDashboardConfig);
  const hero = useSelector(selectUnitHero);
  const summary = useSelector(selectUnitSummary);
  const timetable = useSelector(selectUnitTimetable);
  const announcements = useSelector(selectUnitAnnouncements);
  const assignments = useSelector(selectUnitAssignments);
  const tests = useSelector(selectUnitTests);
  const fees = useSelector(selectUnitFees);
  const status = useSelector(selectUnitDashboardStatus);
  const error = useSelector(selectUnitDashboardError);

  // ────────────────────── Fetch Data ──────────────────────
  useEffect(() => {
    if (orgId && unitId) {
      Promise.all([
        dispatch(fetchUnitDashboardConfig({ orgId, unitId })),
        dispatch(fetchUnitHero({ orgId, unitId })),
        dispatch(fetchUnitSummary({ orgId, unitId })),
        dispatch(fetchUnitTimetableToday({ orgId, unitId })),
        dispatch(fetchUnitAnnouncements({ orgId, unitId })),
        dispatch(fetchUnitAssignments({ orgId, unitId })),
        dispatch(fetchUnitTests({ orgId, unitId })),
        dispatch(fetchUnitFees({ orgId, unitId })),
      ]).catch(() => toast.error('Failed to load unit dashboard'));
    }
  }, [orgId, unitId, dispatch]);

  // ────────────────────── Loading / Error ──────────────────────
  if (status === 'loading') return <DashboardSkeletonGrid count={6} />;
  if (error) return <DashboardErrorBanner message={error} />;
  if (!hero)
    return (
      <DashboardErrorBanner message="Unable to load unit details." />
    );

  const widgets = config?.widgets ?? [];

  // ────────────────────── Widget Renderer ──────────────────────
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

      case 'results_summary':
        return (
          <DashboardSnapshotCard
            label="Results"
            value={summary?.results?.count ?? 0}
            // tone="accent"
          />
        );

      case 'assignments_due':
        return (
          <DashboardSection
            title="Assignments Due"
            // accent="purple"
            actionHref={`/org/${orgId}/unit/${unitId}/assignments`}
          >
            <DashboardPeekList
              items={assignments}
              renderItem={(a : any) => (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 text-purple-500" />
                    {a.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.dueAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              emptyText="No pending assignments."
            />
          </DashboardSection>
        );

      case 'tests_due':
        return (
          <DashboardSection
            title="Upcoming Tests"
            accent="mint"
            actionHref={`/org/${orgId}/unit/${unitId}/tests`}
          >
            <DashboardPeekList
              items={tests}
              renderItem={(t : any) => (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-green-500" />
                    {t.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.dueAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              emptyText="No upcoming tests."
            />
          </DashboardSection>
        );

      case 'fees_summary':
        return (
          <DashboardSection title="Fees Summary"
            // accent="orange"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DashboardSnapshotCard
                label="Paid"
                value={`₹${fees?.totalPaid ?? 0}`}
                // tone="secondary"
              />
              <DashboardSnapshotCard
                label="Due"
                value={`₹${fees?.totalDue ?? 0}`}
                // tone="purple"
              />
              <DashboardSnapshotCard
                label="Overdue"
                value={fees?.overdueCount ?? 0}
                // tone="candy"
              />
            </div>
          </DashboardSection>
        );

      case 'timetable_today':
        return (
          <DashboardSection title="Today's Timetable" accent="mint">
            <DashboardPeekList
              items={timetable}
              renderItem={(t : any) => (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                    {t.subject?.name ?? '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.startTime} – {t.endTime}
                  </span>
                </div>
              )}
              emptyText="No classes scheduled for today."
            />
          </DashboardSection>
        );

      case 'announcements_peek':
        return (
          <DashboardSection
            title="Announcements"
            // accent="candy"
            actionHref={`/org/${orgId}/unit/${unitId}/announcements`}
          >
            <DashboardPeekList
              items={announcements}
              renderItem={(a: any) => (
                <div className="flex justify-between">
                  <span className="font-medium flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-orange-500" />
                    {a.title}
                  </span>
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

  // ────────────────────── Render Layout ──────────────────────
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
        <h1 className="text-3xl font-bold text-gradient-primary">
          {hero.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {hero.type} • {hero._count?.members ?? 0} Members
        </p>
      </motion.div>

      {/* DYNAMIC WIDGETS */}
      <div className="space-y-6">
        {widgets.map((key: any) => (
          <div key={key}>{renderWidget(key)}</div>
        ))}
      </div>
    </motion.div>
  );
}