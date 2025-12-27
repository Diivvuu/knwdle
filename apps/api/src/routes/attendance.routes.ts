import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAudienceAccess } from '../middleware/audience-access';
import { AttendanceController } from '../controllers/attendance.controller';
import { asyncHandler } from '../lib/https';
import { requirePermission } from '../middleware/permissions';

const r = Router();

//audience scoped attendance
r.get(
  '/:orgId/audiences/:audienceId/attendance/sessions',
  requireAuth,
  requireAudienceAccess(),
  asyncHandler(AttendanceController.listSessions)
);

r.get(
  '/:orgId/audiences/:audienceId/attendance/sessions/:sessionId',
  requireAuth,
  requirePermission('attendance.view'),
  requireAudienceAccess(),
  asyncHandler(AttendanceController.getSession)
);

//upsert attendance session + records (Take attendance)
r.post(
  '/:orgId/audiences/:audienceId/attendance/take',
  requireAuth,
  requirePermission('attendance.manage'),
  requireAudienceAccess(),
  asyncHandler(AttendanceController.take)
);

// update notes
r.put(
  '/:orgId/audiences/:audienceId/attendance/sessions/:sessionId/notes',
  requireAuth,
  requirePermission('attendance.manage'),
  requireAudienceAccess(),
  asyncHandler(AttendanceController.updateNotes)
);

//update a student's status in a session
r.put(
  '/:orgId/audiences/:audienceId/attendance/sessions/:sessionId/students/:studentId',
  requireAuth,
  requirePermission('attendance.manage'),
  requireAudienceAccess(),
  asyncHandler(AttendanceController.updateRecord)
);

//org-scoped student history (not tied to one audience route)
r.get(
  '/:orgId/students/:studentId/attendance/history',
  requireAuth,
  requirePermission('attendance.view'),
  asyncHandler(AttendanceController.studentHistory)
);

export default r;
