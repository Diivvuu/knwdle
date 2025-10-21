import { Router } from 'express';
import { ParentRole } from '../generated/prisma';
import crypto from 'crypto';
import z from 'zod';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { sseAttach, ssePush } from '../lib/sse';
import { MailTemplates } from '../lib/mail-templates';
import { sendBulkWithProgress, wrapHtml } from '../lib/mailer';
import { prisma } from '../lib/prisma';
import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';

const r = Router();

const invitesRegistry = new OpenAPIRegistry();

const COOKIE_NAME = process.env.COOKIE_NAME || '__knwdle_session';
invitesRegistry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: COOKIE_NAME,
});

const InviteItem = z
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
  .openapi('InviteItem');

const BulkInviteBody = z
  .object({
    invites: z.array(InviteItem).min(1).max(200),
    options: z
      .object({
        expiresInDays: z.number().int().min(1).max(30).default(7),
        sendEmail: z.boolean().default(true),
        dryRun: z.boolean().default(false),
      })
      .default({}),
  })
  .openapi('BulkInviteBody');

const BasicError = z
  .object({
    error: z.string(),
    details: z.any().optional(),
  })
  .openapi('BssicError');

const BulkInviteStatus = z
  .enum(['queued', 'running', 'done', 'error'])
  .openapi('BulkInviteStatus');

const BulkInviteDryRunResponse = z
  .object({
    batchId: z.string(),
    total: z.number().int(),
    stauts: z.literal('done'),
    sent: z.number().int(),
    failed: z.number().int(),
    skipped: z.number().int(),
  })
  .openapi('BulkInviteDryRunResponse');

const BulkInviteKickoffResponse = z
  .object({
    batchId: z.string(),
    total: z.number().int(),
    status: z.union([z.literal('running'), z.literal('done')]),
  })
  .openapi('BulkInviteKickoffResponse');

const BulkInviteStatusResponse = z
  .object({
    status: BulkInviteStatus,
    total: z.number().int(),
    sent: z.number().int().nullable().optional(),
    failed: z.number().int().nullable().optional(),
    skipped: z.number().int().nullable().optional(),
  })
  .openapi('BulkInviteStatusResponse');

const OrgIdParam = z.object({ id: z.string() }).openapi('OrgIdParam');
const OrgBatchParams = z
  .object({
    id: z.string(),
    batchId: z.string(),
  })
  .openapi('OrgBatchParams');

function token() {
  return crypto.randomBytes(20).toString('hex');
}

const AUTH_ORIGIN = process.env.AUTH_ORIGIN!;
if (!AUTH_ORIGIN) throw new Error('AUTH_ORIGIN not configured');

