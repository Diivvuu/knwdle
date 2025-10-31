import { OrgUnitResponseT } from '../domain/org.unit.schema';
import { OrgType } from '../generated/prisma';
import { FEATURE_DEFAULTS } from '../lib/org.unit.rules';
import { prisma } from '../lib/prisma';

export const OrgUnitService = {
  async list(orgId: string): Promise<OrgUnitResponseT[]> {
    const units = await prisma.orgUnit.findMany({
      where: { orgId },
      orderBy: [{ createdAt: 'asc' }],
      include: { org: { select: { type: true } } },
    });

    return units.map((u) => {
      const orgType = u.org.type as OrgType;
      const flags = FEATURE_DEFAULTS[orgType]?.[u.type] ?? {};
      return { ...u, features: flags };
    });
    },
    
    
};
