import { UnitDashRange } from '../../domain/org.unit.dashboard.schema';
import { OrgType, OrgUnitType, ParentRole } from '../../generated/prisma';
import { forbidden, notFound } from '../../lib/https';
import { computeUnitFeatures } from '../../lib/org.unit.rules';
import { PERMISSIONS_BY_BASE_ROLE } from '../../middleware/permissions';
import { OrgUnitDashboardRepo } from '../../repositories/org-unit/org.unit.dashboard.repo';

export const OrgUnitDashboardService = {
  async dashboardConfig(orgId: string, unitId: string, userId: string) {
    const m = await OrgUnitDashboardRepo.getMembership(orgId, userId);
    if (!m) throw forbidden('Not a member');

    const unit = await OrgUnitDashboardRepo.getUnitWithOrg(orgId, unitId);
    if (!unit) throw notFound('Org unit not found');

    const flags = computeUnitFeatures(
      unit.org.type as OrgType,
      unit.type as OrgUnitType
    );

    let codes = new Set<string>();
    if (m.role === 'admin') {
      [
        'org.read',
        'people.manage',
        'teaching.content.manage',
        'teaching.attendance.manage',
        'comms.announce.manage',
        'finance.invoice.manage',
        'finance.payment.manage',
        'reports.read',
        'reports.export',
      ].forEach((c) => codes.add(c));
    } else if (m.roleId) {
      (await OrgUnitDashboardRepo.getCustomPerms(m.roleId))?.forEach((p: any) =>
        codes.add(p)
      );
    } else {
      (PERMISSIONS_BY_BASE_ROLE[m.role as ParentRole] ?? []).forEach((c) =>
        codes.add(c)
      );
    }

    const expand = (s: Set<string>) => {
      const add = (c: string) => s.add(c);
      if (s.has('people.manage')) add('people.read');
      if (s.has('teaching.content.manage')) add('academics.read');
      if (s.has('teaching.attendance.manage')) add('attendance.read');
      if (s.has('comms.announce.manage')) add('announce.read');
      if (s.has('finance.invoice.manage') || s.has('finance.payment.manage'))
        add('finance.read');
      return s;
    };
    codes = expand(codes);

    const featureCaps = Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => `${k}.enabled`);
    const caps = new Set<string>([...codes, ...featureCaps]);

    const registry = {
      widgets: {
        timetable_today: { requires: ['timetable.enabled', 'org.read'] },
        announcements: { requires: ['announcements.enabled', 'announce.read'] },
        assignments_due: {
          requires: ['assignments.enabled', 'academics.read'],
        },
        tests_due: { requires: ['tests.enabled', 'academics.read'] },
        attendance_summary: {
          requires: ['attendance.enabled', 'attendance.read'],
        },
        results_summary: { requires: ['results.enabled', 'reports.read'] },
        fees_snapshot: { requires: ['fees.enabled', 'finance.read'] },
        achivements: { requires: ['achivements.enabled', 'reports.read'] },
      },
      tables: {
        timetable: { requires: ['timetable.enabled', 'org.read'] },
        announcements: { requires: ['announcements.enabled', 'announce.read'] },
        assignments: { requires: ['assignments.enabled', 'academics.read'] },
        tests: { requires: ['tests.enabled', 'academics.read'] },
        attendance: { requires: ['attendance.enabled', 'attendance.read'] },
        results: { requires: ['results.enabled', 'reports.read'] },
        fees: { requires: ['fees.enabled', 'finance.read'] },
      },
    } as const;

    const allow = (reqs: readonly string[]) => reqs.every((r) => caps.has(r));
    const widgets = Object.entries(registry.widgets)
      .filter(([, m]) => allow(m.requires))
      .map(([k]) => k);

    const tables = Object.entries(registry.tables)
      .filter(([, m]) => allow(m.requires))
      .map(([k]) => k);

    const memberCounts = await OrgUnitDashboardRepo.countMembersByRole(
      orgId,
      unitId
    );

    return {
      role: m.role,
      orgType: unit.org.type,
      unitType: unit.type,
      features: featureCaps,
      widgets,
      tables,
      memberCounts,
    };
  },

  async hero(orgId: string, unitId: string) {
    const unit = await OrgUnitDashboardRepo.getUnitHero(orgId, unitId);
    if (!unit) throw notFound('Org unit not found');
    return unit;
  },

  async summary(orgId: string, unitId: string, range: UnitDashRange) {
    const [att, res, asg, tst] = await Promise.all([
      OrgUnitDashboardRepo.summaryAttendance(orgId, unitId, range),
      OrgUnitDashboardRepo.summaryResults(orgId, unitId, range),
      OrgUnitDashboardRepo.summaryAssignments(orgId, unitId, range),
      OrgUnitDashboardRepo.summaryTests(orgId, unitId, range),
    ]);

    return {
      range,
      attendance: att,
      results: res,
      assignments: asg,
      tests: tst,
    };
  },

  async timetableToday(orgId: string, unitId: string) {
    return OrgUnitDashboardRepo.todayTimeTable(orgId, unitId);
  },

  async announcementsPeek(orgId: string, unitId: string) {
    return OrgUnitDashboardRepo.recentAnnouncements(orgId, unitId);
  },

  async assignmentsDue(orgId: string, unitId: string) {
    return OrgUnitDashboardRepo.upcomingAssignments(orgId, unitId);
  },
  async testsDue(orgId: string, unitId: string) {
    return OrgUnitDashboardRepo.upcomingTests(orgId, unitId);
  },
  async attendanceSummary(orgId: string, unitId: string) {
    return OrgUnitDashboardRepo.attendanceSnapshot(orgId, unitId);
  },
  async resultsSummary(orgId: string, unitId: string) {
    return OrgUnitDashboardRepo.resultsSnapshot(orgId, unitId);
  },
  async feesSnapshot(orgId: string, unitId: string) {
    return OrgUnitDashboardRepo.feeSnapshot(orgId, unitId);
  },
};
