// permissions.ts
import { NextFunction, Request, Response } from 'express';
import { OrgType, ParentRole } from '../generated/prisma';
import z from 'zod';
import { getMetaSchema } from '../lib/org-types';
import { prisma } from '../lib/prisma';

export const PERMISSIONS_BY_BASE_ROLE: Record<ParentRole, string[]> = {
  admin: ['*'],
  staff: [
    'org.read',
    'org.unit.manage', // (optional) broader unit mgmt
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
    const orgId = (req.params.id ?? req.params.orgId) as string | undefined;
    if (!orgId) return res.status(400).json({ error: 'Missing orgId params' });

    if (!(req as any).user?.id)
      return res.status(401).json({ error: 'Unauthenticated' });

    const membership = await prisma.orgMembership.findFirst({
      where: { orgId, userId: (req as any).user.id },
      select: { role: true, roleId: true },
    });

    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // Admin base-role shortcut
    if (membership.role === 'admin') return next();

    // Custom role permissions (exact match)
    if (membership.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: membership.roleId },
        include: { permissions: { include: { permission: true } } },
      });
      const has = role?.permissions.some((p) => p.permission.code === code);
      return has ? next() : res.status(403).json({ error: 'Forbidden' });
    }

    // Base role permissions (supports '*' or exact)
    const perms = PERMISSIONS_BY_BASE_ROLE[membership.role] ?? [];
    const allowed = perms.includes('*') || perms.includes(code);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    next();
  };
}

/** Boolean check version for places where you can’t (or don’t want to) chain middleware */
export async function hasPermission(
  req: Request,
  code: string
): Promise<boolean> {
  const orgId = (req.params.id ?? req.params.orgId) as string | undefined;
  if (!orgId) return false;
  const userId = (req as any).user?.id;
  if (!userId) return false;

  const membership = await prisma.orgMembership.findFirst({
    where: { orgId, userId },
    select: { role: true, roleId: true },
  });
  if (!membership) return false;

  if (membership.role === 'admin') return true;

  if (membership.roleId) {
    const role = await prisma.role.findUnique({
      where: { id: membership.roleId },
      include: { permissions: { include: { permission: true } } },
    });
    return !!role?.permissions.some((p) => p.permission.code === code);
  }

  const perms = PERMISSIONS_BY_BASE_ROLE[membership.role] ?? [];
  return perms.includes('*') || perms.includes(code);
}

/** Convenience wrapper to use like middleware when you’re already inside a handler */
export async function assertPermission(
  req: Request,
  res: Response,
  code: string
) {
  if (await hasPermission(req, code)) return true;
  res.status(403).json({ error: 'Forbidden' });
  return false;
}

export function requireFeature(
  feature: keyof z.infer<ReturnType<typeof getMetaSchema>>['features']
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const orgId = (req.params.id ?? req.params.orgId) as string | undefined;
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
