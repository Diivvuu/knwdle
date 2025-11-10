import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requirePermission } from '../../../middleware/permissions';
import { asyncHandler } from '../../../lib/https';
import { OrgUnitAttendanceController } from '../../../controllers/org-unit/org.unit.attendance.controller';

const r = Router({ mergeParams: true });

r.get(
  '/units/:unitId/attendance/sessions',
  requireAuth,
  requirePermission('attendance.read'),
  asyncHandler(OrgUnitAttendanceController.listSessions)
);
r.post(
  '/units/:unitId/attendance/sessions',
  requireAuth,
  requirePermission('attendance.manage'),
  asyncHandler(OrgUnitAttendanceController.createSession)
);
r.post(
  '/units/:unitId/attendance/sessions/:sessionId/records',
  requireAuth,
  requirePermission('attendance.manage'),
  asyncHandler(OrgUnitAttendanceController.markAttendance)
);
r.get(
  '/units/:unitId/attendance/sessions/:sessionId',
  requireAuth,
  requirePermission('attendance.read'),
  asyncHandler(OrgUnitAttendanceController.getSession)
);
r.get(
  '/units/:unitId/attendance/self',
  requireAuth,
  requirePermission('attendance.read'),
  asyncHandler(OrgUnitAttendanceController.selfAttendance)
);
r.get(
  '/attendance/summary',
  requireAuth,
  requirePermission('attendance.read'),
  asyncHandler(OrgUnitAttendanceController.getSummary)
);

export default r;
