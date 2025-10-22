// src/repositories/membership.repo.ts
import { prisma } from '../lib/prisma';
import { ParentRole } from '../generated/prisma';

export const MembershipRepo = {
  upsertUnitScoped(params: {
    orgId: string;
    userId: string;
    unitId: string;
    role: ParentRole;
    roleId?: string;
  }) {
    return prisma.orgMembership.upsert({
      where: {
        orgId_userId_unitId: {
          orgId: params.orgId,
          userId: params.userId,
          unitId: params.unitId,
        },
      },
      update: { role: params.role, roleId: params.roleId },
      create: {
        orgId: params.orgId,
        userId: params.userId,
        role: params.role,
        roleId: params.roleId,
        unitId: params.unitId,
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
      where: { orgId: params.orgId, userId: params.userId, unitId: null },
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
