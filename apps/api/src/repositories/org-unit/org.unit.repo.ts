import { prisma } from '../../lib/prisma';

export const OrgUnitRepo = {
  findManyWithOrgType(orgId: string) {
    return prisma.orgUnit.findMany({
      where: { orgId },
      orderBy: [{ createdAt: 'asc' }],
      include: { org: { select: { type: true } } },
    });
  },
  findByIdWithOrgType(orgId: string, unitId: string) {
    return prisma.orgUnit.findFirst({
      where: { id: unitId, orgId },
      include: { org: { select: { type: true } } },
    });
  },

  getParentType(parentId: string) {
    return prisma.orgUnit.findUnique({
      where: { id: parentId },
      select: { type: true },
    });
  },

  createWithOrgType(data: any) {
    return prisma.orgUnit.create({
      data,
      include: { org: { select: { type: true } } },
    });
  },

  updateWithOrgType(unitId: string, data: Partial<any>) {
    return prisma.orgUnit.update({
      where: { id: unitId },
      data,
      include: { org: { select: { type: true } } },
    });
  },

  remove(unitId: string) {
    return prisma.orgUnit.delete({ where: { id: unitId } });
  },
};
