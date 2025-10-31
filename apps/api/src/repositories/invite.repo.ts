// src/repositories/invite.repo.ts
import { prisma } from '../lib/prisma';
import { ParentRole } from '../generated/prisma';
import z from 'zod';
import type { Prisma } from '../generated/prisma';
import { BulkInviteItem } from '../domain/bulk-invite.schema';

export const InviteRepo = {
  findDuplicatePending(orgId: string, email: string, unitId?: string | null) {
    return prisma.invite.findFirst({
      where: {
        orgId,
        email,
        unitId: unitId ?? null,
        acceptedBy: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, createdAt: true, expiresAt: true, joinCode: true },
    });
  },

  create(data: {
    orgId: string;
    email: string;
    role: ParentRole;
    roleId?: string | null;
    unitId?: string | null;
    token: string;
    joinCode: string;
    expiresAt: Date;
    meta?: any;
  }) {
    return prisma.invite.create({ data });
  },

  list(where: any, orderBy: any[], take: number) {
    return prisma.invite.findMany({
      where,
      orderBy,
      take,
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
    return prisma.invite.update({
      where: { id: inviteId },
      data: { acceptedBy: userId },
    });
  },

  //bulk invite methods
  createBatch(data: { orgId: string; total: number; status: string }) {
    return prisma.inviteBatch.create({ data });
  },
  updateBatch(
    batchId: string,
    data: Partial<{
      status: string;
      skipped: number;
      sent: number;
      failed: number;
    }>
  ) {
    return prisma.inviteBatch.update({ where: { id: batchId }, data });
  },
  findBatchById(batchId: string) {
    return prisma.inviteBatch.findUnique({ where: { id: batchId } });
  },

  txCreateInvite(
    tx: Prisma.TransactionClient,
    data: {
      orgId: string;
      email: string;
      role: ParentRole;
      roleId?: string | null;
      unitId?: string | null;
      token: string;
      joinCode: string;
      expiresAt: Date;
      meta?: any;
    }
  ) {
    return tx.invite.create({
      data,
      select: { email: true, token: true, joinCode: true },
    });
  },

  txFindDuplicateInvite(
    tx: Prisma.TransactionClient,
    orgId: string,
    i: z.infer<typeof BulkInviteItem>
  ) {
    return tx.invite.findFirst({
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
  },

  txUpdateBatchStatus(
    tx: Prisma.TransactionClient,
    batchId: string,
    status: string,
    skipped: number
  ) {
    return tx.inviteBatch.update({
      where: { id: batchId },
      data: { status, skipped },
    });
  },
  withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(fn);
  },

  findPreviewByToken(token: string) {
    return prisma.invite.findUnique({
      where: { token },
      select: {
        email: true,
        expiresAt: true,
        role: true,
        roleRef: { select: { name: true } },
        org: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });
  },
};
