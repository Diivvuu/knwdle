import { Router } from 'express';
import z from 'zod';
import { ParentRole, OrgType } from '../../generated/prisma';
import { getMetaSchema } from '../../lib/org.types';
import { requireAuth } from '../../middleware/auth';
import {
  PERMISSIONS_BY_BASE_ROLE,
  requirePermission,
} from '../../middleware/permissions';
import { prisma } from '../../lib/prisma';
import { createGetObjectUrl } from '../../lib/s3';
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';

const r = Router();
const adminDashboardRegistry = new OpenAPIRegistry();
extendZodWithOpenApi(z);

/**
 * Dashboard Router (read-only, lightweight)
 * Keep ONLY hero/summary, activity feed, and dashboard-config here.
 * All other domain reads/writes live in their own feature routers:
 * - Announcements:   /orgs/:id/announcements       -> org.announcements.ts
 * - Attendance:      /orgs/:id/attendance/snapshot -> org.attendance.ts
 * - Finance/Fees:    /orgs/:id/fees/snapshot       -> org.finance.ts
 * - Invites:         /orgs/:id/invites             -> org.invites.ts (you already have bulk there)
 * - Roles Summary:   /orgs/:id/roles/summary       -> org.roles.ts
 * - Units Summary:   /orgs/:id/units/summary       -> org.units.ts
 */

const IdParam = z.object({ id: z.string().min(1) }).openapi('IdParam');

const ActivityQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().optional(),
    unitId: z.string().min(1).optional(),
  })
  .openapi('OrgActivityQuery');

const BasicError = z
  .object({
    error: z.string(),
    detail: z.any().optional(),
  })
  .openapi('BasicError');

// Treat non-HTTP(S) strings as S3 keys we need to presign
const isS3Key = (v?: string | null) => !!v && !/^https?:\/\//i.test(v);

function asOrgNotFound(res: any) {
  return res.status(404).json({ error: 'Org not found' });
}

const LimitQuery = z.coerce.number().int().min(1).max(50).default(20);
const LiteLimitQuery = z.coerce.number().int().min(1).max(20).default(5);
const CursorQuery = z.string().optional();
const UnitIdQuery = z.string().min(1).optional();

function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');
}

function decodeCursor(raw?: string | null) {
  if (!raw) return null;
  try {
    const [iso, id] = Buffer.from(raw, 'base64url').toString('utf8').split('|');
    const d = new Date(iso);
    if (!iso || !id || Number.isNaN(d.getTime())) return null;
    return { createdAt: d, id };
  } catch {
    return null;
  }
}

