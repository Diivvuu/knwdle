import { prisma } from '../lib/prisma';
import { OrgUnitType, ParentRole, OrgType } from '../generated/prisma';

export const OrgRepo = {
  // Basic CRUD / lookups
  findByIdWithProfile(id: string) {
    return prisma.organisation.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  listMyOrgs(userId: string) {
    return prisma.organisation.findMany({
      where: { members: { some: { userId } } },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createOrgWithMainUnit(params: {
    name: string;
    type: OrgType;
    teamSize?: string;
    meta: any;
    ownerUserId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.organisation.create({
        data: {
          name: params.name,
          type: params.type,
          teamSize: params.teamSize,
          profile: { create: { meta: params.meta } },
          members: { create: { userId: params.ownerUserId, role: ParentRole.admin } },
        },
        include: { profile: true },
      });

      await tx.orgUnit.create({
        data: {
          orgId: created.id,
          name: 'Main',
          parentId: null,
          type: OrgUnitType.OTHER,
          meta: {},
        },
      });

      return created;
    });
  },

  updateOrgAndProfile(id: string, data: {
    org: Record<string, any>;
    meta?: any;
  }) {
    return prisma.organisation.update({
      where: { id },
      data: {
        ...data.org,
        profile: data.meta
          ? {
              upsert: {
                create: { meta: data.meta },
                update: { meta: data.meta },
              },
            }
          : undefined,
      },
      include: { profile: true },
    });
  },

  deleteOrg(id: string) {
    // NOTE: ensure your Prisma schema cascades, or do manual cleanup if needed
    return prisma.organisation.delete({ where: { id } });
  },

  isMember(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { id: true },
    });
  },

  isAdmin(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId, role: 'admin' },
      select: { id: true },
    });
  },

  getMemberships(orgId: string, userId: string) {
    return prisma.orgMembership.findMany({
      where: { orgId, userId },
      select: { role: true, unitId: true },
    });
  },

  getCustomRolePermissionCodes(roleId: string) {
    return prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
  },

  getMembership(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { role: true, roleId: true },
    });
  },
};