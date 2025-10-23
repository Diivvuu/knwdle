import { OrgUnit, OrgUnitType } from '../generated/prisma';
import { prisma } from '../lib/prisma';

export const OrgUnitRepo = {
  get(orgId: string, unitId: string) {
    return prisma.orgUnit.findFirst({ where: { id: unitId, orgId } });
  },

  getMany(ids: string[]) {
    return prisma.orgUnit.findMany({ where: { id: { in: ids } } });
  },

  getParent(orgId: string, parentId: string) {
    return prisma.orgUnit.findFirst({
      where: { id: parentId, orgId },
      select: { id: true, path: true },
    });
  },
  breadCrumbs(unitId: string) {
    return prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
      `
            SELECT id, name
            FROM "OrgUnit
            WHERE id = ANY(
            regexp_split_to_array((SELECT path FROM "OrgUnit" WHERE id = $1), '/')
            )
            ORDER BY array_position(regexp_split_to_array((SELECT path FROM "OrgUnit" WHERE id = $1), '/'), id);
            `,
      unitId
    );
  },

  create(d: {
    orgId: string;
    parentId?: string | null;
    name: string;
    code?: string | null;
    type: OrgUnitType;
    meta?: any;
    path: string;
  }) {
    return prisma.orgUnit.create({ data: d });
  },

  update(
    unitId: string,
    data: Partial<{
      name: string;
      code: string | null;
      type: OrgUnitType;
      meta: any;
      parentId: string | null;
      path: string;
    }>
  ) {
    return prisma.orgUnit.update({ where: { id: unitId }, data });
  },

  listChildren(where: any, orderBy: any[], take: number) {
    return prisma.orgUnit.findMany({
      where,
      orderBy,
      take,
      select: {
        id: true,
        orgId: true,
        parentId: true,
        name: true,
        code: true,
        path: true,
        type: true,
        meta: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  countChildren(orgId: string, parentId: string | null) {
    return prisma.orgUnit.count({ where: { orgId, parentId } });
  },

  hasChildren(unitId: string) {
    return prisma.orgUnit
      .count({ where: { parentId: unitId } })
      .then((n) => n > 0);
  },

  remove(unitId: string) {
    return prisma.orgUnit.delete({ where: { id: unitId } });
  },

  search(
    orgId: string,
    q: string,
    orderBy: any[],
    take: number,
    cursorWhere?: any
  ) {
    return prisma.orgUnit.findMany({
      where: {
        orgId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
        ],
        ...(cursorWhere ? { AND: [cursorWhere] } : {}),
      },
      orderBy,
      take,
      select: {
        id: true,
        orgId: true,
        parentId: true,
        name: true,
        code: true,
        path: true,
        type: true,
        meta: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
