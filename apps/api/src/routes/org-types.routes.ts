import { Router } from 'express';
import { asyncHandler } from '../lib/https';
import { requireAuth } from '../middleware/auth';
import { OrgTypesController } from '../controllers/org-types.controller';

const r = Router();

// GET /api/org-types (public)
r.get('/org-types', asyncHandler(OrgTypesController.list));

// GET /api/org-types/:type/schema (auth)
r.get(
  '/org-types/:type/schema',
  requireAuth,
  asyncHandler(OrgTypesController.uiSchema)
);

export default r;
