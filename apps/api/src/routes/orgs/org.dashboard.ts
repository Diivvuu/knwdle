import { Router } from 'express';
import z from 'zod';
import { ParentRole } from '../../generated/prisma';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { prisma } from '../../lib/prisma';
import { createGetObjectUrl } from '../../lib/s3';

const r = Router();

const IdParam = z.object({ id: z.string().min(1) });

// Treat non-HTTP(S) strings as S3 keys we need to presign
const isS3Key = (v?: string | null) => !!v && !/^https?:\/\//i.test(v);

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

  // If stored values are S3 keys, presign short-lived view URLs
  const logoKey = isS3Key(org.logoUrl as any) ? (org.logoUrl as string) : undefined;
  const coverKey = isS3Key(org.coverUrl as any) ? (org.coverUrl as string) : undefined;

  const [signedLogoUrl, signedCoverUrl] = await Promise.all([
    logoKey
      ? createGetObjectUrl({ key: logoKey, expiresInSec: 60 })
      : Promise.resolve(org.logoUrl as string | null),
    coverKey
      ? createGetObjectUrl({ key: coverKey, expiresInSec: 60 })
      : Promise.resolve(org.coverUrl as string | null),
  ]);

  res.json({
    ...org,
    // keep original key values available when applicable
    logoKey,
    coverKey,
    // override URLs to be either original http(s) or presigned
    logoUrl: signedLogoUrl ?? null,
    coverUrl: signedCoverUrl ?? null,
    aggregates: { unitsCount, membersCount },
  });
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
      lastJoinat: latestMember?.createdAt ?? null,
    });
  }
);

export default r;
