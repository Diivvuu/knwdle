// src/services/bulk-invites.service.ts
import crypto from 'crypto';
import { z } from 'zod';
import { ParentRole } from '../generated/prisma';
import { prisma } from '../lib/prisma';
import { MailTemplates } from '../lib/mail-templates';
import { sendBulkWithProgress, wrapHtml } from '../lib/mailer';
import { badRequest, notFound } from '../lib/https';
import { ssePush } from '../lib/sse';
import { BulkInviteItem } from '../domain/bulk-invite.schema';

const AUTH_ORIGIN = process.env.AUTH_ORIGIN!;
if (!AUTH_ORIGIN) throw new Error('AUTH_ORIGIN not configured');

function token() {
  return crypto.randomBytes(20).toString('hex');
}
function joinCode() {
  return `KNW-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export const BulkInvitesService = {
  async kickoff(
    orgId: string,
    body: z.infer<typeof BulkInviteItem>[],
    options: {
      expiresInDays: number;
      sendEmail: boolean;
      dryRun: boolean;
    }
  ) {
    const { expiresInDays, sendEmail, dryRun } = options;

    const effectiveRole = (i: z.infer<typeof BulkInviteItem>) =>
      i.role ?? ParentRole.staff;
    const asKey = (x: z.infer<typeof BulkInviteItem>) =>
      `${x.email.toLowerCase()}|${effectiveRole(x)}|${x.roleId ?? ''}|${x.unitId ?? ''}`;

    const unique = Array.from(new Map(body.map((i) => [asKey(i), i])).values());
    const total = unique.length;

    const batch = await prisma.inviteBatch.create({
      data: {
        orgId,
        total,
        status: dryRun ? 'done' : sendEmail ? 'queued' : 'done',
      },
    });

    if (dryRun) {
      // nothing created
      return {
        batchId: batch.id,
        total,
        status: 'done',
        sent: 0,
        failed: 0,
        skipped: 0,
      } as const;
    }

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * expiresInDays
    );
    const created: Array<{ email: string; token: string; joinCode: string }> =
      [];
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const i of unique) {
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
            joinCode: joinCode(),
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

    // if not sending email, we are done
    if (!sendEmail || created.length === 0) {
      await prisma.inviteBatch.update({
        where: { id: batch.id },
        data: { status: 'done' },
      });
      ssePush(batch.id, 'done', { total, sent: 0, failed: 0, skipped });
      return { batchId: batch.id, total, status: 'done' } as const;
    }

    // async email send (background)
    setImmediate(async () => {
      let sent = 0,
        failed = 0;
      const payloads = created.map((inv) => {
        const link = `${AUTH_ORIGIN}/join/${inv.token}`;
        const t = MailTemplates.invite(link, inv.joinCode);
        return {
          to: inv.email,
          subject: t.subject,
          html: wrapHtml({ title: t.subject, bodyHtml: t.html }),
        };
      });

      try {
        await sendBulkWithProgress(payloads, {
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
      } catch (e: any) {
        await prisma.inviteBatch.update({
          where: { id: batch.id },
          data: { status: 'error', sent, failed },
        });
        ssePush(batch.id, 'error', {
          total,
          sent,
          failed,
          skipped,
          message: e?.message ?? 'bulk send error',
        });
      }
    });

    return { batchId: batch.id, total, status: 'running' } as const;
  },

  async batchStatus(batchId: string) {
    const batch = await prisma.inviteBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch) throw notFound('Batch not found');
    return {
      status: batch.status,
      total: batch.total,
      sent: batch.sent,
      failed: batch.failed,
      skipped: batch.skipped,
    };
  },
};
