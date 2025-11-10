import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { asyncHandler } from '../../lib/https';
import { OrgMembersController } from '../../controllers/org/org.members.controller';

const r = Router({ mergeParams: true });

r.use(requireAuth);

r.get(
  '/:orgId/members',
  requirePermission('people.view'),
  asyncHandler(OrgMembersController.list)
);

r.post(
  '/:orgId/members',
  requirePermission('people.manage'),
  asyncHandler(OrgMembersController.create)
);

r.get(
  '/:orgId/members/:memberId',
  requirePermission('people.view'),
  asyncHandler(OrgMembersController.get)
);

r.patch(
  '/:orgId/members/:memberId',
  requirePermission('people.manage'),
  asyncHandler(OrgMembersController.update)
);

r.delete(
  '/:orgId/members/:memberId',
  requirePermission('people.manage'),
  asyncHandler(OrgMembersController.remove)
);

export default r