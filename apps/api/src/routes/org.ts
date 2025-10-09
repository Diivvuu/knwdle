import z from 'zod';
import { Router } from 'express';

import { ParentRole, PrismaClient } from '../generated/prisma';

import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const prisma = new PrismaClient();
const r = Router();

const IdParam = z.object({ id: z.string().min(1) });
const UnitParams = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
});
const MemberParam = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});

const MembersQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  role: z.nativeEnum(ParentRole).optional(),
  unitId: z.string().min(1).optional(),
  q: z.string().trim().min(1).max(120).optional(),
});

const CreateUnitBody = z.object({
  name: z.string().min(2),
  parentId: z.string().min(1).nullable().optional(),
  code: z.string().trim().max(24).optional(),
});

const UpdateUnitBody = z.object({
  name: z.string().min(2).optional(),
  parentId: z.string().min(1).nullable().optional(),
  code: z.string().trim().max(24).optional(),
});

const PatchMemberBaseRoleBody = z.object({
  role: z.nativeEnum(ParentRole),
});
const PatchMemberUnitBody = z.object({
  unitId: z.string().min(1).nullable(),
});
const AssignCustomBody = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1).nullable(),
});

//helpers
function asOrgNotFound(res: any) {
  return res.status(404).json({ error: 'Org not found' });
}
function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');
}
function decodeCursor(raw?: string) {
  if (!raw) return null;
  try {
    const [iso, id] = Buffer.from(raw, 'base64url').toString('utf8').split('|');
    return { createdAt: new Date(iso), id };
  } catch {
    return null;
  }
}

//  get org basic info by id
r.get(
  '/orgs/:id',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });

    const org = await prisma.organisation.findUnique({
      where: { id: p.data.id },
      include: { profile: true },
    });
    if (!org) return asOrgNotFound(res);

    const [unitsCount, membersCount] = await Promise.all([
      prisma.orgUnit.count({ where: { orgId: org.id } }),
      prisma.orgMembership.count({ where: { orgId: org.id } }),
    ]);

    res.json({ ...org, aggregates: { unitsCount, membersCount } });
  }
);

// get org summary by id
r.get(
  '/orgs/:id/summary',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });

    const org = await prisma.organisation.findUnique({
      where: { id: p.data.id },
      select: { id: true },
    });

    if (!org) return asOrgNotFound(res);

    const [
      unitsCount,
      adminCount,
      staffCount,
      studentCount,
      parentCount,
      pendingInvites,
      latestMember,
    ] = await Promise.all([
      prisma.orgUnit.count({ where: { orgId: org.id } }),
      prisma.orgMembership.count({
        where: { orgId: org.id, role: ParentRole.admin },
      }),
      prisma.orgMembership.count({
        where: { orgId: org.id, role: ParentRole.staff },
      }),
      prisma.orgMembership.count({
        where: { orgId: org.id, role: ParentRole.student },
      }),
      prisma.orgMembership.count({
        where: { orgId: org.id, role: ParentRole.parent },
      }),
      prisma.invite.count({
        where: {
          orgId: org.id,
          acceptedBy: null,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.orgMembership.findFirst({
        where: { orgId: org.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    res.json({
      unitsCount,
      roleCounts: {
        admin: adminCount,
        staff: staffCount,
        student: studentCount,
        parent: parentCount,
      },
      pendingInvites,
      lastJoinat: latestMember?.createdAt ?? null,
    });
  }
);

// get org flat list
r.get(
  '/orgs/:id/units',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });

    const units = await prisma.orgUnit.findMany({
      where: { orgId: p.data.id },
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true,
        code: true,
        path: true,
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    res.json(units);
  }
);

//members paginated list
r.get(
  '/orgs/:id/members',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const pId = IdParam.safeParse(req.params);
    if (!pId.success) return res.status(400).json({ error: 'Bad org id' });

    const q = MembersQuery.safeParse(req.query);
    if (!q.success) return res.status(400).json({ error: 'Invalid query' });

    const { limit, cursor, role, unitId, q: term } = q.data;
    const cursorVal = decodeCursor(cursor || undefined);

    const where: any = { orgId: pId.data.id };
    if (role) where.role = role;
    if (unitId) where.unitId = unitId;
    if (term) {
      where.user = {
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
        ],
      };
    }

    if (cursorVal) {
      where.OR = [
        { createdAt: { lt: cursorVal.createdAt } },
        { createdAt: cursorVal.createdAt, id: { lt: cursorVal.id } },
      ];
    }

    const rows = await prisma.orgMembership.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        orgId: true,
        userId: true,
        role: true,
        unitId: true,
        roleId: true,
        createdAt: true,
        user: {
          select: { email: true, name: true },
        },
      },
    });

    const items = rows.slice(0, limit).map((m) => ({
      id: m.orgId,
      userId: m.userId,
      email: m.user?.email,
      name: m.user?.name,
      role: m.role,
      unitId: m.unitId ?? null,
      roleId: m.roleId ?? null,
      joinedAt: m.createdAt,
    }));

    const hasMore = rows.length > limit;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor(last.joinedAt, last.id) : null;

    res.json({ items, nextCursor });
  }
);

