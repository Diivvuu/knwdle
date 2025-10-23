import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { AdminDashboardController } from '../../controllers/org.admin-dashboard.controller';

const r = Router();

r.get(
  '/:id',
  requireAuth,
  requirePermission('org.read'),
  AdminDashboardController.hero
);
(r.get(
  '/:id/summary',
  requireAuth,
  requirePermission('org.read'),
  AdminDashboardController.summary
),
  r.get(
    '/:id/activity',
    requireAuth,
    requirePermission('org.read'),
    AdminDashboardController.activity
  ),
  r.get(
    '/:id/dashboard-config',
    requireAuth,
    requirePermission('org.read'),
    AdminDashboardController.dashboardConfig
  ));

export default r;
