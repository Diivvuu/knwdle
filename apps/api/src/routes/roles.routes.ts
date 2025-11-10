import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { asyncHandler } from '../lib/https';
import { RolesController } from '../controllers/org/roles.controller';

const r = Router();

// catalog
r.get(
  '/orgs/:id/permissions',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(RolesController.listPermissions)
);

// list roles
r.get(
  '/orgs/:id/roles',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(RolesController.list)
);

// create role
r.post(
  '/orgs/:id/roles',
  requireAuth,
  requirePermission('roles.manage'),
  asyncHandler(RolesController.create)
);

// update role
r.patch(
  '/orgs/:id/roles/:roleId',
  requireAuth,
  requirePermission('roles.manage'),
  asyncHandler(RolesController.update)
);

// delete role
r.delete(
  '/orgs/:id/roles/:roleId',
  requireAuth,
  requirePermission('roles.manage'),
  asyncHandler(RolesController.remove)
);

// assign/unassign a custom role to a member
r.patch(
  '/orgs/:id/members/role',
  requireAuth,
  requirePermission('people.manage'),
  asyncHandler(RolesController.assignMemberRole)
);

export default r;
