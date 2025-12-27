import { MoveStudentBody } from '../domain/audience.members.schema';
import { badRequest, notFound } from '../lib/https';
import { AudienceMemberRepo } from '../repositories/audience.members.repo';
import { MembershipRepo } from '../repositories/org/membership.repo';
import { prisma } from '../lib/prisma';

export const AudienceMemberService = {
  async listAvailableMembers(orgId: string, audienceId: string, query: any) {
    const audience = await prisma.audience.findFirst({
      where: { id: audienceId, orgId },
      select: { type: true, isExclusive: true },
    });
    if (!audience) throw notFound('Audience not found');

    return prisma.orgMembership.findMany({
      where: {
        orgId,

        //only org-level members
        audienceId: null,

        //user-level checks
        user: {
          memberships: {
            none: {
              // already in this audience
              audienceId: audienceId,
            },

            ...(audience.type === 'ACADEMIC' && audience.isExclusive
              ? {
                  none: {
                    audience: {
                      type: 'ACADEMIC',
                      isExclusive: true,
                    },
                  },
                }
              : {}),
          },
        },
      },
      distinct: ['userId'],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: query.limit ? Number(query.limit) : 25,
    });
  },
  async list(orgId: string, audienceId: string, query: any) {
    const where = {
      ...(query.role && { role: query.role }),
      ...(query.search && {
        user: {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    return AudienceMemberRepo.listMembers(
      audienceId,
      where,
      query.limit ?? 20,
      { createdAt: 'desc' }
    );
  },

  //add member in audience
  async add(orgId: string, audienceId: string, body: any) {
    const audience = await prisma?.audience.findFirst({
      where: { id: audienceId, orgId },
    });
    if (!audience) throw notFound('Audience not found');

    //exclusive academic check
    if (
      audience.type === 'ACADEMIC' &&
      audience.isExclusive &&
      body.role === 'student'
    ) {
      const existing = await prisma.orgMembership.findFirst({
        where: {
          orgId,
          userId: body.userId,
          role: 'student',
          audience: {
            type: 'ACADEMIC',
            isExclusive: true,
          },
        },
      });

      if (existing) {
        throw badRequest(
          'Student already assigned to another academic audience'
        );
      }
    }
    return MembershipRepo.upsertAudienceScoped({
      orgId,
      userId: body.userId,
      audienceId,
      role: body.role,
      roleId: body.roleId,
    });
  },

  async remove(orgId: string, audienceId: string, userId: string) {
    return AudienceMemberRepo.remove(orgId, userId, audienceId);
  },
  async moveStudent(orgId: string, body: MoveStudentBody) {
    return prisma?.$transaction(async () => {
      await AudienceMemberRepo.remove(
        orgId,
        body.studentId,
        body.fromAudienceId
      );

      return MembershipRepo.upsertAudienceScoped({
        orgId,
        userId: body.studentId,
        audienceId: body.toAudienceId,
        role: 'student',
      });
    });
  },

  async listUserAudiences(orgId: string, userId: string) {
    return AudienceMemberRepo.listUserAudiences(orgId, userId);
  },
};
