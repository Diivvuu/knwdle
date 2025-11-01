import { Router } from 'express';

import { requireAuth } from '../../middleware/auth';
import { OrgConnectDashboardController } from '../../controllers/org.connect-dashboard.controller';
import { asyncHandler } from '../../lib/https';

const r = Router();
r.use(requireAuth);

r.get(
  '/:id/connect-dashboard/hero',
  asyncHandler(OrgConnectDashboardController.hero)
);
r.get(
  '/:id/connect-dashboard/summary',
  asyncHandler(OrgConnectDashboardController.summary)
);
r.get(
  '/:id/connect-dashboard/timetable-today',
  asyncHandler(OrgConnectDashboardController.timetableToday)
);
r.get(
  '/:id/connect-dashboard/announcements-peek',
  asyncHandler(OrgConnectDashboardController.announcementsPeek)
);
r.get(
  '/:id/connect-dashboard/config',
  asyncHandler(OrgConnectDashboardController.config)
);

export default r;
