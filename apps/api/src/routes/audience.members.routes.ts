import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { asyncHandler } from '../lib/https';
import { AudienceMembersController } from '../controllers/audience.members.controller';
import { requireAudienceAccess } from '../middleware/audience-access';

const r = Router();

//get available members for audience
r.get(
  '/:orgId/audiences/:audienceId/available-members',
  requireAuth,
  requirePermission('people.view'),
  requireAudienceAccess(),
  asyncHandler(AudienceMembersController.availableMembers)
);
// get audience members
r.get(
  '/:orgId/audiences/:audienceId/members',
  requireAuth,
  requirePermission('people.view'),
  requireAudienceAccess(),
  asyncHandler(AudienceMembersController.list)
);
//add member in audience
r.post(
  '/:orgId/audiences/:audienceId/members',
  requireAuth,
  requirePermission('people.manage'),
  requireAudienceAccess(),
  asyncHandler(AudienceMembersController.add)
);
// remove member from audience
r.delete(
  '/:orgId/audiences/:audienceId/members/:userId',
  requireAuth,
  requirePermission('people.manage'),
  requireAudienceAccess(),
  asyncHandler(AudienceMembersController.remove)
);
// move student from one audience
r.post(
  '/:orgId/audiences/move-student',
  requireAuth,
  requirePermission('people.manage'),
  requireAudienceAccess(),
  asyncHandler(AudienceMembersController.moveStudent)
);
// get audiences of a member
r.get(
  '/:orgId/users/:userId/audiences',
  requireAuth,
  requirePermission('people.view'),
  asyncHandler(AudienceMembersController.userAudience)
);
// add member in audience

export default r;
