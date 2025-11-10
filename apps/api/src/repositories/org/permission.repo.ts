import { prisma } from '../../lib/prisma';

export const PermissionRepo = {
  listCatalog() {
    return prisma.permission.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
  },

  byCodes(codes: string[]) {
    if (!codes?.length) return Promise.resolve<string[]>([]);
    return prisma.permission
      .findMany({
        where: { code: { in: codes } },
        select: { id: true },
      })
      .then((rows) => rows.map((r) => r.id));
  },
};
