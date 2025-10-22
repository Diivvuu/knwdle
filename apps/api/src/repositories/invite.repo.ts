// src/repositories/invite.repo.ts
import { prisma } from '../lib/prisma';
import { ParentRole } from '../generated/prisma';

export const InviteRepo = {
  findDuplicatePending(orgId: string, email: string, unitId?: string | null) {
    return prisma.invite.findFirst({
      where: { orgId, email, unitId: unitId ?? null, acceptedBy: null, expiresAt: { gt: new Date() } },
      select: { id: true, createdAt: true, expiresAt: true, joinCode: true },
    });
  },

  create(data: {
    orgId: string; email: string; role: ParentRole; roleId?: string | null;
    unitId?: string | null; token: string; joinCode: string; expiresAt: Date; meta?: any;
  }) {
    return prisma.invite.create({ data });
  },

  list(where: any, orderBy: any[], take: number) {
    return prisma.invite.findMany({
      where, orderBy, take,
      select: {
        id: true, orgId: true, email: true, role: true, roleId: true, unitId: true,
        token: true, joinCode: true, expiresAt: true, acceptedBy: true, createdAt: true, meta: true,
      },
    });
  },

  delete(inviteId: string) {
    return prisma.invite.delete({ where: { id: inviteId } });
  },

  findByToken(token: string) {
    return prisma.invite.findUnique({ where: { token } });
  },

  findByJoinCode(code: string) {
    return prisma.invite.findUnique({ where: { joinCode: code } });
  },

  markAccepted(inviteId: string, userId: string) {
    return prisma.invite.update({ where: { id: inviteId }, data: { acceptedBy: userId } });
  },
};