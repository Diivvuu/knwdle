import { badRequest, notFound } from '../../lib/https';
import {
  buildCursorWhere,
  clampLimit,
  decodeCursor,
  encodeCursor,
  stableOrder,
} from '../../lib/pagination';
import { OrgRepo } from '../../repositories/org/org.repo';

export const OrgMemberService = {
  async listMembers(orgId: string, query: any) {
    const { role, roleId, audienceId, search, cursor } = query;
    const limit = clampLimit(query.limit);

    const where = {
      orgId,
      ...(role && { role }),
      ...(roleId && { roleId }),
      ...(audienceId && { audienceId }),
      ...(search && {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
      ...buildCursorWhere(decodeCursor(cursor)),
    };

    const members = await OrgRepo.listMembers(where, stableOrder(), limit + 1);
    const nextCursor =
      members.length > limit
        ? encodeCursor(members[limit].createdAt, members[limit].id)
        : null;

    return {
      data: members.slice(0, limit),
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
      const member = await OrgRepo.getMemberWithRole(orgId, memberId);
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
      return OrgRepo.updateMember(orgId, memberId, data);
    });
  },

  async removeMember(orgId: string, memberId: string) {
    return prisma?.$transaction(async () => {
      const member = await OrgRepo.getMemberWithRole(orgId, memberId);
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
      return OrgRepo.removeMember(orgId, memberId);
    });
  },

  async getMember(orgId: string, memberId: string) {
    const member = await OrgRepo.getMember(orgId, memberId);
    if (!member) throw notFound('Member not found');
    return member;
  },
};
