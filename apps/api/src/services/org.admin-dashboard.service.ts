import { OrgType, ParentRole } from '../generated/prisma';
import { forbidden, notFound } from '../lib/https';
import { getMetaSchema } from '../lib/org.types';
import { decodeCursor } from '../lib/pagination';
import { createGetObjectUrl } from '../lib/s3';
import { PERMISSIONS_BY_BASE_ROLE } from '../middleware/permissions';
import { prisma } from '../lib/prisma';

const isS3Key = (v?: string | null) => !!v && !/^https?:\/\//i.test(v);

export const OrgAdminDashboardService = {
  async hero(orgId?: string) {
    const org = await prisma.organisation.findUnique({
      where: { id: orgId },
      include: { profile: true },
    });

    if (!org) throw notFound('Org not found');

    const [unitsCount, membersCount] = await Promise.all([
      prisma.orgUnit.count({ where: { orgId } }),
      prisma.orgMembership.count({ where: { orgId } }),
    ]);

    const logoKey = isS3Key(org.logoUrl as any)
      ? (org.logoUrl as string)
      : undefined;
    const coverKey = isS3Key(org.coverUrl as any)
      ? (org.coverUrl as string)
      : undefined;

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
      aggregates: { unitsCount, membersCount },
    };
  },

  async summary(orgId: string) {
    const exists = await prisma.organisation.findUnique({
      where: { id: orgId },
      select: { id: true },
    });
    if (!exists) throw notFound('Org not found');
    const [
      unitsCount,
      adminCount,
      staffCount,
      studentCount,
      parentCount,
      pendingInvites,
      latestMember,
    ] = await Promise.all([
      prisma.orgUnit.count({ where: { orgId } }),
      prisma.orgMembership.count({ where: { orgId, role: ParentRole.admin } }),
      prisma.orgMembership.count({ where: { orgId, role: ParentRole.staff } }),
      prisma.orgMembership.count({
        where: { orgId, role: ParentRole.student },
      }),
      prisma.orgMembership.count({
        where: { orgId, role: ParentRole.parent },
      }),
      prisma.invite.count({
        where: { orgId, acceptedBy: null, expiresAt: { gt: new Date() } },
      }),
      prisma.orgMembership.findFirst({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      unitsCount,
      roleCounts: {
        adming: adminCount,
        staff: staffCount,
        student: studentCount,
        parent: parentCount,
      },
      pendingInvites,
      lastJoinat: latestMember?.createdAt ?? null,
    };
  },

  async activity(
    orgId: string,
    opts: { limit: number; cursor?: string; unitId?: string }
  ) {
    const cur = decodeCursor(opts.cursor ?? null);
    const rows = await prisma.auditLog.findMany({
      where: {
        orgId,
        ...(opts.unitId ? { entityId: opts.unitId } : {}),
        ...(cur
          ? {
              OR: [
                { createdAt: { lt: cur.createdAt } },
                { createdAt: cur.createdAt, id: { lt: cur.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: opts.limit + 1,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        meta: true,
        actorId: true,
        createdAt: true,
      },
    });

    return rows;
  },

  async dashboardConfig(orgId: string, userId: string) {
    const membership = await prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { role: true, roleId: true },
    });
    if (!membership) throw forbidden('Not a member');

    const org = await prisma.organisation.findUnique({
      where: { id: orgId },
      select: { type: true, profile: { select: { meta: true } } },
    });

    let featureCaps: string[] = [];
    if (org?.profile?.meta) {
      const schema = getMetaSchema(org.type as OrgType);
      const parsed = schema.safeParse(org.profile.meta);

      if (parsed.success) {
        const features = (parsed.data.features ?? {}) as Record<
          string,
          boolean
        >;
        featureCaps = Object.entries(features)
          .filter(([, v]) => v === true)
          .map(([k]) => `${k}.enabled`);
      }
    }

    let permCodes = new Set<string>();
    if (membership.role === ParentRole.admin) {
      [
        'org.read',
        'people.manage',
        'people.invite',
        'roles.manage',
        'org.unit.manage',
        'teaching.content.manage',
        'teaching.attendance.manage',
        'comms.announce.manage',
        'finance.invoice.manage',
        'finance.payment.manage',
        'reports.read',
        'reports.export',
      ].forEach((c) => permCodes.add(c));
    } else if (membership.roleId) {
      const perms = await prisma.rolePermission.findMany({
        where: { roleId: membership.roleId },
        select: { permission: { select: { code: true } } },
      });
      perms?.forEach((p) => permCodes.add(p.permission.code));
    } else {
      (PERMISSIONS_BY_BASE_ROLE[membership.role] ?? []).forEach((c) =>
        permCodes.add(c)
      );
    }

    const expand = (codes: Set<string>) => {
      const add = (c: string) => codes.add(c);
      if (codes.has('people.manage')) add('people.read');
      if (codes.has('roles.manage')) add('roles.read');
      if (
        codes.has('finance.invoice.manage') ||
        codes.has('finance.payment.manage')
      )
        add('finance.read');
      if (codes.has('teaching.content.manage')) add('academics.read');
      if (codes.has('teaching.attendance.manage')) add('attendance.read');
      if (codes.has('comms.announce.manage')) add('announce.read');

      return codes;
    };
    permCodes = expand(permCodes);

    const caps = new Set<string>([...permCodes, ...featureCaps]);

    const registry = {
      widgets: {
        members_counts: { requires: ['org.read'] },
        units_by_type: { requires: ['org.read'] },
        attendance_rate: { requires: ['attendance.enabled'] },
        fees_due: { requires: ['finance.enabled', 'finance.read'] },
        pending_invites: { requires: ['people.invite'] },
        roles_overview: { requires: ['roles.read'] },
      },
      tables: {
        announcements: { requires: ['org.read'] },
        members: { requires: ['people.read'] },
        invites: { requires: ['people.invite'] },
        roles: { requires: ['roles.read'] },
        fees: { requires: ['finance.enabled', 'finance.read'] },
        assignments: { requires: ['academics.read'] },
        tests: { requires: ['academics.read'] },
      },
    } as const;

    if (org?.type === 'NGO') {
      caps.delete('finance.enabled');
      caps.delete('finance.read');
    }

    const allow = (reqs: readonly string[]) => reqs.every((r) => caps.has(r));
    const widgets = Object.entries(registry.widgets)
      .filter(([, meta]) => allow(meta.requires))
      .map(([k]) => k);
    const tables = Object.entries(registry.tables)
      .filter(([, meta]) => allow(meta.requires))
      .map(([k]) => k);

    return {
      roles: membership.role,
      orgType: org?.type,
      features: featureCaps,
      widgets,
      tables,
    };
  },
};
