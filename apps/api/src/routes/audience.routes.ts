import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { asyncHandler } from '../lib/https';
import { AudienceController } from '../controllers/audience.controller';

const r = Router();

//create audience
r.post(
  '/orgs/:orgId/audiences',
  requireAuth,
  requirePermission('org.audience.manage'),
  asyncHandler(AudienceController.create)
);

//list audiences
r.get(
  '/orgs/:orgId/audiences',
  requireAuth,
  requirePermission('org.audience.manage'),
  asyncHandler(AudienceController.list)
);

//get audience by id
r.get(
  '/orgs/:orgId/audiences/:audienceId',
  requireAuth,
  requirePermission('org.audience.manage'),
  asyncHandler(AudienceController.get)
);

//update audience
r.put(
  '/orgs/:orgId/audiences/:audienceId',
  requireAuth,
  requirePermission('org.audience.manage'),
  asyncHandler(AudienceController.update)
);

//delete audience
r.delete(
  '/orgs/:orgId/audiences/:audienceId',
  requireAuth,
  requirePermission('org.audience.manage'),
  asyncHandler(AudienceController.remove)
);

export default r;
