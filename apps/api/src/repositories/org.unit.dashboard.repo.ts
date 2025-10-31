import { prisma } from '../lib/prisma';

export const OrgUnitDashboardRepo = {
  getMembership(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { role: true, roleId: true },
    });
  },

  getCustomPerms(roleId: string) {
    return prisma.rolePermission
      .findMany({
        where: { roleId },
        include: { permission: true },
      })
      .then((rows) => rows.map((r) => r.permission.code));
  },

  getUnitWithOrg(orgId: string, unitId: string) {
    return prisma.orgUnit.findFirst({
      where: { id: unitId, orgId },
      select: {
        id: true,
        name: true,
        type: true,
        org: { select: { type: true } },
      },
    });
  },

  getUnitHero(orgId: string, unitId: string) {
    return prisma.orgUnit.findFirst({
      where: { id: unitId, orgId },
      select: {
        id: true,
        name: true,
        meta: true,
        _count: { select: { members: true } },
      },
    });
  },

  countMembersByRole(orgId: string, unitId: string) {
    return prisma.orgMembership
      .groupBy({
        by: ['role'],
        where: { orgId, unitId },
        _count: { role: true },
      })
      .then((rows) =>
        Object.fromEntries(rows.map((r) => [r.role, r._count.role]))
      );
    },
  
  
    summaryAttendance(orgId: string, unitId: string, range: '7d' | '30d' | '90d') { 
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
        const since = new Date(Date.now() - days*864e5)
    }
};
