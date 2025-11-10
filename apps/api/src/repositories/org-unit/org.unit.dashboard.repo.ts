import { UnitDashRange } from '../../domain/org.unit.dashboard.schema';
import { prisma } from '../../lib/prisma';

export const OrgUnitDashboardRepo = {
  async getMembership(orgId: string, userId: string) {
    return await prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { role: true, roleId: true },
    });
  },

  async getCustomPerms(roleId: string) {
    const rows = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rows.map((r) => r.permission.code);
  },

  async getUnitWithOrg(orgId: string, unitId: string) {
    return await prisma.orgUnit.findFirst({
      where: { id: unitId, orgId },
      select: {
        id: true,
        name: true,
        type: true,
        org: { select: { type: true } },
      },
    });
  },

  async getUnitHero(orgId: string, unitId: string) {
    return await prisma.orgUnit.findFirst({
      where: { id: unitId, orgId },
      select: {
        id: true,
        name: true,
        meta: true,
        _count: { select: { members: true } },
      },
    });
  },

  async countMembersByRole(orgId: string, unitId: string) {
    const rows = await prisma.orgMembership.groupBy({
      by: ['role'],
      where: { orgId, unitId },
      _count: { role: true },
    });

    return Object.fromEntries(rows.map((r) => [r.role, r._count.role]));
  },

  async summaryAttendance(orgId: string, unitId: string, range: UnitDashRange) {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 864e5);
    const sessions = await prisma.attendanceSession.findMany({
      where: { orgId, unitId, date: { gte: since } },
      include: { records: true },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const total = sessions.length;
    let present = 0,
      totalRec = 0;
    sessions.forEach((s) =>
      s.records.forEach((r) => {
        totalRec++;
        if (r.status === 'present') present++;
      })
    );
    const avg = totalRec ? Math.round((present / totalRec) * 100) : 0;

    return {
      totalSessions: total,
      avgRate: avg,
      lastSessionAt: sessions[0]?.date ?? null,
    };
    //   .then((s) => {
    //     const total = s.length;
    //     let present = 0,
    //       totalRec = 0;
    //     s.forEach((x) =>
    //       x.records.forEach((r) => {
    //         totalRec++;
    //         if (r.status === 'present') present++;
    //       })
    //     );
    //     const avg = totalRec ? Math.round((present / totalRec) * 100) : 0;
    //     return {
    //       totalSessions: total,
    //       avgRate: avg,
    //       lastSessionAt: s[0]?.date ?? null,
    //     };
    //   });
  },

  async summaryResults(orgId: string, unitId: string, range: UnitDashRange) {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 864e5);
    const summaries = await prisma.resultRecord.findMany({
      where: { orgId, subject: { id: unitId }, date: { gte: since } },
      take: 200,
      orderBy: { date: 'desc' },
    });
    return { count: summaries.length };
  },

  async summaryAssignments(
    orgId: string,
    unitId: string,
    range: UnitDashRange
  ) {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 864e5);

    const count = await prisma.contentItem.count({
      where: { orgId, unitId, type: 'assignment', createdAt: { gte: since } },
    });
    return { count };
  },

  async summaryTests(orgId: string, unitId: string, range: UnitDashRange) {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 864e5);

    const count = await prisma.contentItem.count({
      where: { orgId, unitId, type: 'test', createdAt: { gte: since } },
    });
    return { count };
  },

  async todayTimeTable(orgId: string, unitId: string) {
    const dow = new Date().getDay();
    return await prisma.timeTableEntry.findMany({
      where: { orgId, unitId, dayOfWeek: dow },
      orderBy: [{ startTime: 'asc' }],
      select: {
        id: true,
        startTime: true,
        endTime: true,
        room: true,
        mode: true,
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
  },

  async recentAnnouncements(orgId: string, unitId: string) {
    return await prisma.announcement.findMany({
      where: { orgId, unitId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, title: true, body: true, createdAt: true },
    });
  },

  async upcomingAssignments(orgId: string, unitId: string) {
    return await prisma.contentItem.findMany({
      where: { orgId, unitId, type: 'assignment', dueAt: { gte: new Date() } },
      orderBy: { dueAt: 'asc' },
      take: 10,
      select: { id: true, title: true, dueAt: true },
    });
  },

  async upcomingTests(orgId: string, unitId: string) {
    return await prisma.contentItem.findMany({
      where: { orgId, unitId, type: 'test', dueAt: { gte: new Date() } },
      orderBy: { dueAt: 'asc' },
      take: 10,
      select: { id: true, title: true, dueAt: true },
    });
  },

  async attendanceSnapshot(orgId: string, unitId: string) {
    return await this.summaryAttendance(orgId, unitId, '30d');
  },

  async resultsSnapshot(orgId: string, unitId: string) {
    const count = await prisma.resultRecord.count({
      where: { orgId, subject: { id: unitId } },
    });
    return { totalResults: count };
  },

  async feeSnapshot(orgId: string, unitId: string) {
    const rows = await prisma.feeInvoice.findMany({
      where: { orgId, unitId },
      select: { amount: true, status: true, dueAt: true },
    });

    let totalPaid = 0,
      totalDue = 0,
      overdueCount = 0;

    const now = new Date();

    for (const i of rows) {
      if (i.status === 'paid') totalPaid += i.amount;
      else {
        totalDue += i.amount;
        if (i.dueAt < now) overdueCount++;
      }
    }

    return { totalPaid, totalDue, overdueCount };
  },
};
