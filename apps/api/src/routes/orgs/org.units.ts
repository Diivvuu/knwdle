import { Router } from 'express';
import z from 'zod';
import { OrgUnitType, PrismaClient } from '../../generated/prisma';
import { requireAuth } from '../../middleware/auth';
import {
  assertPermission,
  requirePermission,
} from '../../middleware/permissions';
import { prisma } from '../../lib/prisma';

const r = Router();

const IdParam = z.object({ id: z.string().min(1) });
const UnitParams = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
});

const CreateUnitBody = z.object({
  name: z.string().min(2),
  parentId: z.string().min(1).nullable().optional(),
  code: z.string().trim().max(24).optional(),
  type: z.nativeEnum(OrgUnitType).default(OrgUnitType.OTHER),
  meta: z.record(z.any()).optional(),
});
const UpdateUnitBody = z.object({
  name: z.string().min(2).optional(),
  parentId: z.string().min(1).nullable().optional(),
  code: z.string().trim().max(24).optional(),
  type: z.nativeEnum(OrgUnitType).optional(),
  meta: z.record(z.any()).optional(),
});

async function isDescendant(
  prisma: PrismaClient,
  orgId: string,
  ancestorId: string,
  maybeChildId: string
) {
  let cur = await prisma.orgUnit.findFirst({
    where: { id: maybeChildId, orgId },
    select: { parentId: true },
  });
  while (cur?.parentId) {
    if (cur.parentId === ancestorId) return true;
    cur = await prisma.orgUnit.findFirst({
      where: { id: cur.parentId, orgId },
      select: { parentId: true },
    });
  }
  return false;
}

// GET /orgs/:id/units (flat list)
r.get(
  '/:id/units',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });
    console.log('called units');
    const units = await prisma.orgUnit.findMany({
      where: { orgId: p.data.id },
      select: {
        id: true,
        name: true,
        parentId: true,

        code: true,
        path: true,
        type: true,
        meta: true,
        createdAt: true,
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, members: true } },
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    res.json(
      units.map((u) => ({
        ...u,
        parentName: u.parent?.name ?? null,
      }))
    );
  }
);

// GET /orgs/:id/units/tree
r.get(
  '/:id/units/tree',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    console.log('called');
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });
    const units = await prisma.orgUnit.findMany({
      where: { orgId: p.data.id },
      select: {
        id: true,
        name: true,
        parentId: true,
        code: true,
        type: true,
        createdAt: true,
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    const byId = new Map(
      units.map((u) => [u.id, { ...u, children: [] as any[] }])
    );
    const roots: any[] = [];
    for (const u of byId.values()) {
      if (u.parentId && byId.has(u.parentId))
        byId.get(u.parentId)!.children.push(u);
      else roots.push(u);
    }
    res.json(roots);
  }
);

// GET detail by unitId
r.get(
  '/:id/units/:unitId',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const p = UnitParams.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const unit = await prisma.orgUnit.findFirst({
      where: { id: p.data.unitId, orgId: p.data.id },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
        type: true,
        meta: true,
        createdAt: true,
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, members: true } },
      },
    });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    res.json({ ...unit, parentName: unit.parent?.name ?? null });
  }
);

// POST /orgs/:id/units
r.post(
  '/:id/units',
  requireAuth,
  requirePermission('org.update'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });

    const body = CreateUnitBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid body' });

    if (body.data.parentId) {
      const parent = await prisma.orgUnit.findFirst({
        where: { id: body.data.parentId, orgId: p.data.id },
        select: { id: true },
      });
      if (!parent)
        return res.status(400).json({ error: 'Parent not in this org' });
    }

    const creatingRoot = !body.data.parentId;
    if (creatingRoot) {
      const existingRoot = await prisma.orgUnit.findFirst({
        where: { orgId: p.data.id, parentId: null },
        select: { id: true },
      });
      if (existingRoot) {
        return res.status(409).json({ error: 'Root unit already exists' });
      }
    }

    const unit = await prisma.orgUnit.create({
      data: {
        orgId: p.data.id,
        name: body.data.name,
        parentId: body.data.parentId ?? null,
        code: body.data.code,
        type: body.data.type,
        meta: body.data.meta,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        code: true,
        type: true,
        meta: true,
        createdAt: true,
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, members: true } },
      },
    });
    res.status(201).json({ ...unit, parentName: unit.parent?.name ?? null });
  }
);

