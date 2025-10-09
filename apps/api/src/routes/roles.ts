import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import z from 'zod';

import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const prisma = new PrismaClient();
const r = Router();

const scopeEnum = z.enum(['org', 'unit']);

const RoleCreateBody = z.object({
  key: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(80),
  scope: scopeEnum.default('org'),
  permissionCodes: z.array(z.string()).default([]),
});

const RoleUpdateBody = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  scope: scopeEnum.optional(),
  permissionCodes: z.array(z.string()).optional(),
});

// list global permission catalog
r.get(
  '/orgs/:id/permissions',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const perms = await prisma.permission.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
    console.log('returning data', perms);
    res.json(perms);
  }
);

// list roles in an org (custom roles only : base roles are implicit)
r.get(
  '/orgs/:id/roles',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const roles = await prisma.role.findMany({
      where: { orgId: req.params.id },
      include: { permissions: { include: { permission: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(roles);
  }
);

//create role
r.post(
  '/orgs/:id/roles',
  requireAuth,
  requirePermission('roles.manage'),
  async (req, res) => {
    const p = RoleCreateBody.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Invalid input' });

    const { key, name, scope, permissionCodes } = p.data;

    const permRows = await prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true },
    });

    const role = await prisma.role.create({
      data: {
        orgId: req.params.id,
        key,
        name,
        scope,
        parentRole: 'staff',
        permissions: {
          create: permRows.map((pr) => ({ permissionId: pr.id })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });

    res.status(201).json(role);
  }
);

// patch role (permission replace)
r.patch(
  '/orgs/:id/roles/:roleId',
  requireAuth,
  requirePermission('roles.manage'),
  async (req, res) => {
    const p = RoleUpdateBody.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Invalid Input' });

    const { name, scope, permissionCodes } = p.data;

    const role = await prisma.role.findFirst({
      where: { id: req.params.roleId, orgId: req.params.id },
      select: { id: true },
    });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    let connectIds: string[] = [];
    if (permissionCodes) {
      const perms = await prisma.permission.findMany({
        where: { code: { in: permissionCodes } },
        select: { id: true },
      });
      connectIds = perms.map((p) => p.id);
    }

    const updated = await prisma.role.update({
      where: { id: role.id },
      data: {
        name,
        scope,
        permissions: permissionCodes
          ? {
              deleteMany: {},
              create: connectIds.map((id) => ({ permissionId: id })),
            }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });

    res.json(updated);
  }
);

// delete role
r.delete(
  '/orgs/:id/roles/:roleId',
  requireAuth,
  requirePermission('roles.manage'),
  async (req, res) => {
    const { id, roleId } = req.params;
    const role = await prisma.role.findFirst({
      where: { id: roleId, orgId: id },
      select: { id: true },
    });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    await prisma.orgMembership.updateManyAndReturn({
      where: { orgId: id, roleId },
      data: { roleId: null },
    });

    await prisma.orgMembership.updateMany({
      where: { orgId: id, roleId },
      data: { roleId: null },
    });

    await prisma.role.delete({ where: { id: roleId } });
    res.status(204).send();
  }
);

// assign/unassign a custom role to a member
const AssignRoleBody = z.object({
  userId: z.string(),
  roleId: z.string().nullable(),
});

r.patch(
  '/orgs/:id/members/role',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const p = AssignRoleBody.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Invalid Input' });

    const { userId, roleId } = p.data;
    if (roleId) {
      const role = await prisma.role.findFirst({
        where: { id: roleId, orgId: req.params.id },
        select: { id: true },
      });
      if (!role) return res.status(400).json({ error: 'Role not found' });
    }

    const m = await prisma.orgMembership.findFirst({
      where: { orgId: req.params.id, userId },
      select: { id: true },
    });
    if (!m) return res.status(400).json({ error: 'Membership not found' });

    const updated = await prisma.orgMembership.update({
      where: { id: m.id },
      data: { roleId: roleId ?? null },
    });

    res.json(updated);
  }
);

export default r;
