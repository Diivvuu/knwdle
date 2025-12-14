'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  ChevronRight,
  Award,
  UserCheck,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { RootState, AppDispatch } from '@/store/store';

import { DashboardShell } from '@workspace/ui/components/app/dashboard/dashboard-shell';
import { DashboardSection } from '@workspace/ui/components/app/dashboard/dashboard-section';
import { DashboardList } from '@workspace/ui/components/app/dashboard/dashboard-list';
import { SnapshotMetric } from '@workspace/ui/components/app/dashboard/dashboard-card';

import {
  fetchOrgBasic,
  fetchOrgSummary,
  clearOrgCache,
} from '@workspace/state';

import type { ComponentProps } from 'react';

// ✅ infer SectionNode type from DashboardShell props
type SectionNode = NonNullable<
  ComponentProps<typeof DashboardShell>['sections']
>[number];

// Mock data functions for class-specific data
const mockClassData = {
  basic: {
    name: 'Class 12A',
    academicYear: '2024-2025',
    classTeacher: 'Ms. Sharma',
  },
  summary: {
    totalStudents: 42,
    presentToday: 38,
    assignmentsDue: 3,
    averagePerformance: 78.5,
    subjectsCount: 8,
    teachersCount: 5,
  },
  attendanceSnapshot: {
    monthlyRate: 92.5,
    presentCount: 38,
    absentCount: 4,
  },
  performanceSnapshot: {
    classAverage: 78.5,
    topScore: 95,
    lowestScore: 62,
  },
  upcomingEvents: [
    { id: 1, title: 'Maths Audience Test', date: 'Dec 15', type: 'exam' },
    {
      id: 2,
      title: 'Science Project Submission',
      date: 'Dec 18',
      type: 'assignment',
    },
    { id: 3, title: 'Parent-Teacher Meeting', date: 'Dec 20', type: 'meeting' },
  ],
  recentActivities: [
    { id: 1, title: 'Physics Assignment Graded', time: '2h ago' },
    { id: 2, title: 'Chemistry Lab Completed', time: '1d ago' },
    { id: 3, title: 'English Essay Submitted', time: '2d ago' },
  ],
  studentsPeek: [
    {
      id: 1,
      name: 'Rahul Kumar',
      rollNumber: '1',
      attendanceStatus: 'present',
    },
    {
      id: 2,
      name: 'Priya Singh',
      rollNumber: '2',
      attendanceStatus: 'present',
    },
    { id: 3, name: 'Amit Patel', rollNumber: '3', attendanceStatus: 'absent' },
  ],
};

