import { prisma } from '../lib/prisma';
export const AudienceMemberRepo = {
  listMembers(audienceId: string, where: any, take: number, orderBy: any) {
    return prisma.orgMembership.findMany({
      where: { audienceId, ...where },
      take,
      orderBy,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  remove(orgId: string, userId: string, audienceId: string) {
    return prisma.orgMembership.delete({
      where: { orgId_userId_audienceId: { orgId, userId, audienceId } },
    });
  },

  findAcademicMemberships(orgId: string, userId: string) {
    return prisma.orgMembership.findMany({
      where: {
        orgId,
        userId,
        audience: {
          type: 'ACADEMIC',
          isExclusive: true,
        },
      },
      select: { audienceId: true },
    });
  },

  listUserAudiences(orgId: string, userId: string) {
    return prisma.orgMembership.findMany({
      where: { orgId, userId, audienceId: { not: null } },
      include: { audience: { select: { id: true, name: true, type: true } } },
    });
  },
};
