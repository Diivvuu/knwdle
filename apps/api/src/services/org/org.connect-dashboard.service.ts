import { forbidden, notFound } from '../../lib/https';
import { OrgConnectDashboardRepo } from '../../repositories/org/org.connect-dashboard.repo';
import { OrgRepo } from '../../repositories/org/org.repo';

export const OrgConnectDashboardService = {
  async hero(orgId: string, userId: string) {
    const membership = await OrgRepo.getMembership(orgId, userId);
    if (!membership) throw forbidden('Not a member');

    const org = await OrgRepo.findByIdWithProfile(orgId);
    if (!org) throw notFound('Organisation not found');

    const unit = await OrgConnectDashboardRepo.getPrimaryUnit(orgId, userId);
    return {
      org: { id: org.id, name: org.name, type: org.type },
      unit: unit ? { id: unit.id, name: unit.name, type: unit.type } : null,
    };
  },

  async summary(orgId: string, userId: string) {
    const membership = await OrgRepo.getMembership(orgId, userId);
    if (!membership) throw forbidden('Not a member');

    const [attendance, assignments, tests, fees, achievements, results] =
      await Promise.all([
        OrgConnectDashboardRepo.getAttendanceSummary(orgId, userId),
        OrgConnectDashboardRepo.getAssignmentDue(orgId, userId),
        OrgConnectDashboardRepo.getTestsDue(orgId, userId),
        OrgConnectDashboardRepo.getFeesSnapshot(orgId, userId),
        OrgConnectDashboardRepo.getAchievements(orgId, userId),
        OrgConnectDashboardRepo.getResultsSummary(orgId, userId),
      ]);

    return {
      attendance,
      assignments,
      tests,
      fees,
      achievements,
      results,
    };
  },

  async timetableToday(orgId: string, userId: string) {
    const weekday = new Date().getDay();
    return OrgConnectDashboardRepo.getTodayTimetable(orgId, userId, weekday);
  },

  async announcementsPeek(orgId: string, userId: string) {
    return OrgConnectDashboardRepo.getAnnouncements(orgId, userId);
  },

  async config(orgId: string, userId: string) {
    const membership = await OrgRepo.getMembership(orgId, userId);
    if (!membership) throw forbidden('Not a member');
    const role = membership.role;

    const widgets =
      role === 'student'
        ? [
            'attendance_summary',
            'assignments_due',
            'tests_due',
            'fees_summary',
            'timetable_today',
            'achievements_peek',
            'results_summary',
            'announcements_peek',
          ]
        : ['child_attendance', 'fees_summary', 'announcements_peek'];

    return { role, widgets, tables: [] };
  },
};
