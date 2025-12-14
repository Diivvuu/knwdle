import { Router } from 'express';
import { asyncHandler } from '../lib/https';
import { requireAuth } from '../middleware/auth';
import { OrgTypesController } from '../controllers/org/org-types.controller';

const r = Router();

r.get('/org-types', asyncHandler(OrgTypesController.list));

r.get(
  '/org-types/:type/schema',
  requireAuth,
  asyncHandler(OrgTypesController.uiSchema)
);

export default r;