export default function ClassDashboardPage() {
  const { id: orgId, audienceId: classId } = useParams<{
    id: string;
    audienceId: string;
  }>();
  const dispatch = useDispatch<AppDispatch>();

  /* ─────────────── SELECTORS ─────────────── */
  // Using existing selectors from your state
  const basic = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.basicById[orgId] : undefined
  );

  // For class data, we'll use mock data initially
  const classBasic = mockClassData.basic;
  const classSummary = mockClassData.summary;
  const classAttendanceSnapshot = mockClassData.attendanceSnapshot;
  const classPerformanceSnapshot = mockClassData.performanceSnapshot;
  const classUpcomingEvents = mockClassData.upcomingEvents;
  const classRecentActivities = mockClassData.recentActivities;
  const classStudentsPeek = mockClassData.studentsPeek;

  /* ─────────────── FETCH LOGIC ─────────────── */
  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchOrgBasic(orgId));
    dispatch(fetchOrgSummary(orgId));
  }, [dispatch, orgId]);

  /* ─────────────── STATE HANDLING ─────────────── */
  const loading = !orgId;

  const org = basic?.data;

  // Class-specific summary data
  const summaryData = classSummary;

  /* ─────────────── UI ─────────────── */
  return (
    <DashboardShell
      loading={loading}
      error={null}
      onRetry={() => {
        if (!orgId) return;
        dispatch(clearOrgCache({ orgId }));
        dispatch(fetchOrgBasic(orgId));
        dispatch(fetchOrgSummary(orgId));
      }}
      header={
        <div>
          <h1 className="text-2xl font-bold text-foreground ">
            {classBasic.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {classBasic.academicYear
              ? `Academic Year: ${classBasic.academicYear}`
              : '—'}
            {classBasic.classTeacher &&
              ` • Class Teacher: ${classBasic.classTeacher}`}
            {org?.name && ` • School: ${org.name}`}
          </p>
        </div>
      }
      actions={
        <div className="flex gap-2">
          <Link
            href={`/org/${orgId}/audience/${classId}/attendance`}
            className="btn btn-outline text-sm flex items-center gap-1"
          >
            <UserCheck size={16} />
            Attendance
          </Link>
          <Link
            href={`/org/${orgId}/audience/${classId}/settings`}
            className="btn btn-outline text-sm flex items-center gap-1"
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>
      }
      sections={
        [
          /* ─────────────── SUMMARY ─────────────── */
          {
            id: 'summary',
            colSpan: 3,
            node: (
              <DashboardSection title="Class Summary" className="crayon-card">
                <div className="mx-auto max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 py-3 px-2">
                  {[
                    {
                      label: 'Total Students',
                      value: summaryData.totalStudents,
                      tone: 'blue',
                      icon: <Users className="size-4" />,
                    },
                    {
                      label: 'Present Today',
                      value: summaryData.presentToday,
                      tone: 'mint',
                      icon: <UserCheck className="size-4" />,
                    },
                    {
                      label: 'Assignments Due',
                      value: summaryData.assignmentsDue,
                      tone: 'peach',
                      icon: <FileText className="size-4" />,
                    },
                    {
                      label: 'Avg Performance',
                      value: summaryData.averagePerformance,
                      tone: 'honey',
                      icon: <BarChart3 className="size-4" />,
                      audience: '%',
                    },
                    {
                      label: 'Subjects',
                      value: summaryData.subjectsCount,
                      tone: 'lavender',
                      icon: <BookOpen className="size-4" />,
                    },
                    {
                      label: 'Teachers',
                      value: summaryData.teachersCount,
                      tone: 'blue',
                      icon: <Award className="size-4" />,
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card/80 to-background/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-[2px] crayon-card"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex flex-col items-center justify-center py-5 text-center">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground/80">
                          {stat.icon}
                          <span className="text-sm font-medium tracking-wide">
                            {stat.label}
                          </span>
                        </div>
                        <div className="text-3xl font-semibold text-foreground/90 tracking-tight">
                          {stat.value}
                          {stat.audience && (
                            <span className="text-sm ml-1">
                              {stat.audience}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardSection>
            ),
          },

          /* ─────────────── SNAPSHOTS ─────────────── */
          {
            id: 'attendance',
            node: (
              <DashboardSection
                title="Attendance Overview"
                accent="mint"
                className="widget-attendance crayon-card"
              >
                <div className="space-y-3">
                  <SnapshotMetric
                    label="This Month"
                    value={classAttendanceSnapshot.monthlyRate}
                    audience="%"
                    tone="mint"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Present: {classAttendanceSnapshot.presentCount}</span>
                    <span>Absent: {classAttendanceSnapshot.absentCount}</span>
                  </div>
                </div>
              </DashboardSection>
            ),
          },
          {
            id: 'performance',
            node: (
              <DashboardSection
                title="Performance Snapshot"
                accent="honey"
                className="widget-performance crayon-card"
              >
                <div className="space-y-3">
                  <SnapshotMetric
                    label="Class Average"
                    value={classPerformanceSnapshot.classAverage}
                    audience="%"
                    tone="honey"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Top: {classPerformanceSnapshot.topScore}%</span>
                    <span>Low: {classPerformanceSnapshot.lowestScore}%</span>
                  </div>
                </div>
              </DashboardSection>
            ),
          },

          /* ─────────────── WIDGETS ─────────────── */
          {
            id: 'events',
            colSpan: 2,
            node: (
              <DashboardSection
                title="Upcoming Events"
                actionHref={`/org/${orgId}/audience/${classId}/events`}
                className="widget-events crayon-card"
              >
                <DashboardList
                  items={classUpcomingEvents}
                  renderItem={(event: any) => (
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium block">{event.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {event.date}
                        </span>
                      </div>
                      {event.type && (
                        <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
                          {event.type}
                        </span>
                      )}
                    </div>
                  )}
                />
              </DashboardSection>
            ),
          },
          {
            id: 'activities',
            node: (
              <DashboardSection
                title="Recent Activities"
                actionHref={`/org/${orgId}/audience/${classId}/activities`}
                className="widget-activities crayon-card"
              >
                <DashboardList
                  items={classRecentActivities}
                  renderItem={(activity: any) => (
                    <div className="flex justify-between">
                      <span className="font-medium truncate">
                        {activity.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  )}
                />
              </DashboardSection>
            ),
          },
          {
            id: 'students',
            colSpan: 3,
            node: (
              <DashboardSection
                title="Students Overview"
                actionHref={`/org/${orgId}/audience/${classId}/students`}
                className="widget-students crayon-card"
              >
                <DashboardList
                  items={classStudentsPeek}
                  renderItem={(student: any) => (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{student.name}</span>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Roll: {student.rollNumber}</span>
                        <span>•</span>
                        <span className="capitalize">
                          {student.attendanceStatus}
                        </span>
                      </div>
                    </div>
                  )}
                />
              </DashboardSection>
            ),
          },

          /* ─────────────── QUICK ACCESS ─────────────── */
          {
            id: 'quick-access',
            colSpan: 3,
            node: (
              <DashboardSection title="Quick Access" className="crayon-card">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      key: 'students',
                      title: 'Students List',
                      href: `/org/${orgId}/audience/${classId}/students`,
                      icon: <Users className="size-4" />,
                    },
                    {
                      key: 'attendance',
                      title: 'Attendance Records',
                      href: `/org/${orgId}/audience/${classId}/attendance`,
                      icon: <UserCheck className="size-4" />,
                    },
                    {
                      key: 'assignments',
                      title: 'Assignments',
                      href: `/org/${orgId}/audience/${classId}/assignments`,
                      icon: <FileText className="size-4" />,
                    },
                    {
                      key: 'timetable',
                      title: 'Class Timetable',
                      href: `/org/${orgId}/audience/${classId}/timetable`,
                      icon: <Calendar className="size-4" />,
                    },
                    {
                      key: 'performance',
                      title: 'Performance Reports',
                      href: `/org/${orgId}/audience/${classId}/performance`,
                      icon: <BarChart3 className="size-4" />,
                    },
                    {
                      key: 'notices',
                      title: 'Class Notices',
                      href: `/org/${orgId}/audience/${classId}/notices`,
                      icon: <Award className="size-4" />,
                    },
                  ].map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="rounded-xl border bg-card p-4 hover-lift hover-glow transition crayon-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground"
                        />
                      </div>
                      <div className="h-20 bg-muted/20 border rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground/60 mb-1">
                            Quick Access
                          </div>
                          <div className="w-16 h-1 bg-muted/30 rounded-full mx-auto" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </DashboardSection>
            ),
          },
        ]
          .flat()
          .filter(Boolean) as SectionNode[]
      }
    />
  );
}
