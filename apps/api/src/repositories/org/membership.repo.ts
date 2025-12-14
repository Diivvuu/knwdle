// src/repositories/membership.repo.ts
import { ParentRole } from '../../generated/prisma';
import { prisma } from '../../lib/prisma';

export const MembershipRepo = {
  upsertAudienceScoped(params: {
    orgId: string;
    userId: string;
    audienceId: string;
    role: ParentRole;
    roleId?: string;
  }) {
    return prisma.orgMembership.upsert({
      where: {
        orgId_userId_audienceId: {
          orgId: params.orgId,
          userId: params.userId,
          audienceId: params.audienceId,
        },
      },
      update: { role: params.role, roleId: params.roleId },
      create: {
        orgId: params.orgId,
        userId: params.userId,
        role: params.role,
        roleId: params.roleId,
        audienceId: params.audienceId,
      },
    });
  },

  async updateOrgScopedOrCreate(params: {
    orgId: string;
    userId: string;
    role: ParentRole;
    roleId?: string;
  }) {
    const updated = await prisma.orgMembership.updateMany({
      where: { orgId: params.orgId, userId: params.userId, audienceId: null },
      data: { role: params.role, roleId: params.roleId },
    });
    if (updated.count === 0) {
      await prisma.orgMembership.create({
        data: {
          orgId: params.orgId,
          userId: params.userId,
          role: params.role,
          roleId: params.roleId,
        },
      });
    }
  },

  findOrgScoped(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { id: true },
    });
  },

  updateRoleId(membershipId: string, roleId: string | null) {
    return prisma.orgMembership.update({
      where: { id: membershipId },
      data: { roleId },
    });
  },
};
