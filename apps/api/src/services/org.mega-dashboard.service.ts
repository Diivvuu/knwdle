import { OrgType, ParentRole } from '../generated/prisma';
import { OrgRepo } from '../repositories/org.repo';
import { getMetaSchema } from '../lib/org.types';
import { createGetObjectUrl } from '../lib/s3';
import { PERMISSIONS_BY_BASE_ROLE } from '../middleware/permissions';
import { badRequest, forbidden, notFound } from '../lib/https';

function extractKeyFromS3Url(maybeUrl?: string | null): string | undefined {
  if (!maybeUrl) return undefined;
  try {
    const u = new URL(maybeUrl);
    if (!/\.amazonaws\.com$/.test(u.hostname)) return undefined;
    const path = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    if (path.startsWith('users/') || path.startsWith('orgs/')) return path;
    return undefined;
  } catch {
    return undefined;
  }
}

const isS3Key = (v?: string | null) => !!v && !/^https?:\/\//i.test(v);

function normalizeImageRef(v?: string | null): string | null | undefined {
  if (v === null) return null;
  if (!v) return undefined;
  if (!/^https?:\/\//i.test(v)) return v;
  const key = extractKeyFromS3Url(v);
  return key ?? v;
}

async function getMyRoleForOrg(orgId: string, userId: string) {
  const ms = await OrgRepo.getMemberships(orgId, userId);
  const order = [
    ParentRole.admin,
    ParentRole.staff,
    ParentRole.student,
    ParentRole.parent,
  ];

  const myUnitRoles = ms.map((m) => ({
    role: m.role,
    unitId: m.unitId ?? null,
  }));
  const myRole =
    order.find((r) => ms.some((m) => m.role === r)) ?? ms[0]?.role ?? null;

  return { myRole, myUnitRoles };
}

async function getUserPermissionsFromOrg(orgId: string, userId: string) {
  const membership = await OrgRepo.getMembership(orgId, userId);
  if (!membership) return [];

  if (membership.role === 'admin') return ['*'];
  if (membership.roleId) {
    const role = await OrgRepo.getCustomRolePermissionCodes(membership.roleId);
    return role?.permissions.map((p) => p.permission.code) ?? [];
  }
  return PERMISSIONS_BY_BASE_ROLE[membership.role] ?? [];
}

export const OrgDashboardService = {
  async createOrg(
    currentUserId: string,
    payload: {
      name: string;
      type: OrgType;
      teamSize?: string;
      meta?: unknown;
    }
  ) {
    const schema = getMetaSchema(payload.type);
    const parsed = schema.safeParse(payload.meta ?? {});
    if (!parsed.success) {
      throw badRequest('Invalid meta');
    }

    const created = await OrgRepo.createOrgWithMainUnit({
      name: payload.name,
      type: payload.type,
      teamSize: payload.teamSize,
      meta: parsed.data,
      ownerUserId: currentUserId,
    });
    return created;
  },

  async listMyOrgs(currentUserId: string) {
    const orgs = await OrgRepo.listMyOrgs(currentUserId);

    // For each org, derive keys + pre-sign URLs + compute role/permissions
    const withExtras = await Promise.all(
      orgs.map(async (o) => {
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
            getMyRoleForOrg(o.id, currentUserId),
            getUserPermissionsFromOrg(o.id, currentUserId),
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
          logoKey,
          coverKey,
          logoUrl: logoUrl ?? null,
          coverUrl: coverUrl ?? null,
          myRole,
          myUnitRoles,
          permissions,
        };
      })
    );

    return withExtras;
  },

  async getOrg(currentUserId: string, orgId: string) {
    const isMember = await OrgRepo.isMember(orgId, currentUserId);
    if (!isMember) throw forbidden('Org not found');

    const org = await OrgRepo.findByIdWithProfile(orgId);
    if (!org) throw notFound('Org not found');

    const { myRole, myUnitRoles } = await getMyRoleForOrg(
      org.id,
      currentUserId
    );

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

    return {
      ...org,
      logoKey,
      coverKey,
      logoUrl: logoUrl ?? null,
      coverUrl: coverUrl ?? null,
      myRole,
      myUnitRoles,
    };
  },

  async updateOrg(
    currentUserId: string,
    orgId: string,
    body: {
      name?: string;
      description?: string | null;
      teamSize?: string | null;
      country?: string | null;
      timezone?: string | null;
      logoUrl?: string | null;
      coverUrl?: string | null;
      brand_color?: string | null;
      address?: string | null;
      contactPhone?: string | null;
      meta?: unknown;
    }
  ) {
    const isAdmin = await OrgRepo.isAdmin(orgId, currentUserId);
    if (!isAdmin) throw forbidden('Forbidden');

    const org = await OrgRepo.findByIdWithProfile(orgId);
    if (!org) throw notFound('Org not found');

    let metaData: any | undefined = undefined;
    if (body.meta !== undefined) {
      const schema = getMetaSchema(org.type as OrgType);
      const parsed = schema.safeParse(body.meta);
      if (!parsed.success) throw badRequest('Invalid meta');
      metaData = parsed.data;
    }

    const d: Record<string, any> = {};
    for (const k of [
      'name',
      'description',
      'teamSize',
      'country',
      'timezone',
      'brand_color',
      'address',
      'contactPhone',
    ] as const) {
      if (body[k] !== undefined) d[k] = body[k];
    }

    if (body.logoUrl !== undefined) d.logoUrl = normalizeImageRef(body.logoUrl);
    if (body.coverUrl !== undefined)
      d.coverUrl = normalizeImageRef(body.coverUrl);

    const updated = await OrgRepo.updateOrgAndProfile(orgId, {
      org: d,
      meta: metaData,
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

    return {
      ...updated,
      logoKey,
      coverKey,
      logoUrl: logoUrl ?? null,
      coverUrl: coverUrl ?? null,
    };
  },

  async deleteOrg(currentUserId: string, orgId: string) {
    const isAdmin = await OrgRepo.isAdmin(orgId, currentUserId);
    if (!isAdmin) throw forbidden('Forbidden');
    await OrgRepo.deleteOrg(orgId);
  },
};
