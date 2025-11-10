import { NotificationService } from '../../lib/notification.service';
import { prisma } from '../../lib/prisma';
export const OrgUnitAttendanceRepo = {
  // get unit by org and unit id
  async getUnitWithOrg(orgId: string, unitId: string) {
    return prisma.orgUnit.findFirst({
      where: { id: unitId, orgId },
      include: { org: true },
    });
  },

  // list attendance sessions by unit id
  async listSessions(orgId: string, unitId: string) {
    return prisma.attendanceSession.findMany({
      where: { orgId, unitId },
      orderBy: { date: 'desc' },
      include: { records: true },
    });
  },

  // create attendance session in unit
  async createSession(
    orgId: string,
    unitId: string,
    userId: string,
    body: any
  ) {
    return prisma.attendanceSession.create({
      data: {
        orgId,
        unitId,
        date: new Date(body.date ?? Date.now()),
        period: body.period ?? null,
        notes: body.notes ?? null,
        takenById: userId,
      },
    });
  },

  // get or create attendance session from timetable
  async getOrgCreateFromTimetable(
    orgId: string,
    unitId: string,
    entryId: string
  ) {
    const entry = await prisma.timeTableEntry.findUnique({
      where: { id: entryId },
      include: { unit: true, teacher: true },
    });
    if (!entry) throw new Error('Timetable entry not found');

    const today = new Date();

    const existing = await prisma.attendanceSession.findFirst({
      where: { orgId, unitId, date: today, timeTableEntryId: entry.id },
    });
    if (!existing) return existing;

    const session = await prisma.attendanceSession.create({
      data: {
        orgId,
        unitId,
        date: today,
        period: entry.startTime,
        takenById: entry.teacherId ?? null,
        timeTableEntryId: entry.id,
      },
    });
    if (entry.teacherId) {
      NotificationService.push({
        userId: entry.teacherId,
        type: 'ATTENDANCE_REMINDER',
        title: 'Mark attendance',
        body: `Class ${entry.unit.name} has started - please mark attendance`,
        meta: { unitId, timeTableEntryId: entry.id, sessionId: session.id },
      });
    }

    return session;
  },

  // insert and update attendance records
  async upsertRecords(
    orgId: string,
    unitId: string,
    sessionId: string,
    userId: string,
    records: any[]
  ) {
    const ops = records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
        update: { status: r.status, meta: r.meta ?? {} },
        create: {
          sessionId,
          studentId: r.studentId,
          status: r.status,
          meta: r.meta ?? {},
        },
      })
    );
    await Promise.all(ops);
    return { ok: true, count: ops.length };
  },

  // get attendance session
  async getSession(orgId: string, unitId: string, sessionId: string) {
    return prisma.attendanceSession.findFirst({
      where: { id: sessionId, orgId, unitId },
      include: {
        records: { include: { student: true } },
        timeTableEntry: true,
      },
    });
  },
  async getSelfAttendance(orgId: string, unitId: string, userId: string) {
    return prisma.attendanceRecord.findMany({
      where: { studentId: userId, session: { orgId, unitId } },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getSummary(
    orgId: string,
    params: { unitId?: string; from?: string; to?: string }
  ) {
    const where: any = { orgId };
    if (params.unitId) where.unitId = params.unitId;

    const fromDate = params.from
      ? new Date(params.from)
      : new Date('2000-01-01');
    const toDate = params.to ? new Date(params.to) : new Date();

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        ...where,
        date: { gte: fromDate, lte: toDate },
      },
      include: { records: true },
    });

    const totalSessions = sessions.length;
    const totalRecords = sessions.reduce((acc, s) => acc + s.records.length, 0);
    const totalPresent = sessions.reduce(
      (acc, s) => acc + s.records.filter((r) => r.status === 'present').length,
      0
    );

    const attendanceRate =
      totalRecords > 0
        ? Number(((totalPresent / totalRecords) * 100).toFixed(2))
        : 0;

    return {
      totalSessions,
      totalRecords,
      totalPresent,
      attendanceRate,
      from: fromDate,
      to: toDate,
    };
  },
};