// for particular unit members
r.get(
  '/orgs/:id/units/:unitId/members',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const p = UnitParams.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const q = MembersQuery.safeParse(req.query);
    if (!q.success) return res.status(400).json({ error: 'Invalid query' });

    const { limit, cursor, role, q: term } = q.data;
    const c = decodeCursor(cursor);

    const where: any = { orgId: p.data.id, unitId: p.data.unitId };
    if (role) where.role = role;
    if (term) {
      where.user = {
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
        ],
      };
    }
    if (c) {
      where.OR = [
        { createdAt: { lt: c.createdAt } },
        { createdAt: c.createdAt, id: { lt: c.id } },
      ];
    }

    const rows = await prisma.orgMembership.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        orgId: true,
        userId: true,
        role: true,
        unitId: true,
        roleId: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
      },
    });

    const items = rows.slice(0, limit).map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user?.email ?? null,
      name: m.user?.name ?? null,
      role: m.role,
      unitId: m.unitId ?? null,
      roleId: m.roleId ?? null,
      joinedAt: m.createdAt,
    }));

    const hasMore = rows.length > limit;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor(last.joinedAt, last.id) : null;

    res.json({ items, nextCursor });
  }
);

// member mutations kept minimal

r.patch(
  '/orgs/:id/members/:userId',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const p = MemberParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const b = PatchMemberBaseRoleBody.safeParse(req.body);
    if (!b.success) return res.status(400).json({ error: 'Invalid Body' });

    const membership = await prisma.orgMembership.findFirst({
      where: { orgId: p.data.id, userId: p.data.userId },
      select: { id: true },
    });

    if (!membership)
      return res.status(404).json({ error: 'Membership not found' });

    const updated = await prisma.orgMembership.update({
      where: { id: membership.id },
      data: { role: b.data.role },
      select: {
        id: true,
        userId: true,
        role: true,
        unitId: true,
        roleId: true,
      },
    });
    res.json(updated);
  }
);

r.patch(
  '/orgs/:id/members/:userId/unit',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const p = MemberParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const b = PatchMemberUnitBody.safeParse(req.body);
    if (!b.success) return res.status(400).json({ error: 'Invalid Body' });

    const membership = await prisma.orgMembership.findFirst({
      where: { orgId: p.data.id, userId: p.data.userId },
      select: { id: true },
    });
    if (!membership)
      return res.status(404).json({ error: 'Membership not found' });

    if (b.data.unitId) {
      const unit = await prisma.orgUnit.findFirst({
        where: { id: b.data.unitId, orgId: p.data.id },
        select: { id: true },
      });
      if (!unit)
        return res.status(400).json({ error: 'Unit not found in this org' });
    }

    const updated = await prisma.orgMembership.update({
      where: { id: membership.id },
      data: { unitId: b.data.unitId ?? null },
      select: {
        id: true,
        userId: true,
        role: true,
        unitId: true,
        roleId: true,
      },
    });
  }
);

