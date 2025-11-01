import { prisma } from '../lib/prisma';

export const OrgConnectDashboardRepo = {
  getPrimaryUnit(orgId: string, userId: string) {
    return prisma.orgUnit.findFirst({
      where: { orgId, members: { some: { userId } } },
      select: { id: true, name: true, type: true },
    });
  },

  async getAttendanceSummary(orgId: string, userId: string) {
    const records = await prisma.attendanceRecord.findMany({
      where: { session: { orgId }, studentId: userId },
      include: { session: { select: { date: true } } },
      orderBy: { session: { date: 'desc' } },
      take: 30,
    });
    if (!records.length) {
      return { totalSessions: 0, avgRate: 0, lastSessionAt: null };
    }
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    return {
      totalSessions: total,
      avgRate: Math.round((present / total) * 100),
      lastSessionAt: records[0].session.date.toISOString(),
    };
  },

  async getAssignmentDue(orgId: string, userId: string) {
    const now = new Date();
    return prisma.contentItem.findMany({
      where: {
        orgId,
        type: 'assignment',
        dueAt: { gt: now },
        submissions: { none: { studentId: userId } },
      },
      select: { id: true, title: true, dueAt: true },
      orderBy: { dueAt: 'asc' },
      take: 5,
    });
  },

  async getTestsDue(orgId: string, userId: string) {
    const now = new Date();
    return prisma.contentItem.findMany({
      where: {
        orgId,
        type: 'test',
        dueAt: { gt: now },
        submissions: { none: { studentId: userId } },
      },
      select: { id: true, title: true, dueAt: true },
      orderBy: { dueAt: 'asc' },
      take: 5,
    });
  },

  async getFeesSnapshot(orgId: string, userId: string) {
    const invoices = await prisma.feeInvoice.findMany({
      where: { orgId, studentId: userId },
      select: { amount: true, status: true, dueAt: true },
    });

    let totalPaid = 0,
      totalDue = 0,
      overdueCount = 0;
    const now = new Date();
    for (const i of invoices) {
      if (i.status === 'paid') totalPaid += i.amount;
      else {
        totalDue += i.amount;
        if (i.dueAt < now) overdueCount++;
      }
    }
    return { totalPaid, totalDue, overdueCount };
  },

  getTodayTimetable(orgId: string, userId: string, weekday: number) {
    return prisma.timeTableEntry.findMany({
      where: {
        orgId,
        dayOfWeek: weekday,
        OR: [
          { unit: { members: { some: { userId } } } },
          { teacherId: userId },
        ],
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  },
  getAnnouncements(orgId: string, userId: string) {
    return prisma.announcement.findMany({
      where: {
        orgId,
        OR: [{ unitId: null }, { unit: { members: { some: { userId } } } }],
      },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  },

  async getAchievements(orgId: string, userId: string) {
    const rows = await prisma.achievement.findMany({
      where: { orgId, studentId: userId },
      orderBy: { awardedAt: 'desc' },
      take: 3,
    });
    return { count: rows.length, latest: rows };
  },

  async getResultsSummary(orgId: string, userId: string) {
    const recents = await prisma.resultRecord.findMany({
      where: { orgId, studentId: userId },
      orderBy: { date: 'desc' },
      take: 5,
    });
    if (!recents.length)
      return { avgScore: null, lastTestTitle: null, lastTestDate: null };
    const avg =
      recents.reduce((sum, r) => sum + r.score / r.total, 0) / recents.length;
    const last = recents[0];
    return {
      avgScore: Math.round(avg * 100),
      lastTestTitle: last.title,
      lastTestDate: last.date.toISOString(),
    };
  },
};
