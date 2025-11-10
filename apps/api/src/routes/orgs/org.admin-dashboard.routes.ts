  import { Router } from 'express';
  import { requireAuth } from '../../middleware/auth';
  import {
    requireOrgFeature,
    requirePermission,
  } from '../../middleware/permissions';
  import { AdminDashboardController } from '../../controllers/org/org.admin-dashboard.controller';

  const r = Router();

  r.get(
    '/:id',
    requireAuth,
    requirePermission('org.read'),
    AdminDashboardController.hero
  );
  r.get(
    '/:id/summary',
    requireAuth,
    requirePermission('org.read'),
    AdminDashboardController.summary
  );
  r.get(
    '/:id/activity',
    requireAuth,
    requirePermission('org.read'),
    AdminDashboardController.activity
  );
  r.get(
    '/:id/dashboard-config',
    requireAuth,
    requirePermission('org.read'),
    AdminDashboardController.dashboardConfig
  );
  r.get(
    '/:id/units/glance',
    requireAuth,
    requirePermission('org.read'),
    AdminDashboardController.unitsGlance
  );
  r.get(
    '/:id/members/peek',
    requireAuth,
    requirePermission('people.read'),
    AdminDashboardController.membersPeek
  );
  r.get(
    '/:id/announcements/peek',
    requireAuth,
    requirePermission('announce.read'),
    requireOrgFeature('announcements'),
    AdminDashboardController.announcementsPeek
  );
  r.get(
    '/:id/attendance/snapshot',
    requireAuth,
    requirePermission('attendance.read'),
    requireOrgFeature('attendance'),
    AdminDashboardController.attendanceSnapshot
  );
  r.get(
    '/:id/fees/snapshot',
    requireAuth,
    requirePermission('finance.read'),
    requireOrgFeature('fees'),
    AdminDashboardController.feesSnapshot
  );

  export default r;
