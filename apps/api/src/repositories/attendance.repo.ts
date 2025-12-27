import { decodeCursor, encodeCursor } from '../lib/pagination';
import { prisma } from '../lib/prisma';

export const NO_PERIOD = '__NO_PERIOD__';

// DB ops must always use a string for composite unique keys.
// API can send null/undefined to mean "no period".
export function normalizePeriod(period?: string | null): string {
  return period ?? NO_PERIOD;
}

// Never leak sentinel to client
export function denormalizePeriod(period?: string | null): string | null {
  if (!period) return null;
  return period === NO_PERIOD ? null : period;
}

export const AttendanceRepo = {
  upsertSession(params: {
    orgId: string;
    audienceId: string;
    dateISO: string;
    period?: string | null;
    notes?: string;
    takenById?: string | null;
  }) {
    const { orgId, audienceId, dateISO, period, notes, takenById } = params;
    const p = normalizePeriod(period);

    return prisma.attendanceSession.upsert({
      where: {
        orgId_audienceId_date_period: {
          orgId,
          audienceId,
          date: new Date(dateISO),
          period: p,
        },
      },
      update: {
        notes: notes ?? undefined,
        takenById: takenById ?? undefined,
      },
      create: {
        orgId,
        audienceId,
        date: new Date(dateISO),
        period: p,
        notes: notes ?? undefined,
        takenById: takenById ?? undefined,
      },
      include: {
        audience: { select: { id: true, name: true } },
      },
    });
  },

  async upsertRecords(params: {
    sessionId: string;
    records: { studentId: string; status: string }[];
  }) {
    const { sessionId, records } = params;

    return prisma.$transaction(async (tx) => {
      const ops = records.map((r) =>
        tx.attendanceRecord.upsert({
          where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
          update: { status: r.status },
          create: { sessionId, studentId: r.studentId, status: r.status },
        })
      );
      await Promise.all(ops);

      return tx.attendanceRecord.findMany({
        where: { sessionId },
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      });
    });
  },

  async listSessions(params: {
    orgId: string;
    audienceId: string;
    dateISO?: string;
    limit: number;
    cursor?: string;
  }) {
    const { orgId, audienceId, dateISO, limit, cursor } = params;
    const c = decodeCursor(cursor);

    const where: any = {
      orgId,
      audienceId,
      ...(dateISO ? { date: new Date(dateISO) } : {}),
      ...(c
        ? {
            OR: [
              { createdAt: { lt: c.createdAt } },
              { createdAt: c.createdAt, id: { lt: c.id } },
            ],
          }
        : {}),
    };

    const rows = await prisma.attendanceSession.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        audience: { select: { id: true, name: true } },
        _count: { select: { records: true } },
      },
    });

    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit);
    const nextCursor = hasNext
      ? encodeCursor(data[data.length - 1].createdAt, data[data.length - 1].id)
      : null;

    return { data, nextCursor };
  },

  async getSession(params: {
    orgId: string;
    audienceId: string;
    sessionId: string;
    includeRecords: boolean;
  }) {
    const { orgId, audienceId, sessionId, includeRecords } = params;

    return prisma.attendanceSession.findFirst({
      where: { id: sessionId, orgId, audienceId },
      include: {
        audience: { select: { id: true, name: true } },
        records: includeRecords
          ? {
              include: {
                student: { select: { id: true, name: true, email: true } },
              },
              orderBy: { createdAt: 'asc' },
            }
          : false,
      },
    });
  },

  async updateSessionNotes(params: {
    orgId: string;
    audienceId: string;
    sessionId: string;
    notes?: string | null;
  }) {
    const { orgId, audienceId, sessionId, notes } = params;

    return prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { notes: notes ?? null },
      include: { audience: { select: { id: true, name: true } } },
    });
  },

  async updateRecord(params: {
    sessionId: string;
    studentId: string;
    status: string;
  }) {
    const { sessionId, studentId, status } = params;

    return prisma.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      update: { status },
      create: { sessionId, studentId, status },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
  },

  async studentHistory(params: {
    orgId: string;
    studentId: string;
    from?: string;
    to?: string;
    limit: number;
    cursor?: string;
  }) {
    const { orgId, studentId, from, to, limit, cursor } = params;
    const c = decodeCursor(cursor);

    const where: any = {
      studentId,
      session: {
        orgId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      ...(c
        ? {
            OR: [
              { createdAt: { lt: c.createdAt } },
              { createdAt: c.createdAt, id: { lt: c.id } },
            ],
          }
        : {}),
    };
    const rows = await prisma.attendanceRecord.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        session: {
          include: { audience: { select: { id: true, name: true } } },
        },
      },
    });

    const hasNext = rows.length > limit;
    const data = rows.slice(0, limit);
    const nextCursor = hasNext
      ? encodeCursor(data[data.length - 1].createdAt, data[data.length - 1].id)
      : null;

    return { data, nextCursor };
  },
};
