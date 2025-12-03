'use client';

import { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Building2,
  Megaphone,
  Settings,
  UserPlus,
  ChevronRight,
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
  fetchDashboardConfig,
  fetchUnitsGlance,
  fetchMembersPeek,
  fetchAnnouncementsPeek,
  fetchAttendanceSnapshot,
  fetchFeesSnapshot,
  clearOrgCache,
  selectOrgMembers,
  selectOrgMembersStatus,
  fetchOrgMembers,
} from '@workspace/state';

import type { ComponentProps } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';

// ✅ infer SectionNode type from DashboardShell props
type SectionNode = NonNullable<
  ComponentProps<typeof DashboardShell>['sections']
>[number];

export default function OrgAdminDashboardPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  /* ─────────────── SELECTORS ─────────────── */
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
    orgId ? (s.orgAdmin.unitsGlanceById[orgId]?.data ?? []) : []
  );
  const membersPeek = useSelector((s: RootState) =>
    orgId ? (s.orgAdmin.membersPeekById[orgId]?.data ?? []) : []
  );
  const fullMembers = useSelector(selectOrgMembers);

  const membersStatus = useSelector(selectOrgMembersStatus);

  const announcementsPeek = useSelector((s: RootState) =>
    orgId ? (s.orgAdmin.announcementsPeekById[orgId]?.data ?? []) : []
  );
  const attendanceSnapshot = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.attendanceSnapshotById[orgId]?.data : undefined
  );
  const feesSnapshot = useSelector((s: RootState) =>
    orgId ? s.orgAdmin.feesSnapshotById[orgId]?.data : undefined
  );

  /* ─────────────── FETCH LOGIC ─────────────── */
  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchOrgBasic(orgId));
    dispatch(fetchOrgSummary(orgId));
    dispatch(fetchDashboardConfig(orgId));
  }, [dispatch, orgId]);

  useEffect(() => {
    if (!orgId || !config?.data) return;
    const widgets = config.data.widgets ?? [];

    if (widgets.includes('units_glance')) dispatch(fetchUnitsGlance(orgId));
    if (widgets.includes('members_peek')) dispatch(fetchMembersPeek(orgId));
    if (widgets.includes('announcements_peek'))
      dispatch(fetchAnnouncementsPeek(orgId));
    if (widgets.includes('attendance_snapshot'))
      dispatch(fetchAttendanceSnapshot(orgId));
    if (widgets.includes('fees_snapshot')) dispatch(fetchFeesSnapshot(orgId));
    if (tables.includes('members'))
      dispatch(fetchOrgMembers({ orgId, limit: 25 }));
  }, [dispatch, orgId, config?.data]);

  /* ─────────────── STATE HANDLING ─────────────── */
  const loading =
    !orgId ||
    basic?.status === 'loading' ||
    summary?.status === 'loading' ||
    config?.status === 'loading';

  const error = basic?.error || summary?.error || config?.error || null;
  const org = basic?.data;
  const widgets = useMemo(() => config?.data?.widgets ?? [], [config]);
  const tables = useMemo(() => config?.data?.tables ?? [], [config]);

  const roleCounts = summary?.data?.roleCounts ?? {
    admin: 0,
    staff: 0,
    students: 0,
    parent: 0,
  };
  const unitsCount = summary?.data?.unitsCount ?? 0;
  const pendingInvites = summary?.data?.pendingInvites ?? 0;

  /* ─────────────── UI ─────────────── */
  return (
    <DashboardShell
      loading={loading}
      error={error}
      onRetry={() => {
        if (!orgId) return;
        dispatch(clearOrgCache({ orgId }));
        dispatch(fetchOrgBasic(orgId));
        dispatch(fetchOrgSummary(orgId));
        dispatch(fetchDashboardConfig(orgId));
      }}
      header={
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {org?.name ?? 'Organisation'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {org?.type ? `Type: ${org.type}` : '—'}
          </p>
        </div>
      }
      actions={
        <div className="flex gap-2">
          <Link
            href={`/org/${orgId}/members/invite`}
            className="btn btn-outline text-sm flex items-center gap-1"
          >
            <UserPlus size={16} />
            Invite
          </Link>
          <Link
            href={`/org/${orgId}/settings`}
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
              <DashboardSection title="Summary" className="crayon-card">
                <div className="mx-auto max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 py-3 px-2">
                  {[
                    {
                      label: 'Units',
                      value: unitsCount,
                      tone: 'mint',
                      icon: <Building2 className="size-4" />,
                    },
                    {
                      label: 'Admins',
                      value: roleCounts.admin ?? '—',
                      tone: 'lavender',
                      icon: <UserPlus className="size-4" />,
                    },
                    {
                      label: 'Staff',
                      value: roleCounts.staff ?? '—',
                      tone: 'blue',
                      icon: <UserPlus className="size-4" />,
                    },
                    {
                      label: 'Students',
                      value: roleCounts.students ?? '—',
                      tone: 'honey',
                      icon: <UserPlus className="size-4" />,
                    },
                    {
                      label: 'Parents',
                      value: roleCounts.parent ?? '—',
                      tone: 'peach',
                      icon: <UserPlus className="size-4" />,
                    },
                    {
                      label: 'Invites',
                      value: pendingInvites,
                      tone: 'blue',
                      icon: <Megaphone className="size-4" />,
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardSection>
            ),
          },

          /* ─────────────── SNAPSHOTS ─────────────── */
          // Always render all widgets, even if no data
          ...['attendance_snapshot', 'fees_snapshot'].map((widget) => {
            if (widget === 'attendance_snapshot') {
              return {
                id: 'attendance',
                node: (
                  <DashboardSection
                    title="Attendance Snapshot"
                    accent="mint"
                    className="widget-attendance crayon-card"
                  >
                    {loading ? (
                      <div className="w-full h-16 flex items-center justify-center animate-pulse text-muted-foreground/60">
                        <span>Loading...</span>
                      </div>
                    ) : attendanceSnapshot &&
                      typeof attendanceSnapshot.avgRate === 'number' ? (
                      <SnapshotMetric
                        label="Average Attendance"
                        value={attendanceSnapshot.avgRate}
                        unit="%"
                        tone="mint"
                      />
                    ) : (
                      <div className="w-full h-16 flex items-center justify-center text-muted-foreground/60">
                        <span>No data available</span>
                      </div>
                    )}
                  </DashboardSection>
                ),
              };
            }
            if (widget === 'fees_snapshot') {
              return {
                id: 'finance',
                node: (
                  <DashboardSection
                    title="Finance Snapshot"
                    accent="honey"
                    className="widget-finance crayon-card"
                  >
                    {loading ? (
                      <div className="w-full h-16 flex items-center justify-center animate-pulse text-muted-foreground/60">
                        <span>Loading...</span>
                      </div>
                    ) : feesSnapshot &&
                      typeof feesSnapshot.totalPaid === 'number' ? (
                      <SnapshotMetric
                        label="Total Paid"
                        value={feesSnapshot.totalPaid}
                        unit="₹"
                        tone="honey"
                      />
                    ) : (
                      <div className="w-full h-16 flex items-center justify-center text-muted-foreground/60">
                        <span>No data available</span>
                      </div>
                    )}
                  </DashboardSection>
                ),
              };
            }
            return null;
          }),

          /* ─────────────── WIDGETS ─────────────── */
          // Always render all widgets (even if empty)
          ...['announcements_peek', 'members_peek', 'units_glance'].map(
            (widget) => {
              if (widget === 'announcements_peek') {
                return {
                  id: 'announcements',
                  colSpan: 2,
                  node: (
                    <DashboardSection
                      title="Recent Announcements"
                      actionHref={`/org/${orgId}/announcements`}
                      className="widget-announcements crayon-card"
                    >
                      {loading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((k) => (
                            <div
                              key={k}
                              className="h-6 bg-muted/50 rounded animate-pulse"
                            />
                          ))}
                        </div>
                      ) : announcementsPeek.length > 0 ? (
                        <DashboardList
                          items={announcementsPeek}
                          renderItem={(a: any) => (
                            <div className="flex justify-between">
                              <span className="font-medium truncate">
                                {a.title}
                              </span>
                              {a.pin && (
                                <span className="text-xs text-primary">📌</span>
                              )}
                            </div>
                          )}
                        />
                      ) : (
                        <div className="w-full text-center text-muted-foreground/60 py-6">
                          No data available
                        </div>
                      )}
                    </DashboardSection>
                  ),
                };
              }
              if (widget === 'members_peek') {
                return {
                  id: 'members',
                  node: (
                    <DashboardSection
                      title="Recent Members"
                      actionHref={`/org/${orgId}/members`}
                      className="widget-members crayon-card"
                    >
                      {loading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((k) => (
                            <div
                              key={k}
                              className="h-6 bg-muted/50 rounded animate-pulse"
                            />
                          ))}
                        </div>
                      ) : membersPeek.length > 0 ? (
                        <DashboardList
                          items={membersPeek}
                          renderItem={(m: any) => (
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {m.user?.name ||
                                  m.user?.email ||
                                  m.name ||
                                  'Unknown'}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {m.role}
                              </span>
                            </div>
                          )}
                        />
                      ) : (
                        <div className="w-full text-center text-muted-foreground/60 py-6">
                          No data available
                        </div>
                      )}
                    </DashboardSection>
                  ),
                };
              }
              if (widget === 'units_glance') {
                return {
                  id: 'units',
                  colSpan: 3,
                  node: (
                    <DashboardSection
                      title="Units at a glance"
                      actionHref={`/org/${orgId}/units`}
                      className="widget-units crayon-card"
                    >
                      {loading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((k) => (
                            <div
                              key={k}
                              className="h-6 bg-muted/50 rounded animate-pulse"
                            />
                          ))}
                        </div>
                      ) : unitsGlance.length > 0 ? (
                        <DashboardList
                          items={unitsGlance}
                          renderItem={(u: any) => (
                            <div className="flex justify-between">
                              <span className="font-medium">{u.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {u.memberCount} members
                              </span>
                            </div>
                          )}
                        />
                      ) : (
                        <div className="w-full text-center text-muted-foreground/60 py-6">
                          No data available
                        </div>
                      )}
                    </DashboardSection>
                  ),
                };
              }
              return null;
            }
          ),

          /* ─────────────── TABLE PLACEHOLDERS ─────────────── */
          // Always render all tables from config.data.tables, even if empty
          {
            id: 'tables',
            colSpan: 3,
            node: (
              <DashboardSection title="Tables" className="crayon-card">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => {
                    if (table === 'members') {
                      return (
                        <div
                          key={table}
                          className="rounded-xl border bg-card p-4 crayon-card hover-lift hover-glow transition"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium capitalize">
                              Members
                            </span>
                            <Link
                              href={`/org/${orgId}/members`}
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              View all <ChevronRight size={14} />
                            </Link>
                          </div>

                          <div className="overflow-hidden rounded-lg border border-border/30 bg-background/50 backdrop-blur-sm">
                            <Table>
                              <TableHeader className="bg-muted/50 text-muted-foreground">
                                <TableRow>
                                  <TableHead className="w-1/3 py-2 px-3 text-left">
                                    Name
                                  </TableHead>
                                  <TableHead className="w-1/3 py-2 px-3 text-left">
                                    Email
                                  </TableHead>
                                  <TableHead className="w-1/3 py-2 px-3 text-left">
                                    Role
                                  </TableHead>
                                </TableRow>
                              </TableHeader>

                              <TableBody>
                                {membersStatus === 'loading' ? (
                                  [...Array(3)].map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                      <TableCell className="py-2 px-3">
                                        <div className="h-4 w-24 bg-muted/40 rounded" />
                                      </TableCell>
                                      <TableCell className="py-2 px-3">
                                        <div className="h-4 w-32 bg-muted/40 rounded" />
                                      </TableCell>
                                      <TableCell className="py-2 px-3">
                                        <div className="h-4 w-16 bg-muted/40 rounded" />
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : fullMembers && fullMembers.length > 0 ? (
                                  fullMembers.slice(0, 5).map((m: any) => (
                                    <TableRow
                                      key={m.id}
                                      className="hover:bg-muted/20 transition-colors"
                                    >
                                      <TableCell className="py-2 px-3">
                                        {m.name || '—'}
                                      </TableCell>
                                      <TableCell className="py-2 px-3">
                                        {m.email || '—'}
                                      </TableCell>
                                      <TableCell className="py-2 px-3 capitalize">
                                        {m.role}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell
                                      colSpan={3}
                                      className="py-4 text-center text-muted-foreground/60"
                                    >
                                      No members found
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    }
                    // Other tables: Always render placeholder
                    return (
                      <Link
                        key={table}
                        href={`/org/${orgId}/${table}`}
                        className="rounded-xl border bg-card p-4 hover-lift hover-glow transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">
                            {table}
                          </span>
                          <ChevronRight size={14} />
                        </div>
                        <div className="h-28 bg-muted/40 border rounded-lg flex flex-col items-center justify-center text-sm text-muted-foreground">
                          <div className="w-4/5 h-4 bg-muted/50 rounded mb-2 animate-pulse" />
                          <div className="w-3/5 h-4 bg-muted/50 rounded mb-2 animate-pulse" />
                          <div className="w-2/5 h-4 bg-muted/30 rounded animate-pulse" />
                          <div className="mt-2 text-xs text-muted-foreground/60">
                            No data available
                          </div>
                        </div>
                      </Link>
                    );
                  })}
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