// PATCH /orgs/:id/units/:unitId
r.patch(
  '/:id/units/:unitId',
  requireAuth,
  requirePermission('org.update'),
  async (req, res) => {
    const p = UnitParams.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const body = UpdateUnitBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid body' });

    const unit = await prisma.orgUnit.findFirst({
      where: { id: p.data.unitId, orgId: p.data.id },
      select: { id: true, parentId: true },
    });

    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const wantsParentId =
      'parentId' in body.data ? (body.data.parentId ?? null) : undefined;

    if (
      wantsParentId &&
      (await isDescendant(prisma, p.data.id, p.data.unitId, wantsParentId))
    ) {
      return res
        .status(400)
        .json({ error: 'Cannot move a unit under its own descendant' });
    }

    if (wantsParentId !== undefined) {
      if (unit.parentId === null && wantsParentId !== null) {
        return res.status(403).json({ error: 'Cannot reparent the root unit' });
      }

      if (unit.parentId !== null && wantsParentId === null) {
        const existingRoot = await prisma.orgUnit.findFirst({
          where: {
            orgId: p.data.id,
            parentId: null,
            NOT: { id: p.data.unitId },
          },
          select: { id: true },
        });
        if (existingRoot) {
          return res.status(409).json({ error: 'Root unit already exists' });
        }
      }

      if (wantsParentId) {
        const parent = await prisma.orgUnit.findFirst({
          where: { id: wantsParentId, orgId: p.data.id },
          select: { id: true },
        });
        if (!parent) {
          return res.status(400).json({ error: 'New parent not in this org' });
        }
        if (wantsParentId === p.data.unitId) {
          return res
            .status(400)
            .json({ error: 'Cannot set unit as its own parent' });
        }
      }
    }

    if (body.data.parentId) {
      const parent = await prisma.orgUnit.findFirst({
        where: { id: body.data.parentId, orgId: p.data.id },
        select: { id: true },
      });
      if (!parent)
        return res.status(400).json({ error: 'New parent not in this org' });
      if (body.data.parentId === p.data.unitId)
        return res
          .status(400)
          .json({ error: 'Cannot set unit as its own parent' });
    }

    const updated = await prisma.orgUnit.update({
      where: { id: p.data.unitId },
      data: {
        name: body.data.name,
        code: body.data.code,
        parentId:
          body.data.parentId ??
          (body.data.parentId === null ? null : undefined),
        type: body.data.type,
        meta: body.data.meta,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        code: true,
        type: true,
        meta: true,
        createdAt: true,
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, members: true } },
      },
    });
    res.json({ ...updated, parentName: updated.parent?.name ?? null });
  }
);

// DELETE /orgs/:id/units/:unitId?force=true
r.delete(
  '/:id/units/:unitId',
  requireAuth,
  requirePermission('org.update'),
  async (req, res) => {
    const p = UnitParams.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const force = String(req.query.force || '').toLowerCase() === 'true';

    const unit = await prisma.orgUnit.findFirst({
      where: { id: p.data.unitId, orgId: p.data.id },
      select: { id: true, parentId: true, name: true },
    });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    if (unit.parentId === null) {
      return res.status(403).json({ error: 'Cannot delete the root unit' });
    }

    const [childrenCount, memberCount] = await Promise.all([
      prisma.orgUnit.count({ where: { parentId: p.data.unitId } }),
      prisma.orgMembership.count({
        where: { orgId: p.data.id, unitId: p.data.unitId },
      }),
    ]);

    if (childrenCount > 0 || memberCount > 0) {
      if (!force) {
        return res.status(409).json({
          error: 'Unit not empty',
          details: {
            childrenCount,
            memberCount,
            hint: 'This unit has children and/org members. An admin with elevated permission may pass ?force=true to detach members and lift children to root.',
          },
        });
      } else {
        if (!(await assertPermission(req, res, 'org.units.forceDelete')))
          return;
      }
    }

    if (force && (childrenCount > 0 || memberCount > 0)) {
      await prisma.$transaction([
        prisma.orgMembership.updateMany({
          where: { orgId: p.data.id, unitId: p.data.unitId },
          data: { unitId: null },
        }),
        prisma.orgUnit.updateMany({
          where: { parentId: p.data.unitId },
          data: { parentId: null },
        }),
      ]);
    }

    await prisma.orgUnit.delete({ where: { id: p.data.unitId } });
    res.sendStatus(204);
  }
);

export default r;
