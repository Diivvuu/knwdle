import { badRequest, notFound } from '../../lib/https';
import {
  buildCursorWhere,
  clampLimit,
  decodeCursor,
  encodeCursor,
  stableOrder,
} from '../../lib/pagination';
import { prisma } from '../../lib/prisma';
import { OrgRepo } from '../../repositories/org/org.repo';


export const OrgMemberService = {
  async listMembers(orgId: string, query: any) {
    const { role, roleId, audienceId, search, cursor, excludeAudienceId } =
      query;
    const limit = clampLimit(query.limit);

    const membershipFilters: any = {
      orgId,
      ...(role && { role }),
      ...(roleId && { roleId }),
      ...(audienceId && { audienceId }),
      ...(excludeAudienceId && { audienceId: null }),
    };

    const userWhere: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      memberships: {
        some: membershipFilters,
        ...(excludeAudienceId && {
          none: { orgId, audienceId: excludeAudienceId },
        }),
      },
    };

    const cursorWhere = buildCursorWhere(decodeCursor(cursor));
    if (cursorWhere) {
      userWhere.AND = [...(userWhere.AND || []), cursorWhere];
    }

    const users = await OrgRepo.listMembers(
      orgId,
      userWhere,
      stableOrder(),
      limit + 1
    );

    const nextCursor =
      users.length > limit
        ? encodeCursor(users[limit].createdAt, users[limit].id)
        : null;

    const data = users.slice(0, limit).map((u) => {
      const orgMembership = u.memberships.find((m) => m.audienceId === null);

      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        orgRole: orgMembership?.role ?? null,
        roleId: orgMembership?.roleId ?? null,
        audiences: u.memberships
          .filter((m) => m.audienceId && m.audience)
          .map((m) => ({
            id: m.audience!.id,
            name: m.audience!.name,
          })),
      };
    });

    return {
      data,
      nextCursor,
    };
  },

  async addMember(orgId: string, input: any) {
    if (!input.role && !input.roleId)
      throw badRequest('Either role or roleIdis required');
    return OrgRepo.addMember(orgId, input);
  },

  async updateMember(orgId: string, memberId: string, data: any) {
    const roleChanging =
      Object.prototype.hasOwnProperty.call(data, 'role') ||
      Object.prototype.hasOwnProperty.call(data, 'roleId');

    if (!roleChanging) {
      return OrgRepo.updateMember(orgId, memberId, data);
    }
    return prisma?.$transaction(async () => {
      const member =
        (await OrgRepo.getMemberWithRole(orgId, memberId)) ||
        (await OrgRepo.getMemberWithRoleByUser(orgId, memberId));
      if (!member) throw notFound('Member not found');

      const isCurrentAdminType =
        member.role === 'admin' ||
        (member.roleId && member.customerRole?.parentRole === 'admin');

      const targetRoleId = data.roleId ?? null;
      const targetBuiltinRole = data.role ?? null;

      let isTargetAdminType = false;
      if (targetRoleId) {
        const targetRole = await OrgRepo.getRoleById(orgId, targetRoleId);
        if (!targetRole) throw badRequest('Invalid roleId');
        isTargetAdminType = targetBuiltinRole.parentRole === 'admin';
      } else if (typeof targetBuiltinRole === 'string') {
        isTargetAdminType = targetBuiltinRole === 'admin';
      }

      if (isCurrentAdminType && !isTargetAdminType) {
        const adminCount = await OrgRepo.countAdmins(orgId);
        if (adminCount <= 1) {
          throw badRequest(
            'Cannot change role : this is the only admin in the organisation'
          );
        }
      }
      return OrgRepo.updateMember(orgId, member.id, data);
    });
  },

  async removeMember(orgId: string, memberId: string) {
    return prisma?.$transaction(async () => {
      const member =
        (await OrgRepo.getMemberWithRole(orgId, memberId)) ||
        (await OrgRepo.getMemberWithRoleByUser(orgId, memberId));
      if (!member) throw notFound('Member not found');

      const isAdminType =
        member.role === 'admin' ||
        (member.roleId && member.customerRole?.parentRole === 'admin');

      if (isAdminType) {
        const adminCount = await OrgRepo.countAdmins(orgId);
        if (adminCount <= 1) {
          throw badRequest('Cannot delete the only admin in the organisation');
        }
      }
      return OrgRepo.removeMember(orgId, member.id);
    });
  },

  async getMember(orgId: string, memberId: string) {
    let member = await OrgRepo.getMember(orgId, memberId);
    if (!member) {
      // also allow lookup by userId (org-scoped membership)
      member = await OrgRepo.getMemberByUser(orgId, memberId);
    }
    if (!member) throw notFound('Member not found');
    return member;
  },
};
