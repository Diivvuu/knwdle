import crypto from 'crypto';
import z from 'zod';
import { ParentRole, PrismaClient } from '../generated/prisma';
import { requireAuth } from '../middleware/auth';
import { Router } from 'express';
import { InputJsonValue } from '../generated/prisma/runtime/library';
import { MailTemplates } from '../lib/mail-templates';
import { sendMail, wrapHtml } from '../lib/mailer';

const prisma = new PrismaClient();
const r = Router();

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}
function generateJoinCode() {
  return `KNW-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const InviteBody = z.object({
  email: z.string().email(),
  role: z.nativeEnum(ParentRole),
  unitId: z.string().optional(),
  meta: z.unknown().optional(),
});

r.post('/orgs/:id/invites', requireAuth, async (req, res) => {
  const { id: orgId } = req.params;
  const body = InviteBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid input' });

  const isAdmin = await prisma.orgMembership.findFirst({
    where: { orgId, userId: req.user!.id, role: ParentRole.admin },
  });
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const token = generateToken();
  const joinCode = generateJoinCode();

  const invite = await prisma.invite.create({
    data: {
      email: body.data.email,
      role: body.data.role,
      unitId: body.data.unitId,
      orgId,
      token,
      joinCode,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), //7 days.
      meta: body.data.meta,
    },
  });

  const link = `${process.env.APP_ORIGIN}/joion/${token}`;
  const t = MailTemplates.invite(link, joinCode); //add invite template

  await sendMail(
    body.data.email,
    t.subject,
    wrapHtml({ title: t.subject, bodyHtml: t.html })
  );

  res.status(201).json(invite);
});

// admin invites list
r.get('/orgs/:id/invites', requireAuth, async (req, res) => {
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
});

// delete invite
r.delete('/orgs/:ordId/invites/:inviteId', requireAuth, async (req, res) => {
  const { orgId, inviteId } = req.params;

  const isAdmin = await prisma.orgMembership.findFirst({
    where: { orgId, userId: req.user!.id, role: ParentRole.admin },
  });

  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
  await prisma.invite.delete({ where: { id: inviteId } });
  res.status(204).send();
});

r.post("/invites/:token/accept", requireAuth, async (req, res) => {
    const { token } = req.params;

    const invite = await prisma.invite.findUnique
})