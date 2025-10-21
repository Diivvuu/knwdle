import crypto from 'crypto';
import z from 'zod';
import { ParentRole } from '../generated/prisma';
import { requireAuth } from '../middleware/auth';
import { Router } from 'express';
import { MailTemplates } from '../lib/mail-templates';
import { sendMail, wrapHtml } from '../lib/mailer';
import { requirePermission } from '../middleware/permissions';
import { prisma } from '../lib/prisma';
import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import '../lib/openapi/extend';

const r = Router();

const inviteRegistry = new OpenAPIRegistry();
const COOKIE_NAME = process.env.COOKIE_NAME || '__knwdle_session';
inviteRegistry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: COOKIE_NAME,
});

const AUTH_ORIGIN = process.env.AUTH_ORIGIN;
if (!AUTH_ORIGIN) throw new Error('APP_ORIGIN not configured');

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}
export function generateJoinCode() {
  return `KNW-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id })
  ).toString('base64');
}

function decodeCursor(c?: string | null) {
  if (!c) return null;
  try {
    const { createdAt, id } = JSON.parse(
      Buffer.from(c, 'base64').toString('utf8')
    );
    return { createdAt: new Date(createdAt), id: String(id) };
  } catch {
    return null;
  }
}

const InviteBody = z
  .object({
    email: z.string().email(),
    role: z.nativeEnum(ParentRole).optional(),
    roleId: z.string().optional(),
    unitId: z.string().optional(),
    meta: z.any().optional(),
  })
  .refine((v) => v.role || v.roleId, {
    message: 'Provide either role or roleId',
  })
  .openapi('InviteBody');

const InviteListQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().optional(),
    q: z.string().trim().min(1).max(200).optional(),
    role: z.nativeEnum(ParentRole).optional(),
    status: z.enum(['pending', 'accepted']).optional(),
    unitId: z.string().trim().min(1).optional(),
    sortKey: z
      .enum(['createdAt', 'email', 'expiresAt', 'role', 'unit', 'unitId'])
      .optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
  })
  .openapi('InviteListQuery');

const JoinCodeBody = z
  .object({ code: z.string().min(6) })
  .openapi('JoinCodeBody');

const InviteSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(ParentRole),
    roleId: z.string().nullable().optional(),
    unitId: z.string().nullable().optional(),
    token: z.string(),
    joinCode: z.string(),
    expiresAt: z.string().datetime(),
    acceptedBy: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    meta: z.any().optional(),
  })
  .openapi('Invite');

const InviteListResponse = z
  .object({
    items: z.array(InviteSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi('InviteListResponse');

const BasicError = z.object({ error: z.string() }).openapi('BasicError');

const AcceptInviteResponse = z
  .object({
    message: z.string(),
    orgId: z.string(),
    unitId: z.string().nullable().optional(),
  })
  .openapi('AcceptInviteResponse');

// POST create invite
inviteRegistry.registerPath({
  method: 'post',
  path: '/api/orgs/{id}/invites',
  summary: 'Create an invite for an organisation',
  tags: ['invite'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': { schema: InviteBody },
      },
    },
  },
  responses: {
    201: {
      description: 'Invite Created',
      content: { 'application/json': { schema: InviteSchema } },
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: BasicError } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
    409: {
      description: 'Conflict',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.post(
  '/orgs/:id/invites',
  requireAuth,
  requirePermission('people.invite'),
  async (req, res) => {
    const { id: orgId } = req.params;
    const body = InviteBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid input' });

    const email = String(body.data.email.trim().toLowerCase());

    if (email === req.user!.email.toLowerCase()) {
      return res.status(400).json({ erroR: 'You cannot invite yourself.' });
    }

    let roleId: string | null = null;
    let ParentRoleFromCustom: ParentRole | null = null;
    if (body.data.roleId) {
      const custom = await prisma.role.findFirst({
        where: { id: body.data.roleId, orgId },
        select: { id: true, parentRole: true },
      });

      if (!custom)
        return res.status(400).json({ error: 'Custom role not found in org' });
      roleId = custom.id;
      ParentRoleFromCustom = custom.parentRole;
    }

    const effectiveRole: ParentRole | null =
      body.data.role ?? ParentRoleFromCustom ?? null;
    if (!effectiveRole) {
      return res.status(400).json({ error: 'Provide role or roleId' });
    }

    if (
      body.data.role &&
      ParentRoleFromCustom &&
      body.data.role !== ParentRoleFromCustom
    ) {
      return res
        .status(400)
        .json({ error: "role must match custom role's parentRole" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      const alreadyMember = await prisma.orgMembership.findFirst({
        where: {
          orgId,
          userId: existingUser.id,
        },
        select: { id: true },
      });
      if (alreadyMember) {
        return res.status(409).json({
          error: 'User is already a member of this organisation',
        });
      }
    }

    const duplicatePending = await prisma.invite.findFirst({
      where: {
        orgId,
        email,
        unitId: body.data.unitId ?? null,
        acceptedBy: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        joinCode: true,
      },
    });
    if (duplicatePending) {
      return res.status(409).json({
        error: 'A pending invite already exists for this email (and unit).',
        inviteId: duplicatePending.id,
        expiresAt: duplicatePending.expiresAt,
        joinCode: duplicatePending.joinCode,
      });
    }

    const token = generateToken();
    const joinCode = generateJoinCode();

    const invite = await prisma.invite.create({
      data: {
        email: body.data.email.toLowerCase(),
        role: effectiveRole,
        roleId,
        unitId: body.data.unitId,
        orgId,
        token,
        joinCode,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), //7 days.
        meta: body.data.meta,
      },
    });

    const link = `${AUTH_ORIGIN}/join/${token}`;
    const t = MailTemplates.invite(link, joinCode); //add invite template

    await sendMail(
      body.data.email,
      t.subject,
      wrapHtml({ title: t.subject, bodyHtml: t.html })
    );

    res.status(201).json(invite);
  }
);

// GET list invites
inviteRegistry.registerPath({
  method: 'get',
  path: '/api/orgs/{id}/invites',
  summary: 'List invites for an organisation (paginated)',
  tags: ['invite'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    query: InviteListQuery,
  },
  responses: {
    200: {
      description: 'Paginated list of invites',
      content: { 'application/json': { schema: InviteListResponse } },
    },
    400: {
      description: 'Invalid Query',
      content: { 'application/json': { schema: BasicError } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.get(
  '/orgs/:id/invites',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const { id: orgId } = req.params;

    const isMember = await prisma.orgMembership.findFirst({
      where: { orgId, userId: req.user!.id },
      select: { id: true },
    });
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const parsed = InviteListQuery.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: 'Invalid query', details: parsed.error.flatten() });
    }

    const {
      limit,
      cursor,
      q,
      role,
      status,
      unitId,
      sortKey: rawSortKey = 'createdAt',
      sortDir = 'desc',
    } = parsed.data;

    // ✅ map UI alias -> DB field
    const sortKey = rawSortKey === 'unit' ? 'unitId' : rawSortKey;

    const cursorVal = decodeCursor(cursor || null);

    const where: any = { orgId };
    if (role) where.role = role;
    if (unitId) where.unitId = unitId;
    if (status === 'pending') where.acceptedBy = null;
    if (status === 'accepted') where.acceptedBy = { not: null }; // ✅ fix typo
    if (q) where.email = { contains: q, mode: 'insensitive' };

    const orderBy: any[] = [{ [sortKey]: sortDir }, { id: sortDir }];

    // stable pagination on (createdAt,id)
    const cursorWhere =
      cursorVal &&
      ({
        OR: [
          {
            createdAt:
              sortDir === 'desc'
                ? { lt: cursorVal.createdAt }
                : { gt: cursorVal.createdAt },
          },
          {
            AND: [
              { createdAt: cursorVal.createdAt },
              {
                id:
                  sortDir === 'desc'
                    ? { lt: cursorVal.id }
                    : { gt: cursorVal.id },
              },
            ],
          },
        ],
      } as const);

    const rows = await prisma.invite.findMany({
      where: cursorWhere ? { AND: [where, cursorWhere] } : where,
      orderBy,
      take: limit + 1,
      select: {
        id: true,
        orgId: true,
        email: true,
        role: true,
        roleId: true,
        unitId: true,
        token: true,
        joinCode: true,
        expiresAt: true,
        acceptedBy: true,
        createdAt: true,
        meta: true,
      },
    });

    const items = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

    const payload = {
      items: items.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        expiresAt: i.expiresAt.toISOString(),
      })),
      nextCursor,
    };

    if (process.env.NODE_ENV !== 'production') {
      InviteListResponse.parse(payload);
    }

    res.json(payload);
  }
);

// DELETE invite
inviteRegistry.registerPath({
  method: 'delete',
  path: '/api/orgs/{orgId}/invites/{inviteId}',
  summary: 'Delete an invite',
  tags: ['invite'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ orgId: z.string(), inviteId: z.string() }),
  },
  responses: {
    204: { description: 'Deleted' },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.delete(
  '/orgs/:orgId/invites/:inviteId',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const { orgId, inviteId } = req.params;

    await prisma.invite.delete({ where: { id: inviteId } });
    res.status(204).send();
  }
);

//POST accept invite (as any Parentrole)
inviteRegistry.registerPath({
  method: 'post',
  path: '/api/invite/{token}/accept',
  summary: 'Accept and invite using the email token',
  tags: ['invite'],
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ token: z.string() }) },
  responses: {
    200: {
      description: 'Invite accepted',
      content: { 'application/json': { schema: AcceptInviteResponse } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
    404: {
      description: 'Invite not found',
      content: { 'application/json': { schema: BasicError } },
    },
    410: {
      description: 'Invite expired',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.post('/invites/:token/accept', requireAuth, async (req, res) => {
  const { token } = req.params;

  const invite = await prisma.invite.findUnique({
    where: { token },
  });

  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  if (invite.expiresAt < new Date())
    return res.status(410).json({ error: 'Invite expired' });

  if (req.user!.email.toLowerCase() !== invite.email.toLowerCase()) {
    return res.status(403).json({ error: 'Invite is for anothter email' });
  }

  await prisma.$transaction(async (tx) => {
    const userId = req.user!.id;
    if (invite.unitId) {
      await tx.orgMembership.upsert({
        where: {
          orgId_userId_unitId: {
            orgId: invite.orgId,
            userId,
            unitId: invite.unitId,
          },
        },
        update: { role: invite.role, roleId: invite.roleId ?? undefined },
        create: {
          orgId: invite.orgId,
          userId,
          role: invite.role,
          roleId: invite.roleId ?? undefined,
          unitId: invite.unitId,
        },
      });
    } else {
      const updated = await tx.orgMembership.updateMany({
        where: { orgId: invite.orgId, userId, unitId: null },
        data: { role: invite.role, roleId: invite.roleId ?? undefined },
      });

      if (updated.count === 0) {
        await tx.orgMembership.create({
          data: {
            orgId: invite.orgId,
            userId,
            role: invite.role,
            roleId: invite.roleId ?? undefined,
          },
        });
      }
    }
    if (!invite.acceptedBy) {
      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedBy: req.user!.id },
      });
    }
  });

  res.json({
    message: 'Invite accepted via link',
    orgId: invite.orgId,
    unitId: invite.unitId,
  });
});

// POST accept invite using join code
inviteRegistry.registerPath({
  method: 'post',
  path: '/api/invites/join-code',
  summary: 'Accept an invite using a join code',
  tags: ['invite'],
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: JoinCodeBody } } },
  },
  responses: {
    200: {
      description: 'Invite accepted via join code',
      content: { 'application/json': { schema: AcceptInviteResponse } },
    },
    400: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
    403: {
      description: 'Code not found',
      content: { 'application/json': { schema: BasicError } },
    },
    410: {
      description: 'Invite expired',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.post('/invites/join-code', requireAuth, async (req, res) => {
  const p = JoinCodeBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid body' });

  const { code } = p.data;

  const invite = await prisma.invite.findUnique({ where: { joinCode: code } });
  if (!invite) return res.status(404).json({ error: 'Code not found' });
  if (invite.expiresAt < new Date())
    return res.status(410).json({ error: 'Invite expired' });

  if (req.user!.email.toLowerCase() !== invite.email.toLowerCase()) {
    return res.status(403).json({ error: 'Invite is for another email' });
  }

  const userId = req.user!.id;

  await prisma.$transaction(async (tx) => {
    const userId = req.user!.id;

    if (invite.unitId) {
      await tx.orgMembership.upsert({
        where: {
          orgId_userId_unitId: {
            orgId: invite.orgId,
            userId,
            unitId: invite.unitId,
          },
        },
        update: { role: invite.role, roleId: invite.roleId },
        create: {
          orgId: invite.orgId,
          userId,
          role: invite.role,
          roleId: invite.roleId,
          unitId: invite.unitId,
        },
      });
    } else {
      const updated = await tx.orgMembership.updateMany({
        where: { orgId: invite.orgId, userId, unitId: null },
        data: { role: invite.role, roleId: invite.roleId ?? undefined },
      });

      if (updated.count === 0) {
        await tx.orgMembership.create({
          data: {
            orgId: invite.orgId,
            userId,
            role: invite.role,
            roleId: invite.roleId ?? undefined,
          },
        });
      }
    }
    if (!invite.acceptedBy) {
      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedBy: userId },
      });
    }
  });

  res.json({
    message: 'Invite accepted via join code',
    orgId: invite.orgId,
    unitId: invite.unitId,
  });
});

export const getInviteOpenApiPaths = () => {
  const generator = new OpenApiGeneratorV3(inviteRegistry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Invite API', version: '1.0.0' },
  });
};

export default r;
