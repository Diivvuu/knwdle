import { NextFunction, Request, Response } from 'express';
import { OrgType, ParentRole, PrismaClient } from '../generated/prisma';
import z from 'zod';

import { getMetaSchema } from '../lib/org-types';

const prisma = new PrismaClient();

const PERMISSIONS_BY_BASE_ROLE: Record<ParentRole, string[]> = {
  admin: ['*'],
  staff: [
    'org.read',
    'teaching.content.manage',
    'teaching.attendance.manage',
    'comms.announce.manage',
    'reports.read',
  ],
  student: ['org.read', 'reports.read'],
  parent: ['org.read', 'reports.read'],
};

export function requirePermission(code: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const orgId = req.params.id ?? req.params.orgId;
    if (!orgId) return res.status(400).json({ error: 'Missing orgId params' });

    console.log(orgId, req.user!.id, 'comparing');

    const membership = await prisma.orgMembership.findFirst({
      where: { orgId, userId: req.user!.id },
      select: { role: true, roleId: true },
    });

    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // id admin - allow all
    if (membership.role === 'admin') return next();

    if (membership.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: membership.roleId },
        include: {
          permissions: { include: { permission: true } },
        },
      });
      const has = role?.permissions.some((p) => p.permission.code === code);
      return has ? next() : res.status(403).json({ error: 'Forbidden' });
    }

    const perms = PERMISSIONS_BY_BASE_ROLE[membership.role] ?? [];
    const allowed = perms.includes('*') || perms.includes(code);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    next();
  };
}

export function requireFeature(
  feature: keyof z.infer<ReturnType<typeof getMetaSchema>>['features']
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const orgId = req.params.id ?? req.params.orgId;
    if (!orgId) return res.status(400).json({ error: 'Missing orgId param' });

    const org = await prisma.organisation.findUnique({
      where: { id: orgId },
      include: { profile: true },
    });

    if (!org?.profile?.meta)
      return res.status(403).json({ error: 'No org found' });

    const schema = getMetaSchema(org.type as OrgType);
    const parsed = schema.safeParse(org.profile.meta);
    if (!parsed.success)
      return res.status(500).json({ error: 'Org meta invalid' });

    if (!parsed.data.features?.[feature])
      return res
        .status(403)
        .json({ error: `Feature "${feature}" not enabled` });

    next();
  };
}