//POST invites in bulk
invitesRegistry.registerPath({
  method: 'post',
  path: '/api/orgs/{id}/invites/bulk',
  summary: 'Create bulk invites for an organisation',
  tags: ['invites'],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgIdParam,
    body: { content: { 'application/json': { schema: BulkInviteBody } } },
  },
  responses: {
    200: {
      description: 'Bulk invite created. If dryRun=true, nothing is created.',
      content: {
        'application/json': {
          schema: z.union([
            BulkInviteDryRunResponse,
            BulkInviteKickoffResponse,
          ]),
        },
      },
    },
    400: {
      description: 'Invalid Input',
      content: { 'application/json': { schema: BasicError } },
    },
    401: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
    403: {
      description: 'Missing Permission',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.post(
  '/orgs/:id/invites/bulk',
  requireAuth,
  requirePermission('people.invite'),
  async (req, res) => {
    const orgId = req.params.id;
    const parsed = BulkInviteBody.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: 'Invalid input', details: parsed.error });

    const { invites, options } = parsed.data;
    const { expiresInDays, sendEmail, dryRun } = options;

    const effectiveRole = (i: z.infer<typeof InviteItem>) =>
      i.role ?? ParentRole.staff;
    const asKey = (x: z.infer<typeof InviteItem>) =>
      `${x.email.toLowerCase()}|${effectiveRole(x)}|${x.roleId ?? ''}|${x.unitId ?? ''}`;
    const unique = Array.from(
      new Map(invites.map((i) => [asKey(i), i])).values()
    );
    const total = unique.length;

    const batch = await prisma.inviteBatch.create({
      data: {
        orgId,
        total,
        status: dryRun ? 'done' : sendEmail ? 'queued' : 'done',
      },
    });

    // dry run
    if (dryRun) {
      return res.json({
        batchId: batch.id,
        total,
        status: 'done',
        sent: 0,
        failed: 0,
        skipped: 0,
      });
    }

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * expiresInDays
    );
    const created: Array<{ email: string; token: string; joinCode: string }> =
      [];
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const i of unique) {
        // do no recreate if identical pending exists
        const exists = await tx.invite.findFirst({
          where: {
            orgId,
            email: i.email.toLowerCase(),
            unitId: i.unitId ?? null,
            acceptedBy: null,
            expiresAt: { gt: new Date() },
            role: i.role ?? undefined,
            roleId: i.roleId ?? undefined,
          },
          select: { id: true },
        });
        if (exists) {
          skipped++;
          continue;
        }

        let roleId: string | null = null;
        let parentRole: ParentRole = i.role ?? ParentRole.staff;

        if (i.roleId) {
          const role = await tx.role.findFirst({
            where: { id: i.roleId, orgId },
            select: { id: true, parentRole: true },
          });
          if (!role) {
            skipped++;
            continue;
          }
          roleId = role.id;
          parentRole = role.parentRole;
        }

        const inv = await tx.invite.create({
          data: {
            orgId,
            email: i.email.toLowerCase(),
            role: parentRole,
            roleId,
            unitId: i.unitId,
            token: token(),
            joinCode: `KNW-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            expiresAt,
            meta: i.meta,
          },
          select: { email: true, token: true, joinCode: true },
        });
        created.push({
          email: inv.email,
          token: inv.token,
          joinCode: inv.joinCode ?? '',
        });
      }
      await tx.inviteBatch.update({
        where: { id: batch.id },
        data: { status: sendEmail ? 'running' : 'done', skipped },
      });
    });

    res.json({
      batchId: batch.id,
      total,
      status: sendEmail ? 'running' : 'done',
    });

    if (!sendEmail || created.length === 0) {
      await prisma.inviteBatch.update({
        where: { id: batch.id },
        data: { status: 'done' },
      });
      ssePush(batch.id, 'done', { total, sent: 0, failed: 0, skipped });
      return;
    }

    setImmediate(async () => {
      let sent = 0;
      let failed = 0;
      const paylaods = created.map((inv) => {
        const link = `${AUTH_ORIGIN}/join/${inv.token}`;
        const t = MailTemplates.invite(link, inv.joinCode);
        return {
          to: inv.email,
          subject: t.subject,
          html: wrapHtml({ title: t.subject, bodyHtml: t.html }),
        };
      });

      try {
        await sendBulkWithProgress(paylaods, {
          concurrency: Number(process.env.MAIL_CONCURRENCY || 5),
          retry: 1,
          backOffMs: 600,
          onProgress(ok) {
            if (ok) sent++;
            else failed++;
            ssePush(batch.id, 'progress', { total, sent, failed, skipped });
          },
        });

        await prisma.inviteBatch.update({
          where: { id: batch.id },
          data: { status: 'done', sent, failed },
        });
        ssePush(batch.id, 'done', { total, sent, failed, skipped });
      } catch (error) {
        await prisma.inviteBatch.update({
          where: { id: batch.id },
          data: { status: 'error', sent, failed },
        });
        ssePush(batch.id, 'error', {
          total,
          sent,
          failed,
          skipped,
          message: (error as any)?.message ?? 'bulk send error',
        });
      }
    });
  }
);

// GET sse streams -> live progress
invitesRegistry.registerPath({
  method: 'get',
  path: '/api/orgs/{id}/invites/bulk/{batchId}/stream',
  summary: 'SSE Streams for bulk invite progress.',
  description:
    'Server-Sent Events stream; emits progress updates `{total, sent, failed, skipped}` and final status.',
  tags: ['invites'],
  security: [{ cookieAuth: [] }],
  request: { params: OrgBatchParams },
  responses: {
    200: {
      description: 'Event Stream',
      content: {
        'text/event-stream': {
          schema: z.string().openapi('SSEStreamPayload'),
        },
      },
    },
    401: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.get('/orgs/:id/invites/bulk/:batchId/stream', requireAuth, (req, res) =>
  sseAttach(req, res, req.params.batchId)
);

//GET status (poll//resume)
invitesRegistry.registerPath({
  method: 'get',
  path: '/api/orgs/{id}/invites/bulk/{batchId}/status',
  summary: 'Get bulk invite batch status (poll/resume)',
  tags: ['invites'],
  security: [{ cookieAuth: [] }],
  request: { params: OrgBatchParams },
  responses: {
    200: {
      description: 'Current status of batch',
      content: { 'application/json': { schema: BulkInviteStatusResponse } },
    },
    401: {
      description: 'Forbidden',
      content: { 'application/json': { schema: BasicError } },
    },
    404: {
      description: 'Batch not found',
      content: { 'application/json': { schema: BasicError } },
    },
  },
});
r.get(
  '/orgs/:id/invites/bulk/:batchId/status',
  requireAuth,
  async (req, res) => {
    const batch = await prisma.inviteBatch.findUnique({
      where: { id: req.params.batchId },
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json({
      status: batch.status,
      total: batch.total,
      sent: batch.sent,
      failed: batch.failed,
      skipped: batch.skipped,
    });
  }
);

export const getInvitesOpenApiPaths = () => {
  const gen = new OpenApiGeneratorV3(invitesRegistry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Invites (Bulk) API', version: '1.0.0' },
  });
};

export default r;
