import { prisma } from '../lib/prisma';
import { AudienceLevel } from '../generated/prisma';

export const AudienceRepo = {
  create(data: {
    orgId: string;
    name: string;
    type: any;
    parentId?: string | null;
    isExclusive?: boolean;
    meta?: any;
    level: AudienceLevel;
  }) {
    return prisma.audience.create({ data });
  },

  findById(orgId: string, id: string) {
    return prisma.audience.findFirst({
      where: { id, orgId },
    });
  },

  findByName(orgId: string, name: string) {
    return prisma.audience.findFirst({
      where: { orgId, name },
      select: { id: true },
    });
  },

  listFlat(where: any) {
    return prisma.audience.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  },
  listTree(orgId: string) {
    return prisma.audience.findMany({
      where: { orgId, parentId: null },
      include: {
        children: {
          include: { children: true },
        },
      },
    });
  },
  update(id: string, data: any) {
    return prisma.audience.update({
      where: { id },
      data,
    });
  },
  delete(id: string) {
    return prisma.audience.delete({
      where: { id },
    });
  },
  countChildren(id: string) {
    return prisma.audience.count({
      where: { parentId: id },
    });
  },
  countMembers(id: string) {
    return prisma.orgMembership.count({
      where: { audienceId: id },
    });
  },
};
