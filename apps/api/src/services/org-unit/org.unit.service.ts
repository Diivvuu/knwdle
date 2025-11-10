import { OrgType } from '../../generated/prisma';
import {
  FEATURE_DEFAULTS,
  computeAllowedChildren,
} from '../../lib/org.unit.rules';
import {
  CreateOrgUnitBodyT,
  UpdateOrgUnitBodyT,
  OrgUnitResponseT,
  OrgUnitTreeResponseT,
} from '../../domain/org.unit.schema';
import { OrgUnitRepo } from '../../repositories/org-unit/org.unit.repo';
import { OrgRepo } from '../../repositories/org/org.repo';


function normalizeMeta(meta: any): Record<string, any> {
  return typeof meta === 'object' && meta !== null ? meta : {};
}

export const OrgUnitsService = {
  async list(orgId: string): Promise<OrgUnitResponseT[]> {
    const units = await OrgUnitRepo.findManyWithOrgType(orgId);
    // const units = await prisma.orgUnit.findMany({
    //   where: { orgId },
    //   orderBy: [{ createdAt: 'asc' }],
    //   include: { org: { select: { type: true } } },
    // });

    return units.map((u) => {
      const orgType = u.org.type as OrgType;
      const flags = FEATURE_DEFAULTS[orgType]?.[u.type] ?? {};
      return {
        id: u.id,
        name: u.name,
        type: u.type,
        orgId: u.orgId,
        parentId: u.parentId,
        meta: normalizeMeta(u.meta),
        features: flags,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      };
    });
  },

  async tree(orgId: string): Promise<OrgUnitTreeResponseT> {
    const all = await OrgUnitRepo.findManyWithOrgType(orgId);

    type Node = OrgUnitResponseT & { children: Node[] };
    const byId: Record<string, Node> = {};

    for (const u of all) {
      const orgType = u.org.type as OrgType;
      const flags = FEATURE_DEFAULTS[orgType]?.[u.type] ?? {};
      byId[u.id] = {
        id: u.id,
        name: u.name,
        type: u.type,
        orgId: u.orgId,
        parentId: u.parentId,
        meta: normalizeMeta(u.meta),
        features: flags,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        children: [],
      };
    }

    const roots: Node[] = [];
    for (const u of all) {
      if (u.parentId && byId[u.parentId])
        byId[u.parentId].children.push(byId[u.id]);
      else roots.push(byId[u.id]);
    }

    return roots;
  },

  async get(orgId: string, unitId: string): Promise<OrgUnitResponseT> {
    const u = await OrgUnitRepo.findByIdWithOrgType(orgId, unitId);
    if (!u) throw new Error('Org unit not found');
    const orgType = u.org.type as OrgType;
    const flags = FEATURE_DEFAULTS[orgType]?.[u.type] ?? {};
    return {
      id: u.id,
      name: u.name,
      type: u.type,
      orgId: u.orgId,
      parentId: u.parentId,
      meta: normalizeMeta(u.meta),
      features: flags,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  },

  async create(
    orgId: string,
    data: CreateOrgUnitBodyT
  ): Promise<OrgUnitResponseT> {
    const org = await OrgRepo.getOrgTypeById(orgId);
    if (!org) throw new Error('Organisation not found');

    if (data.parentId) {
      const parent = await OrgUnitRepo.getParentType(data.parentId);
      if (!parent) throw new Error('Invalid parentId');
      const allowed = computeAllowedChildren(org.type as OrgType, parent.type);
      if (!allowed.includes(data.type)) {
        throw new Error(
          `Unit type "${data.type}" not allowed under parent "${parent.type}" for org type "${org.type}"`
        );
      }
    }

    const created = await OrgUnitRepo.createWithOrgType({
      ...data,
      orgId,
    });

    const orgType = org.type as OrgType;
    const flags = FEATURE_DEFAULTS[orgType]?.[created.type] ?? {};
    return {
      id: created.id,
      name: created.name,
      type: created.type,
      orgId: created.orgId,
      parentId: created.parentId,
      meta: normalizeMeta(created.meta),
      features: flags,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  },

  async update(
    orgId: string,
    unitId: string,
    data: UpdateOrgUnitBodyT
  ): Promise<OrgUnitResponseT> {
    const updated = await OrgUnitRepo.updateWithOrgType(unitId, data);

    const orgType = updated.org.type as OrgType;
    const flags = FEATURE_DEFAULTS[orgType]?.[updated.type] ?? {};
    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      orgId: updated.orgId,
      parentId: updated.parentId,
      meta: normalizeMeta(updated.meta),
      features: flags,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async remove(orgId: string, unitId: string): Promise<{ success: true }> {
    await OrgUnitRepo.remove(unitId);
    return { success: true };
  },
};
