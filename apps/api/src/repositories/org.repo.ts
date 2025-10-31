import { prisma } from '../lib/prisma';
import { OrgUnitType, ParentRole, OrgType } from '../generated/prisma';

export const OrgRepo = {
  // ─── ORG: CRUD ────────────────────────────────────────────────
  findByIdWithProfile(id: string) {
    return prisma.organisation.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  listMyOrgs(userId: string) {
    return prisma.organisation.findMany({
      where: { members: { some: { userId } } },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createOrgWithMainUnit(params: {
    name: string;
    type: OrgType;
    teamSize?: string;
    meta: any;
    ownerUserId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.organisation.create({
        data: {
          name: params.name,
          type: params.type,
          teamSize: params.teamSize,
          profile: { create: { meta: params.meta } },
          members: {
            create: { userId: params.ownerUserId, role: ParentRole.admin },
          },
        },
        include: { profile: true },
      });

      await tx.orgUnit.create({
        data: {
          orgId: created.id,
          name: 'Main',
          parentId: null,
          type: OrgUnitType.ROOT,
          meta: {},
        },
      });

      return created;
    });
  },

  updateOrgAndProfile(
    id: string,
    data: {
      org: Record<string, any>;
      meta?: any;
    }
  ) {
    return prisma.organisation.update({
      where: { id },
      data: {
        ...data.org,
        profile: data.meta
          ? {
              upsert: {
                create: { meta: data.meta },
                update: { meta: data.meta },
              },
            }
          : undefined,
      },
      include: { profile: true },
    });
  },

  deleteOrg(id: string) {
    return prisma.organisation.delete({ where: { id } });
  },

  getOrgTypeAndMeta(orgId: string) {
    return prisma.organisation.findUnique({
      where: { id: orgId },
      select: { type: true, profile: { select: { meta: true } } },
    });
  },

  getOrgTypeById(orgId: string) {
    return prisma.organisation.findUnique({
      where: { id: orgId },
      select: { type: true },
    });
  },

  // ─── MEMBERSHIP ───────────────────────────────────────────────
  listMembers(where: any, orderBy: any, take: number) {
    return prisma.orgMembership.findMany({
      where,
      take,
      orderBy,
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, name: true } },
        customerRole: { select: { id: true, name: true } },
      },
    });
  },

  addMember(orgId: string, input: any) {
    return prisma.orgMembership.create({
      data: {
        orgId,
        userId: input.userId,
        role: input.role,
        roleId: input.roleId,
        unitId: input.unitId,
      },
    });
  },

  updateMember(orgId: string, memberId: string, data: any) {
    return prisma.orgMembership.update({
      where: { id: memberId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, name: true } },
        customerRole: { select: { id: true, name: true, parentRole: true } },
      },
    });
  },

  removeMember(orgId: string, memberId: string) {
    return prisma.orgMembership.delete({
      where: { id: memberId },
    });
  },

  getMember(orgId: string, memberId: string) {
    return prisma.orgMembership.findFirst({
      where: { id: memberId, orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        customerRole: { select: { id: true, name: true } },
      },
    });
  },

  isMember(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { id: true },
    });
  },

  isAdmin(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId, role: 'admin' },
      select: { id: true },
    });
  },

  getMembership(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { role: true, roleId: true },
    });
  },

  getMemberShipLite(orgId: string, userId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { id: true },
    });
  },

  getMemberships(orgId: string, userId: string) {
    return prisma.orgMembership.findMany({
      where: { orgId, userId },
      select: { role: true, unitId: true },
    });
  },

  countMembers(orgId: string) {
    return prisma.orgMembership.count({ where: { orgId } });
  },

  countRoleMembers(orgId: string, role: ParentRole) {
    return prisma.orgMembership.count({ where: { orgId, role } });
  },

  countPendingInvites(orgId: string) {
    return prisma.invite.count({
      where: { orgId, acceptedBy: null, expiresAt: { gt: new Date() } },
    });
  },

  getLastJoinedMember(orgId: string) {
    return prisma.orgMembership.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
  },

  getRecentMembers(orgId: string) {
    return prisma.orgMembership.findMany({
      where: { orgId },
      take: 5,
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });
  },

  getMemberWithRole(orgId: string, memberId: string) {
    return prisma.orgMembership.findFirst({
      where: { id: memberId, orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, name: true } },
        customerRole: { select: { id: true, name: true, parentRole: true } },
      },
    });
  },

  getRoleById(orgId: string, roleId: string) {
    return prisma.role.findFirst({
      where: { id: roleId, orgId },
      select: { id: true, parentRole: true },
    });
  },

  async countAdmins(orgId: string) {
    const [buildinAdmins, customAdmins] = await Promise.all([
      prisma.orgMembership.count({
        where: { orgId, role: 'admin' as any },
      }),
      prisma.orgMembership.count({
        where: {
          orgId,
          roleId: { not: null },
          customerRole: { parentRole: 'admin' as any },
        },
      }),
    ]);

    return buildinAdmins + customAdmins;
  },

  // ─── PERMISSIONS ──────────────────────────────────────────────
  getCustomRolePermissionCodes(roleId: string) {
    return prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
  },

  getPermissionCodesForRole(roleId: string) {
    return prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { code: true } } },
    });
  },

  // ─── UNITS ────────────────────────────────────────────────────
  countUnits(orgId: string) {
    return prisma.orgUnit.count({ where: { orgId } });
  },

  getRecentUnits(orgId: string) {
    return prisma.orgUnit.findMany({
      where: { orgId },
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        _count: { select: { members: true } },
      },
    });
  },

  // ─── MISC ─────────────────────────────────────────────────────
  getRecentAnnouncements(orgId: string) {
    return prisma.announcement.findMany({
      where: { orgId },
      orderBy: [{ pin: 'desc' }, { createdAt: 'desc' }],
      take: 3,
      select: { id: true, title: true, pin: true, createdAt: true },
    });
  },

  getAttendanceSessions(orgId: string) {
    return prisma.attendanceSession.findMany({
      where: { orgId },
      orderBy: { date: 'desc' },
      take: 20,
      select: { id: true, date: true, records: true },
    });
  },

  getFeeInvoice(orgId: string) {
    return prisma.feeInvoice.findMany({
      where: { orgId },
      select: { amount: true, status: true, dueAt: true },
    });
  },

  getAuditLogs(
    orgId: string,
    unitId?: string,
    cursor?: { id: string; createdAt: Date },
    limit = 20
  ) {
    return prisma.auditLog.findMany({
      where: {
        orgId,
        ...(unitId ? { entityId: unitId } : {}),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        meta: true,
        actorId: true,
        createdAt: true,
      },
    });
  },
};
