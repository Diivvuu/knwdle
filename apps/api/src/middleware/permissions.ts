// permissions.ts
import { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { prisma } from '../lib/prisma';
import { OrgType, ParentRole, OrgUnitType } from '../generated/prisma';
import { FEATURE_DEFAULTS, FeatureKey } from '../lib/org.unit.rules';

/* -------------------------------------------------------------------------- */
/*  Role → permissions map (unchanged)                                         */
/* -------------------------------------------------------------------------- */

export const PERMISSIONS_BY_BASE_ROLE: Record<ParentRole, string[]> = {
  admin: ['*'],
  staff: [
    'org.read',
    'org.unit.manage', // optional broader unit mgmt
    'teaching.content.manage',
    'teaching.attendance.manage',
    'comms.announce.manage',
    'reports.read',
    'people.view',
  ],
  student: ['org.read', 'reports.read'],
  parent: ['org.read', 'reports.read'],
};

/* -------------------------------------------------------------------------- */
/*  Permission checks                                                          */
/* -------------------------------------------------------------------------- */

export function requirePermission(code: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const orgId = (req.params.id ?? req.params.orgId) as string | undefined;
    if (!orgId) return res.status(400).json({ error: 'Missing orgId params' });

    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const membership = await prisma.orgMembership.findFirst({
      where: { orgId, userId },
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

/* -------------------------------------------------------------------------- */
/*  ✅ NEW: Feature gating based on rulebook (OrgType × OrgUnitType)           */
/* -------------------------------------------------------------------------- */

/**
 * Checks the feature *at Organisation level* (i.e., imagine the "unitType" = ORGANISATION).
 * Useful for endpoints that are org-scoped (e.g., global announcements),
 * not tied to a specific unitId.
 */
export function requireOrgFeature(feature: FeatureKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const orgId = (req.params.id ?? req.params.orgId) as string | undefined;
    if (!orgId) return res.status(400).json({ error: 'Missing orgId param' });

    const org = await prisma.organisation.findUnique({
      where: { id: orgId },
      select: { type: true },
    });
    if (!org) return res.status(404).json({ error: 'Organisation not found' });

    const flags = (FEATURE_DEFAULTS[org.type] ?? {})[OrgUnitType.ORGANISATION];
    const enabled = !!flags?.[feature];

    if (!enabled)
      return res
        .status(403)
        .json({
          error: `Feature "${feature}" not enabled at organisation level`,
        });

    next();
  };
}

/**
 * ✅ Preferred: Checks a feature for a *specific unit* using OrgType × UnitType matrix.
 * Use this on routes like /orgs/:orgId/units/:unitId/attendance, etc.
 */
export function requireUnitFeature(feature: FeatureKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const orgId = (req.params.id ?? req.params.orgId) as string | undefined;
    const unitId = (req.params.unitId ?? req.params.id2) as string | undefined;
    if (!orgId) return res.status(400).json({ error: 'Missing orgId param' });
    if (!unitId) return res.status(400).json({ error: 'Missing unitId param' });

    const unit = await prisma.orgUnit.findFirst({
      where: { id: unitId, orgId },
      select: { type: true, org: { select: { type: true } } },
    });
    if (!unit) return res.status(404).json({ error: 'Org unit not found' });

    const orgType: OrgType = unit.org.type;
    const unitType: OrgUnitType = unit.type;

    const flags = (FEATURE_DEFAULTS[orgType] ?? {})[unitType];
    const enabled = !!flags?.[feature];

    if (!enabled)
      return res.status(403).json({
        error: `Feature "${feature}" is not enabled for unit type "${unitType}" in org type "${orgType}"`,
      });

    next();
  };
}

/* -------------------------------------------------------------------------- */
/*  Optional: boolean helpers for handlers that can't use middleware chain     */
/* -------------------------------------------------------------------------- */

export async function hasOrgFeature(
  orgId: string,
  feature: FeatureKey
): Promise<boolean> {
  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: { type: true },
  });
  if (!org) return false;
  const flags = (FEATURE_DEFAULTS[org.type] ?? {})[OrgUnitType.ORGANISATION];
  return !!flags?.[feature];
}

export async function hasUnitFeature(
  orgId: string,
  unitId: string,
  feature: FeatureKey
): Promise<boolean> {
  const unit = await prisma.orgUnit.findFirst({
    where: { id: unitId, orgId },
    select: { type: true, org: { select: { type: true } } },
  });
  if (!unit) return false;
  const flags = (FEATURE_DEFAULTS[unit.org.type] ?? {})[unit.type];
  return !!flags?.[feature];
}
