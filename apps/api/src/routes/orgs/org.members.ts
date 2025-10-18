import { Router } from 'express';
import z from 'zod';
import { ParentRole } from '../../generated/prisma';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { prisma } from '../../lib/prisma';

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

// GET /orgs/:id/members
r.get(
  '/:id/members',
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
        user: { select: { email: true, name: true } },
      },
    });

    const slice = rows.slice(0, limit);
    const items = slice.map((m) => ({
      id: m.id,
      orgId: m.orgId,
      userId: m.userId,
      email: m.user?.email || null,
      name: m.user?.name || null,
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

// GET /orgs/:id/units/:unitId/members
r.get(
  '/:id/units/:unitId/members',
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

// PATCH /orgs/:id/members/:userId  (base role)
r.patch(
  '/:id/members/:userId',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const p = MemberParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const b = z.object({ role: z.nativeEnum(ParentRole) }).safeParse(req.body);
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
        orgId: true,
      },
    });
    res.json(updated);
  }
);

// PATCH /orgs/:id/members/:userId/unit
r.patch(
  '/:id/members/:userId/unit',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const p = MemberParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad params' });

    const b = z
      .object({ unitId: z.string().min(1).nullable() })
      .safeParse(req.body);
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
        orgId: true,
      },
    });

    res.json(updated);
  }
);

// PATCH /orgs/:id/members/role (assign/remove custom role)
r.patch(
  '/:id/members/role',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const b = z
      .object({
        userId: z.string().min(1),
        roleId: z.string().min(1).nullable(),
      })
      .safeParse(req.body);
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
        orgId: true,
      },
    });
    res.json(updated);
  }
);

// DELETE /orgs/:id/members/:userId
r.delete(
  '/:id/members/:userId',
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

export default r;