r.patch(
  '/orgs/:id/members/role',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const b = AssignCustomBody.safeParse(req.body);
    if (!b.success) return res.status(400).json({ error: 'Invalid body' });

    if (b.data.roleId) {
      const role = await prisma.role.findFirst({
        where: { id: b.data.roleId, orgId: req.params.id },
        select: { id: true },
      });
      if (!role) return res.status(400).json({ error: 'Role not found' });
    }

    const m = await prisma.orgMembership.findFirst({
      where: { orgId: req.params.id, userId: b.data.userId },
      select: { id: true },
    });
    if (!m) return res.status(400).json({ error: 'Membership not found' });

    const updated = await prisma.orgMembership.update({
      where: { id: m.id },
      data: { roleId: b.data.roleId ?? null },
      select: {
        id: true,
        userId: true,
        role: true,
        unitId: true,
        roleId: true,
      },
    });
    res.json(updated);
  }
);

r.delete(
  '/orgs/:id/members/:userId',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const p = MemberParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const m = await prisma.orgMembership.findFirst({
      where: { orgId: p.data.id, userId: p.data.userId },
      select: { id: true },
    });

    if (!m) return res.status(404).json({ error: 'Membership not found' });

    await prisma.orgMembership.delete({ where: { id: m.id } });
    res.sendStatus(204);
  }
);

// post org unit
r.post(
  '/orgs/:id/units',
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

      const unit = await prisma.orgUnit.create({
        data: {
          orgId: p.data.id,
          name: body.data.name,
          parentId: body.data.parentId ?? null,
          code: body.data.code,
        },
        select: {
          id: true,
          name: true,
          parentId: true,
          code: true,
          createdAt: true,
        },
      });
      res.status(201).json(unit);
    }
  }
);

// update org unit
r.patch(
  '/orgs/:id/units/:unitId',
  requireAuth,
  requirePermission('org.update'),
  async (req, res) => {
    const p = UnitParams.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const body = UpdateUnitBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid body' });

    const unit = await prisma.orgUnit.findFirst({
      where: { id: p.data.unitId, orgId: req.params.id },
      select: { id: true, parentId: true },
    });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    if (body.data.parentId) {
      const parent = await prisma.orgUnit.findFirst({
        where: { id: body.data.parentId, orgId: p.data.id },
        select: { id: true },
      });
      if (!parent)
        return res.status(400).json({ error: 'New parent no in this org' });
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
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        code: true,
        createdAt: true,
      },
    });
    res.json(updated);
  }
);

// delete org unit id - use ?force=true for force delete
r.delete(
  '/orgs/:id/units/:unitId',
  requireAuth,
  requirePermission('org.update'),
  async (req, res) => {
    const p = UnitParams.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const force = String(req.query.force || '').toLowerCase() === 'true';

    const unit = await prisma.orgUnit.findFirst({
      where: { id: p.data.unitId, orgId: p.data.id },
      select: { id: true },
    });

    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const [chidlrenCount, memberCount] = await Promise.all([
      prisma.orgUnit.count({ where: { parentId: p.data.unitId } }),
      prisma.orgMembership.count({
        where: { orgId: p.data.id, unitId: p.data.unitId },
      }),
    ]);
    if (!force && (chidlrenCount > 0 || memberCount > 0)) {
      return res.status(409).json({
        error: 'Unit not empty',
        details: {
          chidlrenCount,
          memberCount,
          hint: 'Pass ?force=true to delete anyway (will detach members reparent children to root/null).',
        },
      });
    }

    if (force) {
      //detach members and reparent children to null
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

r.get(
  '/orgs/:id/units/tree',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });

    const units = await prisma.orgUnit.findMany({
      where: { orgId: p.data.id },
      select: {
        id: true,
        name: true,
        parentId: true,
        code: true,
        createdAt: true,
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    //build tree in-memmory (shallow hierarchies typical in school)
    const byId = new Map(
      units.map((u) => [u.id, { ...u, children: [] as any[] }])
    );
    const roots: any[] = [];
    for (const u of byId.values()) {
      if (u.parentId && byId.has(u.parentId)) {
        byId.get(u.parentId)!.children.push(u);
      } else {
        roots.push(u);
      }
    }
    res.json(roots);
  }
);

export default r;
