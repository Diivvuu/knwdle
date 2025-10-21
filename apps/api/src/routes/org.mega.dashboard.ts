import { Router } from 'express';
import { z } from 'zod';

import { OrgType, OrgUnitType, ParentRole } from '../generated/prisma';

import { getMetaSchema } from '../lib/org.types';

import { requireAuth } from '../middleware/auth';
import {
  PERMISSIONS_BY_BASE_ROLE,
  requirePermission,
} from '../middleware/permissions';
import { prisma } from '../lib/prisma';
import { createGetObjectUrl } from '../lib/s3';

type MyUnitRole = { role: ParentRole; unitId: string | null };

const r = Router();

const CreateOrgBody = z.object({
  name: z.string().trim().min(2),
  type: z.nativeEnum(OrgType),
  meta: z.unknown().optional(),
  teamSize: z.string().min(1).optional(),
});

const IMAGE_REF = z
  .string()
  .min(1)
  .regex(/^(https?:\/\/|(?:users|orgs)\/)[^\s]+$/i, 'Must be a URL or S3 key');

const UpdateOrgBody = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  teamSize: z.string().min(1).optional().nullable(),
  country: z
    .union([
      z
        .string()
        .length(2)
        .transform((s) => s.toUpperCase()),
      z.null(),
    ])
    .optional(),
  timezone: z.string().min(1).optional().nullable(),
  logoUrl: IMAGE_REF.optional().nullable(),
  coverUrl: IMAGE_REF.optional().nullable(),
  brand_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/)
    .optional()
    .nullable(),
  address: z.string().optional().nullable(),
  contactPhone: z.string().min(3).max(32).optional().nullable(),
  meta: z.unknown().optional(),
});

const IdParam = z.object({ id: z.string().min(1) });

