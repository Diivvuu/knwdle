import { prisma } from '../../lib/prisma';
export const OrgUnitAssignmentRepo = {
  async list(orgId: string, unitId: string, query: any) {
    const limit = Math.min(Number(query.limit) || 20, 100);
    const cursor = query.cursor ? { id: query.cursor } : undefined;

    const items = await prisma.contentItem.findMany({
      where: { orgId, unitId, type: 'assignment' },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { skip: 1, cursor }),
      include: {
        submissions: {
          select: { id: true, studentId: true, submittedAt: true, grade: true },
        },
      },
    });

    const nextCursor = items.length > limit ? items.pop()!.id : null;
    return { items, nextCursor };
  },

  // create new assignment
  async create(orgId: string, unitId: string, userId: string, body: any) {
    return prisma.contentItem.create({
      data: {
        orgId,
        unitId,
        type: 'assignment',
        title: body.title,
        body: body.body ?? null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        createdBy: userId,
      },
    });
  },

  // get assignment details + submissions
  async get(orgId: string, unitId: string, id: string) {
    return prisma.contentItem.findFirst({
      where: { id, orgId, unitId, type: 'assignment' },
      include: {
        submissions: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  },

  // update assignment
  async update(orgId: string, unitId: string, id: string, body: any) {
    return prisma.contentItem.update({
      where: { id },
      data: {
        title: body.title,
        body: body.body,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        updatedAt: new Date(),
      },
    });
  },

  // delete assignment
  async remove(orgId: string, unitId: string, id: string) {
    await prisma.contentItem.delete({ where: { id } });
    return { ok: true };
  },

  // submit assignment (student)
  async submit(
    orgId: string,
    unitId: string,
    assignemntId: string,
    studentId: string,
    body: any
  ) {
    return prisma.submission.upsert({
      where: { contentId_studentId: { contentId: assignemntId, studentId } },
      update: {
        submittedAt: new Date(),
        meta: body.meta ?? {},
      },
      create: {
        contentId: assignemntId,
        studentId,
        submittedAt: new Date(),
        meta: body.meta ?? {},
      },
    });
  },

  // list submissions for an assignment (paginated)
  async listSubmissions(
    orgId: string,
    unitId: string,
    assignmentId: string,
    query: any
  ) {
    const limit = Math.min(Number(query.limit) || 20, 100);
    const cursor = query.cursor ? { id: query.cursor } : undefined;

    const items = await prisma.submission.findMany({
      where: { content: { orgId, unitId, id: assignmentId } },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
      take: limit + 1,
      ...(cursor && { skip: 1, cursor }),
    });

    const nextCursor = items.length > limit ? items.pop()!.id : null;
    return {
      items,
      nextCursor,
    };
  },

  // grade submissions (bulk)
  async grade(orgId: string, unitId: string, assignmentId: string, body: any) {
    const ops = body.grades.map((g: any) =>
      prisma.submission.update({
        where: { id: g.submissionId },
        data: {
          grade: g.grade,
          feedback: g.feedback ?? null,
          meta: { ...(g.meta ?? {}) },
        },
      })
    );
    await Promise.all(ops);
    return { ok: true, count: ops.length };
  },
};
