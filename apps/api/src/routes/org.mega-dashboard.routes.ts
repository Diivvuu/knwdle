import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { asyncHandler } from '../lib/https';
import { OrgMegaDashboardController } from '../controllers/org.mega-dashboard.controller';

const r = Router();

// POST /dashboard/orgs
r.post('/orgs', requireAuth, asyncHandler(OrgMegaDashboardController.create));

// GET /dashboard/orgs
r.get('/orgs', requireAuth, asyncHandler(OrgMegaDashboardController.listMine));

// GET /dashboard/orgs/:id
r.get(
  '/orgs/:id',
  requireAuth,
  asyncHandler(OrgMegaDashboardController.getOne)
);

// PATCH /dashboard/orgs/:id
r.patch(
  '/orgs/:id',
  requireAuth,
  requirePermission('org.update'),
  asyncHandler(OrgMegaDashboardController.update)
);

// DELETE /dashboard/orgs/:id
r.delete(
  '/orgs/:id',
  requireAuth,
  requirePermission('org.update'),
  asyncHandler(OrgMegaDashboardController.remove)
);

export default r;
