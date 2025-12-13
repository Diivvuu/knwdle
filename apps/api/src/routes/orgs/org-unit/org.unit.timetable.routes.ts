import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requirePermission } from '../../../middleware/permissions';
import { asyncHandler } from '../../../lib/https';
import { OrgUnitTimetableController } from '../../../controllers/org-unit/org.unit.timetable.controller';

const r = Router({ mergeParams: true });

r.get(
  '/units/:unitId/timetable',
  requireAuth,
  requirePermission('timetable.read'),
  asyncHandler(OrgUnitTimetableController.list)
);
r.get(
  '/units/:unitId/timetable/today',
  requireAuth,
  requirePermission('timetable.read'),
  asyncHandler(OrgUnitTimetableController.today)
);
r.post(
  '/units/:unitId/timetable',
  requireAuth,
  requirePermission('timetable.manage'),
  asyncHandler(OrgUnitTimetableController.create)
);

r.put(
  '/units/:unitId/timetable/:id',
  requireAuth,
  requirePermission('timetable.manage'),
  asyncHandler(OrgUnitTimetableController.update)
);

r.delete(
  '/units/:unitId/timetable/:id',
  requireAuth,
  requirePermission('timetable.manage'),
  asyncHandler(OrgUnitTimetableController.remove)
);

export default r;
