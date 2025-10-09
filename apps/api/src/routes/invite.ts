import crypto from 'crypto';
import z from 'zod';
import { ParentRole, PrismaClient } from '../generated/prisma';
import { requireAuth } from '../middleware/auth';
import { Router } from 'express';
import { MailTemplates } from '../lib/mail-templates';
import { sendMail, wrapHtml } from '../lib/mailer';
import { requirePermission } from '../middleware/permissions';

const prisma = new PrismaClient();
const r = Router();

const AUTH_ORIGIN = process.env.AUTH_ORIGIN;
if (!AUTH_ORIGIN) throw new Error('APP_ORIGIN not configured');

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}
export function generateJoinCode() {
  return `KNW-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
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
  });

// create invite
r.post(
  '/orgs/:id/invites',
  requireAuth,
  requirePermission('people.invite'),
  async (req, res) => {
    const { id: orgId } = req.params;
    const body = InviteBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid input' });

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

// admin invites list
r.get(
  '/orgs/:id/invites',
  requireAuth,
  requirePermission('people.manage'),
  async (req, res) => {
    const { id: orgId } = req.params;
    const isMember = await prisma.orgMembership.findFirst({
      where: { orgId, userId: req.user!.id },
    });
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });
    const invites = await prisma.invite.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invites);
  }
);

// delete invite
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

const JoinCodeBody = z.object({
  code: z.string().min(6),
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

export default r;
