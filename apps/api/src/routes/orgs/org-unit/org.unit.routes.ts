import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requirePermission } from '../../../middleware/permissions';
import { asyncHandler } from '../../../lib/https';
import { OrgUnitController } from '../../../controllers/org-unit/org.unit.controller';

const r = Router({ mergeParams: true });

// list of org units
r.get(
  '/units',
  requireAuth,
  // requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitController.list)
);
//tree
r.get(
  '/tree',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitController.tree)
);

//single get
r.get(
  '/units/:unitId',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitController.get)
);

// create
r.post(
  '/units',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitController.create)
);

//update
r.patch(
  '/units/:unitId',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitController.udpate)
);

//delete
r.delete(
  '/units/:unitId',
  requireAuth,
  requirePermission('org.unit.manage'),
  asyncHandler(OrgUnitController.remove)
);
export default r;
