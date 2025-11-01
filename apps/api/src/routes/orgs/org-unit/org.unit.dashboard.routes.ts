import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requirePermission } from '../../../middleware/permissions';
import { OrgUnitDashboardController } from '../../../controllers/org.unit.dashboard.controller';
import { asyncHandler } from '../../../lib/https';

const r = Router({ mergeParams: true });

r.get(
  '/units/:unitId/dashboard/config',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.dashboardConfig)
);

r.get(
  '/units/:unitId/dashboard/hero',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.hero)
);

r.get(
  '/units/:unitId/dashboard/summary',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.summary)
);

r.get(
  '/units/:unitId/dashboard/widgets/timetable-today',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.timetableToday)
);

r.get(
  '/units/:unitId/dashboard/widgets/announcements-peek',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.announcementsPeek)
);

r.get(
  '/units/:unitId/dashboard/widgets/assignments-due',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.assignmentsDue)
);

r.get(
  '/units/:unitId/dashboard/widgets/tests-due',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.testsDue)
);

r.get(
  '/units/:unitId/dashboard/widgets/attendance-summary',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.attendanceSummary)
);

r.get(
  '/units/:unitId/dashboard/widgets/results-summary',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.resultsSummary)
);

r.get(
  '/units/:unitId/dashboard/widgets/fees-snapshot',
  requireAuth,
  requirePermission('org.read'),
  asyncHandler(OrgUnitDashboardController.feesSnapshot)
);

export default r;
