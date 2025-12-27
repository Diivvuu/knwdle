import { badRequest, notFound } from '../lib/https';
import {
  AttendanceRepo,
  denormalizePeriod,
} from '../repositories/attendance.repo';
import { prisma } from '../lib/prisma';

export const AttendanceService = {
  async takeAttendance(params: {
    orgId: string;
    audienceId: string;
    actorUserId: string;
    body: {
      date: string;
      period?: string | null;
      notes?: string;
      takenById?: string;
      records: { studentId: string; status: 'present' | 'absent' }[];
    };
  }) {
    const { orgId, audienceId, actorUserId, body } = params;

    const audience = await prisma?.audience.findFirst({
      where: { id: audienceId, orgId },
    });
    if (!audience) throw notFound('Audience not found');

    const session = await AttendanceRepo.upsertSession({
      orgId,
      audienceId,
      dateISO: body.date,
      period: body.period ?? null,
      notes: body.notes,
      takenById: body.takenById ?? actorUserId,
    });

    const studentIds = body.records.map((r) => r.studentId);
    const membershipCount = await prisma?.orgMembership.count({
      where: { orgId, audienceId, role: 'student', userId: { in: studentIds } },
    });
    if (membershipCount !== studentIds.length) {
      throw badRequest('One or more students are not members of this audience');
    }
    const records = await AttendanceRepo.upsertRecords({
      sessionId: session.id,
      records: body.records,
    });

    return {
      session: {
        id: session.id,
        orgId: session.orgId,
        audienceId: session.audienceId,
        audience: session.audience,
        date: session.date,
        period: denormalizePeriod(session.period),
        notes: session.notes,
        takenById: session.takenById,
        createdAt: session.createdAt,
      },
      records,
    };
  },

  async listSessions(
    orgId: string,
    audienceId: string,
    query: { date?: string; limit: number; cursor?: string }
  ) {
    const result = await AttendanceRepo.listSessions({
      orgId,
      audienceId,
      dateISO: query.date,
      limit: query.limit,
      cursor: query.cursor,
    });

    return {
      data: result.data.map((s) => ({
        id: s.id,
        orgId: s.orgId,
        audienceId: s.audienceId,
        audience: s.audience,
        date: s.date,
        period: denormalizePeriod(s.period),
        notes: s.notes,
        takenById: s.takenById,
        createdAt: s.createdAt,
        recordsCount: s._count.records,
      })),
      nextCursor: result.nextCursor,
    };
  },

  async getSession(
    orgId: string,
    audienceId: string,
    sessionId: string,
    includeRecords: boolean
  ) {
    const s = await AttendanceRepo.getSession({
      orgId,
      audienceId,
      sessionId,
      includeRecords,
    });
    if (!s) throw notFound('Attendance session not found');

    return {
      id: s.id,
      orgId: s.orgId,
      audienceId: s.audienceId,
      audience: s.audience,
      date: s.date,
      period: denormalizePeriod(s.period),
      notes: s.notes,
      takenById: s.takenById,
      createdAt: s.createdAt,
      records: includeRecords ? s.records : undefined,
    };
  },

  async updateNotes(
    orgId: string,
    audienceId: string,
    sessionId: string,
    notes?: string | null
  ) {
    const existing = await prisma?.attendanceSession.findFirst({
      where: { id: sessionId, orgId, audienceId },
    });
    if (!existing) throw notFound('Attendance not found');

    const s = await AttendanceRepo.updateSessionNotes({
      orgId,
      audienceId,
      sessionId,
      notes,
    });

    return {
      id: s.id,
      orgId: s.orgId,
      audienceId: s.audienceId,
      audience: s.audience,
      date: s.date,
      period: denormalizePeriod(s.period),
      notes: s.notes,
      takenById: s.takenById,
      createdAt: s.createdAt,
    };
  },
  async updateRecord(
    orgId: string,
    audienceId: string,
    sessionId: string,
    studentId: string,
    status: 'present' | 'absent'
  ) {
    const s = await prisma?.attendanceSession.findFirst({
      where: { id: sessionId, orgId, audienceId },
    });
    if (!s) throw notFound('Attendance session not found');

    const membership = await prisma?.orgMembership.findFirst({
      where: { orgId, audienceId, role: 'student', userId: studentId },
    });
    if (!membership)
      throw badRequest('Student is not a member of this audience');

    return AttendanceRepo.updateRecord({ sessionId, studentId, status });
  },

  async studentHistory(
    orgId: string,
    studentId: string,
    query: { from?: string; to?: string; limit: number; cursor?: string }
  ) {
    return AttendanceRepo.studentHistory({
      orgId,
      studentId,
      from: query.from,
      to: query.to,
      limit: query.limit,
      cursor: query.cursor,
    });
  },
};
