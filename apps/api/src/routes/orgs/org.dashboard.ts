import { Router } from 'express';
import z from 'zod';
import { ParentRole } from '../../generated/prisma';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { prisma } from '../../lib/prisma';

const r = Router();

const IdParam = z.object({ id: z.string().min(1) });

function asOrgNotFound(res: any) {
  return res.status(404).json({ error: 'Org not found' });
}

// GET /orgs/:id
r.get('/:id', requireAuth, requirePermission('org.read'), async (req, res) => {
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
});

// GET /orgs/:id/summary
r.get(
  '/:id/summary',
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
      lastJoinat: latestMember?.createdAt ?? null, // unchanged for your slice normalizer
    });
  }
);

export default r;
