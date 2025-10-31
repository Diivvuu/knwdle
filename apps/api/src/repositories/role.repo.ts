import { prisma } from '../lib/prisma';
import type { scopeEnum } from '../domain/roles.schema';
import z from 'zod';
import { Prisma } from '../generated/prisma';

type Scope = z.infer<typeof scopeEnum>;

export const RoleRepo = {
  list(orgId: string) {
    return prisma.role.findMany({
      where: { orgId },
      include: { permissions: { include: { permission: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  create(params: {
    orgId: string;
    key: string;
    name: string;
    scope: Scope;
    permissionIds: string[];
  }) {
    return prisma.role.create({
      data: {
        orgId: params.orgId,
        key: params.key,
        name: params.name,
        scope: params.scope,
        parentRole: 'staff', // base lineage
        permissions: {
          create: params.permissionIds.map((id) => ({ permissionId: id })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
  },

  findInOrg(orgId: string, roleId: string) {
    return prisma.role.findFirst({
      where: { id: roleId, orgId },
      select: { id: true },
    });
  },

  updateAndReplacePerms(params: {
    roleId: string;
    name?: string;
    scope?: Scope;
    permissionIds?: string[];
  }) {
    return prisma.role.update({
      where: { id: params.roleId },
      data: {
        name: params.name,
        scope: params.scope,
        permissions: params.permissionIds
          ? {
              deleteMany: {},
              create: params.permissionIds.map((id) => ({ permissionId: id })),
            }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
  },

  assignedCount(orgId: string, roleId: string) {
    return prisma.orgMembership.count({ where: { orgId, roleId } });
  },

  delete(roleId: string) {
    return prisma.role.delete({ where: { id: roleId } });
  },
  findroleById(orgId: string, roleId: string) {
    return prisma.role.findFirst({
      where: { id: roleId, orgId },
      select: { id: true, parentRole: true },
    });
  },

  txFindRoleById(tx: Prisma.TransactionClient, orgId: string, roleId: string) {
    return tx.role.findFirst({
      where: { id: roleId, orgId },
      select: { id: true, parentRole: true },
    });
  },
};
