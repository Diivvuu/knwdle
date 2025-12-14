import { badRequest, notFound, HttpError } from '../../lib/https';
import { MembershipRepo } from '../../repositories/org/membership.repo';
import { PermissionRepo } from '../../repositories/org/permission.repo';
import { RoleRepo } from '../../repositories/org/role.repo';

export const RolesService = {
  async listPermissions() {
    const perms = await PermissionRepo.listCatalog();
    return perms;
  },

  async listRoles(orgId: string) {
    return RoleRepo.list(orgId);
  },

  async createRole(
    orgId: string,
    data: {
      key: string;
      name: string;
      scope: 'org' | 'audience';
      permissionCodes: string[];
    }
  ) {
    const permissionIds = await PermissionRepo.byCodes(data.permissionCodes);
    const role = await RoleRepo.create({
      orgId,
      key: data.key,
      name: data.name,
      scope: data.scope,
      permissionIds,
    });
    return role;
  },

  async updateRole(
    orgId: string,
    roleId: string,
    data: {
      name?: string;
      scope?: 'org' | 'audience';
      permissionCodes?: string[];
    }
  ) {
    const role = await RoleRepo.findInOrg(orgId, roleId);
    if (!role) throw notFound('Role not found');

    const permIds = data.permissionCodes
      ? await PermissionRepo.byCodes(data.permissionCodes)
      : undefined;

    const updated = await RoleRepo.updateAndReplacePerms({
      roleId: role.id,
      name: data.name,
      scope: data.scope,
      permissionIds: permIds,
    });

    return updated;
  },

  async deleteRole(orgId: string, roleId: string) {
    const role = await RoleRepo.findInOrg(orgId, roleId);
    if (!role) throw notFound('Role not found');

    const assignedCount = await RoleRepo.assignedCount(orgId, roleId);
    if (assignedCount > 0) {
      const err = new HttpError(409, 'Role is currently assigned to members');
      // optional extra for clients
      (err as any).assignedCount = assignedCount;
      (err as any).hint = 'Reassign members before deleting this role.';
      throw err;
    }

    await RoleRepo.delete(roleId);
  },

  async assignOrUnassignCustomRole(
    orgId: string,
    userId: string,
    roleId: string | null
  ) {
    if (roleId) {
      const role = await RoleRepo.findInOrg(orgId, roleId);
      if (!role) throw badRequest('Role not found');
    }

    const m = await MembershipRepo.findOrgScoped(orgId, userId);
    if (!m) throw badRequest('Membership not found');

    const updated = await MembershipRepo.updateRoleId(m.id, roleId);
    return updated;
  },
};
