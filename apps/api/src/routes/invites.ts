import { Router } from 'express';
import z from 'zod';
import crypto from 'crypto';

import { ParentRole, PrismaClient } from '../generated/prisma';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { generateJoinCode } from './invite';
import { MailTemplates } from '../lib/mail-templates';
import { sendMail, wrapHtml } from '../lib/mailer';

const prisma = new PrismaClient();
const r = Router();

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
  });

const BulkInviteBody = z.object({
  invites: z.array(InviteItem).min(1).max(200),
  options: z
    .object({
      expiresInDays: z.number().int().min(1).max(30).default(7),
      sendEmail: z.boolean().default(true),
      dryRun: z.boolean().default(false),
    })
    .default({}),
});

function token() {
  return crypto.randomBytes(20).toString('hex');
}

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
        .json({ error: 'Invalid input', details: parsed.error.flatten() });

    const { invites, options } = parsed.data;
    const { expiresInDays, sendEmail, dryRun } = options;

    const effectiveRole = (i: z.infer<typeof InviteItem>) =>
      i.role ?? ParentRole.staff;
    const asKey = (x: z.infer<typeof InviteItem>) =>
      `${x.email.toLowerCase()}|${effectiveRole(x)}|${x.roleId ?? ''}|${x.unitId ?? ''}`;

    const unique = Array.from(
      new Map(invites.map((i) => [asKey(i), i])).values()
    );

    const emails = unique.map((i) => i.email.toLowerCase());
    const existing = await prisma.invite.findMany({
      where: {
        orgId,
        email: { in: emails },
        acceptedBy: null,
        expiresAt: { gt: new Date() },
      },
      select: { email: true, role: true, roleId: true, unitId: true },
    });
    const existingKeys = new Set(
      existing.map(
        (i) =>
          `${i.email.toLowerCase()}|${i.role ?? ParentRole.staff}|${i.roleId ?? ''}|${i.unitId ?? ''}`
      )
    );

    const results: Array<{
      input: z.infer<typeof InviteItem>;
      status: 'skipped-exists' | 'created' | 'dry-run' | 'error';
      id?: string;
      message?: string;
    }> = [];

    if (dryRun) {
      for (const i of unique) {
        const key = asKey(i);
        if (existingKeys.has(key))
          results.push({
            input: i,
            status: 'skipped-exists',
            message: 'Pending invite already exists',
          });
        else results.push({ input: i, status: 'dry-run' });
      }
      return res.json({ count: unique.length, results });
    }

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * expiresInDays
    );

    await prisma.$transaction(async (tx) => {
      for (const i of unique) {
        const key = asKey(i);
        if (existingKeys.has(key)) {
          results.push({
            input: i,
            status: 'skipped-exists',
            message: 'Pending invite already exists',
          });
          continue;
        }
        try {
          let customRoleId: string | null = null;
          if (i.roleId) {
            const role = await tx.role.findFirst({
              where: { id: i.roleId, orgId },
            });
            if (!role) throw new Error('Customr role not found in org');
            customRoleId = role.id;
          }

          const inv = await tx.invite.create({
            data: {
              orgId,
              email: i.email.toLowerCase(),
              role: i.role ?? ParentRole.staff,
              roleId: customRoleId,
              unitId: i.unitId,
              token: token(),
              joinCode: generateJoinCode(),
              expiresAt,
              meta: i.meta,
            },
          });

          if (sendEmail) {
            const link = `${process.env.AUTH_ORIGIN}/join/${inv.token}`;
            const t = MailTemplates.invite(link, inv.joinCode!);
            await sendMail(
              inv.email,
              t.subject,
              wrapHtml({ title: t.subject, bodyHtml: t.html })
            );

            results.push({
              input: i,
              status: 'created',
              id: inv.id,
              message: undefined,
            });
          }
        } catch (error: any) {
          results.push({
            input: i,
            status: 'error',
            message: error?.message ?? 'Failed to create invite',
          });
        }
      }
    });
    res.json({ count: unique.length, results });
  }
);

export default r;