function extractKeyFromS3Url(maybeUrl?: string | null): string | undefined {
  if (!maybeUrl) return undefined;

  try {
    const u = new URL(maybeUrl);

    if (!/\.amazonaws\.com$/.test(u.hostname)) return undefined;

    const path = decodeURIComponent(u.pathname.replace(/^\/+/, ''));

    if (path.startsWith('users/') || path.startsWith('orgs/')) {
      return path;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function normalizeImageRef(v?: string | null): string | null | undefined {
  if (v === null) return null; // explicit clear
  if (!v) return undefined;
  if (!/^https?:\/\//i.test(v)) return v; // plain key
  const key = extractKeyFromS3Url(v);
  return key ?? v; // if it's our presigned → key, else keep public URL
}

async function assertOrgMember(orgId: string, userId: string) {
  const m = await prisma.orgMembership.findFirst({
    where: { orgId, userId },
    select: { id: true },
  });
  return Boolean(m);
}

async function isOrgAdmin(orgId: string, userId: string) {
  const m = await prisma.orgMembership.findFirst({
    where: { orgId, userId, role: ParentRole.admin },
    select: { id: true },
  });
  return Boolean(m);
}

async function getMyRoleForOrg(orgId: string, userId: string) {
  const ms = await prisma.orgMembership.findMany({
    where: { orgId, userId },
    select: { role: true, unitId: true },
  });

  const order = [
    ParentRole.admin,
    ParentRole.staff,
    ParentRole.student,
    ParentRole.parent,
  ];

  const myUnitRoles: MyUnitRole[] = ms.map((m) => ({
    role: m.role,
    unitId: m.unitId ?? null,
  }));

  const myRole = order.find(
    (r) => ms.some((m) => m.role === r) ?? ms[0]?.role ?? null
  );

  return { myRole, myUnitRoles };
}

// get user permissions
async function getUserPermissionsFromOrg(orgId: string, userId: string) {
  const membership = await prisma.orgMembership.findFirst({
    where: { orgId, userId },
    select: { role: true, roleId: true },
  });

  if (!membership) return [];

  if (membership.role === ParentRole.admin) return ['*'];
  if (membership.roleId) {
    const role = await prisma.role.findUnique({
      where: { id: membership.roleId },
      include: { permissions: { include: { permission: true } } },
    });

    return role?.permissions.map((p) => p.permission.code) ?? [];
  }
  return PERMISSIONS_BY_BASE_ROLE[membership.role] ?? [];
}

r;
//post org
r.post('/orgs', requireAuth, async (req, res) => {
  const parsed = CreateOrgBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { name, type, teamSize, meta } = parsed.data;
  const schema = getMetaSchema(type);
  const metaParsed = schema.safeParse(meta ?? {});
  if (!metaParsed.success) {
    return res
      .status(422)
      .json({ error: 'Invalid meta', details: metaParsed.error.flatten() });
  }

  try {
    const org = await prisma.$transaction(async (tx) => {
      //create org
      const created = await tx.organisation.create({
        data: {
          name,
          type,
          teamSize,
          profile: { create: { meta: metaParsed.data } },
          members: { create: { userId: req.user!.id, role: ParentRole.admin } },
        },
        include: { profile: true },
      });

      await tx.orgUnit.create({
        data: {
          orgId: created.id,
          name: 'Main',
          parentId: null,
          type: OrgUnitType.OTHER,
          meta: {},
        },
      });
      return created;
    });
    return res.status(201).json(org);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create org' });
  }
});

// Treat non-HTTP(S) strings as S3 keys we need to presign
const isS3Key = (v?: string | null) => !!v && !/^https?:\/\//i.test(v);

// get my orgs
r.get('/orgs', requireAuth, async (req, res) => {
  const orgs = await prisma.organisation.findMany({
    where: { members: { some: { userId: req.user!.id } } },
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  });

  const withExtras = await Promise.all(
    orgs.map(async (o) => {
      // derive keys first (works for keys OR old presigned URLs)
      const logoKey =
        (isS3Key(o.logoUrl as any)
          ? (o.logoUrl as string)
          : extractKeyFromS3Url(o.logoUrl || undefined)) || undefined;

      const coverKey =
        (isS3Key(o.coverUrl as any)
          ? (o.coverUrl as string)
          : extractKeyFromS3Url(o.coverUrl || undefined)) || undefined;

      const [{ myRole, myUnitRoles }, permissions, logoUrl, coverUrl] =
        await Promise.all([
          getMyRoleForOrg(o.id, req.user!.id),
          getUserPermissionsFromOrg(o.id, req.user!.id),
          (async () =>
            logoKey
              ? await createGetObjectUrl({ key: logoKey, expiresInSec: 300 })
              : (o.logoUrl as string | null))(),
          (async () =>
            coverKey
              ? await createGetObjectUrl({ key: coverKey, expiresInSec: 300 })
              : (o.coverUrl as string | null))(),
        ]);

      return {
        ...o,
        // expose keys only when they are actual keys (or extracted from our presigned URLs)
        logoKey,
        coverKey,
        // expose fresh (or original public) URLs
        logoUrl: logoUrl ?? null,
        coverUrl: coverUrl ?? null,
        myRole,
        myUnitRoles,
        permissions,
      };
    })
  );

  res.json(withExtras);
});

// get single org
r.get('/orgs/:id', requireAuth, async (req, res) => {
  const p = IdParam.safeParse(req.params);
  if (!p.success) return res.status(400).json({ error: 'Bad org id' });

  const isMember = await assertOrgMember(p.data.id, req.user!.id);
  if (!isMember) return res.status(401).json({ error: 'Org not found' });

  const org = await prisma.organisation.findUnique({
    where: { id: p.data.id },
    include: { profile: true },
  });
  if (!org) return res.status(404).json({ error: 'Org not found' });

  const { myRole, myUnitRoles } = await getMyRoleForOrg(org.id, req.user!.id);

  // derive keys first (works for keys OR old presigned URLs)
  const logoKey =
    (isS3Key(org.logoUrl as any)
      ? (org.logoUrl as string)
      : extractKeyFromS3Url(org.logoUrl || undefined)) || undefined;

  const coverKey =
    (isS3Key(org.coverUrl as any)
      ? (org.coverUrl as string)
      : extractKeyFromS3Url(org.coverUrl || undefined)) || undefined;

  const [logoUrl, coverUrl] = await Promise.all([
    logoKey
      ? createGetObjectUrl({ key: logoKey, expiresInSec: 300 })
      : (org.logoUrl as string | null),
    coverKey
      ? createGetObjectUrl({ key: coverKey, expiresInSec: 300 })
      : (org.coverUrl as string | null),
  ]);

  res.json({
    ...org,
    logoKey,
    coverKey,
    logoUrl: logoUrl ?? null,
    coverUrl: coverUrl ?? null,
    myRole,
    myUnitRoles,
  });
});

//update org settings
r.patch(
  '/orgs/:id',
  requireAuth,
  requirePermission('org.update'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });

    const body = UpdateOrgBody.safeParse(req.body);
    if (!body.success) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: body.error.flatten() });
    }

    const isAdmin = await isOrgAdmin(p.data.id, req.user!.id);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const org = await prisma.organisation.findUnique({
      where: { id: p.data.id },
      include: { profile: true },
    });

    if (!org) return res.status(404).json({ error: 'Org not found' });

    let metadata: unknown | undefined = undefined;
    if (body.data.meta !== undefined) {
      const schema = getMetaSchema(org.type as OrgType);
      const metaParsed = schema.safeParse(body.data.meta);
      if (!metaParsed.success) {
        return res
          .status(422)
          .json({ error: 'Invalid meta', details: metaParsed.error.flatten() });
      }

      metadata = metaParsed.data;
    }

    const d: any = {};
    for (const k of [
      'name',
      'description',
      'teamSize',
      'country',
      'timezone',
      // 'logoUrl',
      // 'coverUrl',
      'brand_color',
      'address',
      'contactPhone',
    ] as const) {
      if (body.data[k] !== undefined) d[k] = body.data[k];
    }

    if (body.data.logoUrl !== undefined) {
      d.logoUrl = normalizeImageRef(body.data.logoUrl);
    }
    if (body.data.coverUrl !== undefined) {
      d.coverUrl = normalizeImageRef(body.data.coverUrl);
    }

    const updated = await prisma.organisation.update({
      where: { id: p.data.id },
      data: {
        ...d,
        profile: metadata
          ? {
              upsert: {
                create: { meta: metadata },
                update: { meta: metadata },
              },
            }
          : undefined,
      },
      include: { profile: true },
    });

    const logoKey =
      (isS3Key(updated.logoUrl as any)
        ? (updated.logoUrl as string)
        : extractKeyFromS3Url(updated.logoUrl || undefined)) || undefined;

    const coverKey =
      (isS3Key(updated.coverUrl as any)
        ? (updated.coverUrl as string)
        : extractKeyFromS3Url(updated.coverUrl || undefined)) || undefined;

    const [logoUrl, coverUrl] = await Promise.all([
      logoKey
        ? createGetObjectUrl({ key: logoKey, expiresInSec: 300 })
        : (updated.logoUrl as string | null),
      coverKey
        ? createGetObjectUrl({ key: coverKey, expiresInSec: 300 })
        : (updated.coverUrl as string | null),
    ]);

    res.json({
      ...updated,
      logoKey,
      coverKey,
      logoUrl: logoUrl ?? null,
      coverUrl: coverUrl ?? null,
    });
  }
);

// delete org (hard restriction)
r.delete(
  '/orgs/:id',
  requireAuth,
  requirePermission('org.update'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });

    const isAdmin = await isOrgAdmin(p.data.id, req.user!.id);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    await prisma.organisation.delete({ where: { id: p.data.id } }); //cascade manually (remove if done in schema)
    res.status(204).send();
  }
);

export default r;
