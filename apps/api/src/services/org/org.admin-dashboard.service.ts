import { OrgType, ParentRole } from '../../generated/prisma';
import { forbidden, notFound } from '../../lib/https';
import { getMetaSchema } from '../../lib/org.type.meta';
import { decodeCursor } from '../../lib/pagination';
import { createGetObjectUrl } from '../../lib/s3';
import { PERMISSIONS_BY_BASE_ROLE } from '../../middleware/permissions';
import { OrgRepo } from '../../repositories/org/org.repo';

const isS3Key = (v?: string | null) => !!v && !/^https?:\/\//i.test(v);

export const OrgAdminDashboardService = {
  async hero(orgId?: string) {
    if (!orgId) throw notFound('Organisation ID not found');
    const org = await OrgRepo.findByIdWithProfile(orgId);

    if (!org) throw notFound('Org not found');

    const [unitsCount, membersCount] = await Promise.all([
      OrgRepo.countUnits(orgId),
      OrgRepo.countMembers(orgId),
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
    const exists = await OrgRepo.getOrgTypeAndMeta(orgId);
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
      OrgRepo.countUnits(orgId),
      OrgRepo.countRoleMembers(orgId, ParentRole.admin),
      OrgRepo.countRoleMembers(orgId, ParentRole.staff),
      OrgRepo.countRoleMembers(orgId, ParentRole.student),
      OrgRepo.countRoleMembers(orgId, ParentRole.parent),
      OrgRepo.countPendingInvites(orgId),
      OrgRepo.getLastJoinedMember(orgId),
    ]);

    return {
      unitsCount,
      roleCounts: {
        admin: adminCount,
        staff: staffCount,
        students: studentCount,
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
    const cursorArg = cur ?? undefined
    const rows = await OrgRepo.getAuditLogs(
      orgId,
      opts.unitId,
      cursorArg,
      opts.limit
    );
    return rows;
  },

  async dashboardConfig(orgId: string, userId: string) {
    const membership = await OrgRepo.getMembership(orgId, userId);
    if (!membership) throw forbidden('Not a member');

    const org = await OrgRepo.getOrgTypeAndMeta(orgId);

    let featureCaps: string[] = [];
    if (org?.profile?.meta) {
      const schema = getMetaSchema(org.type as OrgType);
      const parsed = schema.safeParse(org.profile.meta);

      if (parsed.success && 'features' in parsed.data) {
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
      const perms = await OrgRepo.getPermissionCodesForRole(membership.roleId);
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
        units_glance: { requires: ['org.read'] },
        members_peek: { requires: ['people.read'] },
        announcements_peek: { requires: ['announce.read'] },
        attendance_snapshot: {
          requires: ['attendance.enabled', 'attendance.read'],
        },
        fees_snapshot: { requires: ['finance.enabled', 'finance.read'] },
      },
      tables: {
        members: { requires: ['people.read'] },
        invites: { requires: ['people.invite'] },
        announcements: { requires: ['announce.read'] },
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
      role: membership.role,
      orgType: org?.type,
      features: featureCaps,
      widgets,
      tables,
    };
  },

  async unitsGlance(orgId: string) {
    const exists = await OrgRepo.getOrgTypeAndMeta(orgId);
    if (!exists) throw notFound('Org not found');

    const units = await OrgRepo.getRecentUnits(orgId);

    return units.map((u) => ({
      id: u.id,
      name: u.name,
      type: u.type,
      memberCount: u._count.members,
    }));
  },

  async membersPeek(orgId: string) {
    const rows = await OrgRepo.getRecentMembers(orgId);
  },

  async announcementsPeek(orgId: string) {
    const rows = await OrgRepo.getRecentAnnouncements(orgId);
  },

  async attendanceSnapshot(orgId: string) {
    const sessions = await OrgRepo.getAttendanceSessions(orgId);

    if (sessions.length === 0) {
      return { totalSessions: 0, avgRate: 0, lastSessionAt: null };
    }

    const total = sessions.length;
    let presentSum = 0;
    let recordSum = 0;

    sessions.forEach((s) => {
      s.records.forEach((r) => {
        recordSum++;
        if (r.status === 'present') presentSum++;
      });
    });

    const avgRate = recordSum ? (presentSum / recordSum) * 100 : 0;

    return {
      totalSessions: total,
      avgRate: Math.round(avgRate),
      lastSessionAt: sessions[0].date.toISOString(),
    };
  },

  async feesSnapshot(orgId: string) {
    const invoices = await OrgRepo.getFeeInvoice(orgId);

    let totalPaid = 0,
      totalDue = 0,
      overdueCount = 0;

    const now = new Date();

    for (const i of invoices) {
      if (i.status === 'paid') totalPaid += i.amount;
      else {
        totalDue += i.amount;
        if (i.dueAt < now) overdueCount++;
      }
    }

    return { totalDue, totalPaid, overdueCount };
  },
};