// GET /orgs/:id
adminDashboardRegistry.registerPath({
  method: 'get',
  path: '/api/orgs/{id}',
  summary: 'Org Dashboard hero card (org + aggregates + signed image URLs)',
  security: [{ bearerAuth: [] }],
  tags: ['admin-dashboard'],
  request: { params: IdParam },
  responses: {
    200: {
      description: 'Org hero payload',
      content: { 'application/json': { schema: z.any() } },
    },
    400: {
      description: 'Bad org id',
      content: { 'application/json': { schema: BasicError } },
    },
    404: {
      description: 'Org not found',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
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
  const logoKey = isS3Key(org.logoUrl as any)
    ? (org.logoUrl as string)
    : undefined;
  const coverKey = isS3Key(org.coverUrl as any)
    ? (org.coverUrl as string)
    : undefined;

  const [signedLogoUrl, signedCoverUrl] = await Promise.all([
    logoKey
      ? createGetObjectUrl({ key: logoKey, expiresInSec: 60 })
      : Promise.resolve(org.logoUrl as string | null),
    coverKey
      ? createGetObjectUrl({ key: coverKey, expiresInSec: 60 })
      : Promise.resolve(org.coverUrl as string | null),
  ]);

  res.set('Cache-Control', 'private, max-age=30');
  res.json({
    ...org,
    logoKey,
    coverKey,
    logoUrl: signedLogoUrl ?? null,
    coverUrl: signedCoverUrl ?? null,
    aggregates: { unitsCount, membersCount },
  });
});

// GET /orgs/:id/summary
adminDashboardRegistry.registerPath({
  method: 'get',
  path: '/api/orgs/{id}/summary',
  summary: 'Lightweight org summary {counts, pending invites, last join time}',
  tags: ['admin-dashboard'],
  security: [{ bearerAuth: [] }],
  request: { params: IdParam },
  responses: {
    200: {
      description: 'Summary',
      content: { 'application/json': { schema: z.any() } },
    },
    400: {
      description: 'Bad org id',
      content: { 'application/json': { schema: BasicError } },
    },
    404: {
      description: 'Org not found',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
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

    res.set('Cache-Control', 'private, max-age=30');

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

// GET /orgs/:id/activity?unitId&limit&cursor
adminDashboardRegistry.registerPath({
  method: 'get',
  path: '/orgs/{id}/activity',
  summary: 'Org activity feed (cursor-paginated audit log)',
  tags: ['admin-dashboard'],
  security: [{ bearerAuth: [] }],
  request: { params: IdParam },
  responses: {
    200: {
      description: 'Activity Page',
      content: { 'application/json': { schema: z.any() } },
    },
    400: {
      description: 'Invalid query/bad org id',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.get(
  '/:id/activity',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) return res.status(400).json({ error: 'Bad org id' });
    const orgId = p.data.id;
    const q = z
      .object({
        limit: LimitQuery,
        cursor: CursorQuery,
        unitId: UnitIdQuery,
      })
      .safeParse(req.query);
    if (!q.success) return res.status(400).json({ error: 'Invalid query' });

    const { limit, cursor, unitId } = q.data;
    const cur = decodeCursor(cursor);

    const rows = await prisma.auditLog.findMany({
      where: {
        orgId,
        ...(unitId ? { entityId: unitId } : {}),
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
      take: limit + 1,
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

    const items = rows.slice(0, limit).map((l) => ({
      id: l.id,
      type: l.action,
      at: l.createdAt,
      entity: l.entity,
      entityId: l.entityId,
      meta: l.meta,
      actorId: l.actorId ?? null,
    }));
    const nextCursor =
      rows.length > limit
        ? encodeCursor(rows[limit].createdAt, rows[limit].id)
        : null;

    res.json({ items, nextCursor });
  }
);

// GET dashboard config by user role and org id
adminDashboardRegistry.registerPath({
  method: 'get',
  path: '/api/orgs/{id}/dashboard-config',
  summary: 'Server-driven dashboard visibility (widgets, tables, caps)',
  tags: ['admin-dashboard'],
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParam,
  },
  responses: {
    200: {
      description: 'Dashboard config',
      content: { 'application/json': { schema: z.any() } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.get(
  '/:id/dashboard-config',
  requireAuth,
  requirePermission('org.read'),
  async (req, res) => {
    const orgId = req.params.id;

    // 1) Who am I in this org? (base role + potential custom role)
    const membership = await prisma.orgMembership.findFirst({
      where: { orgId, userId: req.user!.id },
      select: { role: true, roleId: true },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // 2) Load org type + meta.features (same source as requireFeature)
    const org = await prisma.organisation.findUnique({
      where: { id: orgId },
      select: { type: true, profile: { select: { meta: true } } },
    });

    // Parse org.profile.meta using the same schema used in requireFeature
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
          .map(([k]) => `${k}.enabled`); // e.g., "attendance.enabled"
      }
    }

    // 3) Assemble permission codes:
    //    - admin shortcut
    //    - custom-role exact codes
    //    - or base-role defaults from PERMISSIONS_BY_BASE_ROLE
    let permCodes = new Set<string>();

    if (membership.role === 'admin') {
      // '*' means grant all relevant read caps for dashboard visibility
      // (We still gate on feature flags where appropriate.)
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
      for (const p of perms) permCodes.add(p.permission.code);
    } else {
      // base role fallbacks
      const base = PERMISSIONS_BY_BASE_ROLE[membership.role] ?? [];
      for (const c of base) permCodes.add(c);
    }

    // 4) Optional: expand some “manage” perms to imply “read” for visibility
    //    (UI can show a read-only widget even if user can’t mutate)
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

    // 5) Build capability bag = permission codes + enabled feature flags
    const caps = new Set<string>([...permCodes, ...featureCaps]);

    // 6) Registry of widgets/tables with minimal requirements.
    //    NOTE: keep requirements simple: feature flags for “who should see”,
    //    permission codes for “should this be visible to staff/admin only”.
    const registry = {
      widgets: {
        // Simple KPIs
        members_counts: { requires: ['org.read'] }, // any org reader
        units_by_type: { requires: ['org.read'] },

        // Attendance is shown if feature enabled (students/parents see it too)
        attendance_rate: { requires: ['attendance.enabled'] },

        // Fees should require both: feature enabled + at least finance read (hide from students/parents)
        fees_due: { requires: ['finance.enabled', 'finance.read'] },

        // Pending invites for admins/staff with invite permission
        pending_invites: { requires: ['people.invite'] },

        // Roles overview for folks who can read roles
        roles_overview: { requires: ['roles.read'] },
      },
      tables: {
        announcements: { requires: ['org.read'] }, // everyone can see, feature-less
        members: { requires: ['people.read'] }, // staff/admin
        invites: { requires: ['people.invite'] },
        roles: { requires: ['roles.read'] },
        fees: { requires: ['finance.enabled', 'finance.read'] },
        assignments: { requires: ['academics.read'] }, // from teaching.content.manage expansion
        tests: { requires: ['academics.read'] },
      },
    } as const;

    // 7) Org-type tweak examples (optional)
    if (org?.type === 'NGO') {
      // NGOs: hide finance even if enabled
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

    res.set('Cache-Control', 'private, max-age=120');
    res.json({
      role: membership.role,
      orgType: org?.type,
      features: featureCaps, // useful for the client to toggle minor UI affordances
      widgets,
      tables,
    });
  }
);

export const getAdminDashboardPaths = () => {
  const gen = new OpenApiGeneratorV3(adminDashboardRegistry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Admin Dashboard API', version: '1.0.0' },
  });
};

export default r;

/* ---------------------------------------------
 * MOVED to org.announcements.ts
 * GET /orgs/:id/announcements?unitId&limit&cursor
 * (Left here commented to avoid duplicate routes. Remove after migration.)
---------------------------------------------- */
// r.get(
//   '/:id/announcements',
//   requireAuth,
//   requirePermission('org.read'),
//   async (req, res) => {
//     const { id } = IdParam.parse(req.params);
//     const q = z
//       .object({
//         limit: LiteLimitQuery,
//         cursor: CursorQuery,
//         unitId: UnitIdQuery,
//       })
//       .safeParse(req.query);
//     if (!q.success) return res.status(400).json({ error: 'Invalid query' });
//
//     const { limit, cursor, unitId } = q.data;
//     const cur = decodeCursor(cursor);
//
//     const where = {
//       orgId: id,
//       ...(unitId ? { unitId } : {}),
//       ...(cur
//         ? {
//             OR: [
//               { createdAt: { lt: cur.createdAt } },
//               {
//                 createdAt: cur.createdAt,
//                 id: { lt: cur.id },
//               },
//             ],
//           }
//         : {}),
//     } as const;
//
//     const rows = await prisma.announcement.findMany({
//       where,
//       orderBy: [{ pin: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
//       take: limit + 1,
//       select: {
//         id: true,
//         title: true,
//         unitId: true,
//         createdAt: true,
//         createdBy: true,
//         pin: true,
//       },
//     });
//
//     const items = rows.slice(0, limit);
//
//     const nextCursor =
//       rows.length > limit
//         ? encodeCursor(rows[limit].createdAt, rows[limit].id)
//         : null;
//
//     res.json({ items, nextCursor });
//   }
// );

/* ---------------------------------------------
 * MOVED to org.roles.ts
 * GET /orgs/:id/roles/summary
 * (Left here commented to avoid duplicate routes. Remove after migration.)
---------------------------------------------- */
// r.get(
//   '/:id/roles/summary',
//   requireAuth,
//   requirePermission('org.read'),
//   async (req, res) => {
//     const { id } = IdParam.parse(req.params);
//     const [total, custom, lastEdited] = await Promise.all([
//       prisma.role.count({ where: { orgId: id } }),
//       prisma.role.count({ where: { orgId: id, key: { not: 'builtin' } } }),
//       prisma.role.findFirst({
//         where: { orgId: id },
//         orderBy: { createdAt: 'desc' },
//         select: { createdAt: true },
//       }),
//     ]);
//     res.set('Cache-Control', 'private, max-age=30');
//     res.json({
//       total,
//       customRoles: custom,
//       lastEditedAt: lastEdited?.createdAt ?? null,
//     });
//   }
// );

/* ---------------------------------------------
 * MOVED to org.units.ts
 * GET /orgs/:id/units/summary
 * (Left here commented to avoid duplicate routes. Remove after migration.)
---------------------------------------------- */
// r.get(
//   '/:id/units/summary',
//   requireAuth,
//   requirePermission('org.read'),
//   async (req, res) => {
//     const { id } = IdParam.parse(req.params);
//     const total = await prisma.orgUnit.count({ where: { orgId: id } });
//
//     const byTypeRows = await prisma.orgUnit.groupBy({
//       by: ['type'],
//       where: { orgId: id },
//       _count: { type: true },
//     });
//
//     const byType: Record<string, number> = {};
//     for (const r0 of byTypeRows) byType[r0.type] = r0._count.type;
//
//     res.set('Cache-Control', 'private, max-age=30');
//     res.json({ total, byType });
//   }
// );

/* ---------------------------------------------
 * MOVED to org.attendance.ts
 * GET /orgs/:id/attendance/snapshot
 * (Left here commented to avoid duplicate routes. Remove after migration.)
---------------------------------------------- */
// r.get(
//   '/:id/attendance/snapshot',
//   requireAuth,
//   requirePermission('org.read'),
//   async (req, res) => {
//     const { id } = IdParam.parse(req.params);
//     const q = z
//       .object({
//         unitId: UnitIdQuery,
//         date: z.string().regex(/^\d{4}-\d{2}$/, 'date must be YYYY-MM'),
//       })
//       .safeParse(req.query);
//     if (!q.success) return res.status(400).json({ error: 'Invalid query' });
//
//     const { unitId, date } = q.data;
//     const start = new Date(`${date}-01T00:00:00.000Z`);
//     const end = new Date(new Date(start).setUTCMonth(start.getUTCMonth() + 1));
//
//     const sessions = await prisma.attendanceSession.findMany({
//       where: {
//         orgId: id,
//         ...(unitId ? { unitId } : {}),
//         date: { gte: start, lt: end },
//       },
//       select: { id: true },
//     });
//     if (sessions.length === 0)
//       return res.json({ month: date, rate: 0, lowPerforming: 0 });
//
//     const records = await prisma.attendanceRecord.findMany({
//       where: { sessionId: { in: sessions.map((s) => s.id) } },
//       select: { status: true, studentId: true },
//     });
//
//     const total = records.length;
//     const present = records.filter(
//       (r) => r.status.toLowerCase() === 'present'
//     ).length;
//     const rate = total ? Math.round((present / total) * 100) : 0;
//
//     const byStudent = new Map<string, { p: number; t: number }>();
//     for (const r0 of records) {
//       const s = byStudent.get(r0.studentId) ?? { p: 0, t: 0 };
//       s.t += 1;
//       if (r0.status.toLowerCase() === 'present') s.p += 1;
//       byStudent.set(r0.studentId, s);
//     }
//
//     const lowPerforming = [...byStudent.values()].filter(
//       (s) => s.t && s.p / s.t < 0.5
//     ).length;
//
//     res.set('Cache-Control', 'private, max-age=30');
//     res.json({ month: date, rate, lowPerforming });
//   }
// );

/* ---------------------------------------------
 * MOVED to org.finance.ts
 * GET /orgs/:id/fees/snapshot
 * (Left here commented to avoid duplicate routes. Remove after migration.)
---------------------------------------------- */
// r.get(
//   '/:id/fees/snapshot',
//   requireAuth,
//   requirePermission('org.read'),
//   async (req, res) => {
//     const { id } = IdParam.parse(req.params);
//     const q = z
//       .object({
//         unitId: UnitIdQuery,
//         asOf: z
//           .string()
//           .regex(/^\d{4}-\d{2}-\d{2}$/, 'asOf must be YYYY-MM-DD'),
//       })
//       .safeParse(req.query);
//
//     if (!q.success) return res.status(400).json({ error: 'Invalid query' });
//
//     const { unitId, asOf } = q.data;
//     const whereBase = { orgId: id, ...(unitId ? { unitId } : {}) };
//
//     const [due, overdue, invoicesOpen] = await Promise.all([
//       prisma.feeInvoice.aggregate({
//         _sum: { amount: true },
//         where: { ...whereBase, status: 'unpaid' },
//       }),
//       prisma.feeInvoice.aggregate({
//         _sum: { amount: true },
//         where: {
//           ...whereBase,
//           status: 'unpaid',
//           dueAt: { lt: new Date(asOf) },
//         },
//       }),
//       prisma.feeInvoice.count({ where: { ...whereBase, status: 'unpaid' } }),
//     ]);
//
//     // NOTE: correct header form would be: res.set('Cache-Control', 'private, max-age=30');
//     res.set('Cache-Control', 'private max-age=30');
//     res.json({
//       asOf,
//       due: due._sum.amount ?? 0,
//       overdue: overdue._sum.amount ?? 0,
//       invoicesOpen,
//     });
//   }
// );

// GET /orgs/:id/dashboard-config
// Server-driven visibility: permissions (base/custom) + org meta features.
