import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { asyncHandler } from '../../lib/https';
import { OrgUnitTypesController } from '../../controllers/org.unit-types.controller';

const r = Router();

r.get(
  '/:orgId/org-unit-types',
  requireAuth,
  asyncHandler(OrgUnitTypesController.list)
);
r.get(
  '/:orgId/org-unit-types/:type/schema',
  requireAuth,
  asyncHandler(OrgUnitTypesController.schema)
);
r.get(
  '/:orgId/org-unit-types/:type/features',
  requireAuth,
  asyncHandler(OrgUnitTypesController.features)
);
r.get(
  '/:orgId/org-unit-types/allowed',
  requireAuth,
  asyncHandler(OrgUnitTypesController.allowed)
);

export default r;
