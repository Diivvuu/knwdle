import { Router } from 'express';
import { PrismaClient, OrgType, ParentRole } from '../generated/prisma'; // <-- import Prisma namespace
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { getMetaSchema } from '../lib/org-types';

type MyUnitRole = { role: ParentRole; unitId: string | null };

const prisma = new PrismaClient();
const r = Router();

const CreateOrgBody = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(OrgType),
  meta: z.unknown().optional(),
  teamSize: z.string().min(1).optional(),
});

const UpdateOrgBody = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  teamSize: z.string().min(1).optional(),
  country: z.string().length(2).toUpperCase().optional(),
  timezone: z.string().min(1).optional(),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  brand_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/)
    .optional(),
  address: z.string().optional(),
  contactPhone: z.string().min(3).max(32).optional(),
  meta: z.unknown().optional(),
});

const IdParam = z.object({ id: z.string().min(1) });

async function assertOrgMember(orgId: string, userId: string) {
  const m = await prisma.orgMembership.findFirst({
    where: { orgId, userId },
    select: { id: true },
  });
  return Boolean(m);
}

async function isOrgAdmin(orgId: string, userId: string) {
  const m = await prisma.orgMembership.findFirst({
    where: { orgId, userId, role: ParentRole.admin },
    select: { id: true },
  });
  return Boolean(m);
}

async function getMyRoleForOrg(orgId: string, userId: string) {
  const ms = await prisma.orgMembership.findMany({
    where: { orgId, userId },
    select: { role: true, unitId: true },
  });

  const order = [
    ParentRole.admin,
    ParentRole.staff,
    ParentRole.student,
    ParentRole.parent,
  ];

  const myUnitRoles: MyUnitRole[] = ms.map((m) => ({
    role: m.role,
    unitId: m.unitId ?? null,
  }));

  const myRole = order.find(
    (r) => ms.some((m) => m.role === r) ?? ms[0]?.role ?? null
  );

  return { myRole, myUnitRoles };
}

r.post('/orgs', requireAuth, async (req, res) => {
  const parsed = CreateOrgBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { name, type, teamSize, meta } = parsed.data;
  const schema = getMetaSchema(type);
  const metaParsed = schema.safeParse(meta ?? {});
  if (!metaParsed.success) {
    return res
      .status(422)
      .json({ error: 'Invalid meta', details: metaParsed.error.flatten() });
  }

  const org = await prisma.organisation.create({
    data: {
      name,
      type,
      teamSize,
      profile: { create: { meta: metaParsed.data } },
      members: { create: { userId: req.user!.id, role: ParentRole.admin } },
    },
    include: { profile: true },
  });

  await prisma.orgUnit.create({ data: { orgId: org.id, name: 'Root' } });

  res.status(201).json(org);
});

r.get('/orgs', requireAuth, async (req, res) => {
  const orgs = await prisma.organisation.findMany({
    where: { members: { some: { userId: req.user!.id } } },
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  });

  const withRoles = await Promise.all(
    orgs.map(async (o) => {
      const { myRole, myUnitRoles } = await getMyRoleForOrg(o.id, req.user!.id);
      return { ...o, myRole, myUnitRoles };
    })
  );
  res.json(withRoles);
});

r.get('/orgs/:id', requireAuth, async (req, res) => {
  const p = IdParam.safeParse(req.params);
  if (!p.success) return res.status(400).json({ error: 'Bad org id' });

  const isMember = await assertOrgMember(p.data.id, req.user!.id);
  if (!isMember) return res.status(401).json({ error: 'Org not found' });

  const org = await prisma.organisation.findUnique({
    where: { id: p.data.id },
    include: {
      profile: true,
    },
  });

  if (!org) return res.status(404).json({ error: 'Org not found' });

  const { myRole, myUnitRoles } = await getMyRoleForOrg(org.id, req.user!.id);
  res.json({ ...org, myRole, myUnitRoles });
});

r.patch('/orgs/:id', requireAuth, async (req, res) => {
  const p = IdParam.safeParse(req.params);
  if (!p.success) return res.status(400).json({ error: 'Bad org id' });

  const body = UpdateOrgBody.safeParse(req.body);
  if (!body.success) {
    return res
      .status(400)
      .json({ error: 'Invalid input', details: body.error.flatten() });
  }

  const isAdmin = await isOrgAdmin(p.data.id, req.user!.id);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const org = await prisma.organisation.findUnique({
    where: { id: p.data.id },
    include: { profile: true },
  });

  if (!org) return res.status(404).json({ error: 'Org not found' });

  let metadata: unknown | undefined = undefined;
  if (body.data.meta !== undefined) {
    const schema = getMetaSchema(org.type as OrgType);
    const metaParsed = schema.safeParse(body.data.meta);
    if (!metaParsed.success) {
      return res
        .status(422)
        .json({ error: 'Invalid meta', details: metaParsed.error.flatten() });
    }

    metadata = metaParsed.data;
  }

  const d: any = {};
  for (const k of [
    'name',
    'description',
    'teamSize',
    'country',
    'timezone',
    'logoUrl',
    'coverUrl',
    'brand_color',
    'address',
    'contactPhone',
  ] as const) {
    if (body.data[k] !== undefined) d[k] = body.data[k];
  }

  const updated = await prisma.organisation.update({
    where: { id: p.data.id },
    data: {
      ...d,
      profile: metadata
        ? { upsert: { create: { meta: metadata }, update: { meta: metadata } } }
        : undefined,
    },
    include: { profile: true },
  });

  res.json(updated);
});

r.delete('/orgs/:id', requireAuth, async (req, res) => {
  const p = IdParam.safeParse(req.params);
  if (!p.success) return res.status(400).json({ error: 'Bad org id' });

  const isAdmin = await isOrgAdmin(p.data.id, req.user!.id);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  await prisma.organisation.delete({ where: { id: p.data.id } }); //cascade manually (remove if done in schema)
  res.status(204).send();
});

export default r;
