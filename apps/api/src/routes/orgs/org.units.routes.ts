import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { asyncHandler } from '../../lib/https';
import { OrgUnitsController } from '../../controllers/org.unit.controller';

const r = Router();

r.post(
  '/orgs/:id/units',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitsController.create)
);

r.get(
  '/orgs/:id/units',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitsController.list)
);

r.get(
  '/orgs/:id/units/:unitId',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitsController.get)
);

r.patch(
  '/orgs/:id/units/:unitId',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitsController.update)
);

r.delete(
  '/orgs/:id/units/:unitId',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitsController.remove)
);

r.get(
  '/orgs/:id/units/:unitId',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitsController.search)
);

export default r;
