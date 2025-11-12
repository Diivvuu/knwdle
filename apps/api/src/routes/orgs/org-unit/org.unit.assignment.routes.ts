import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requirePermission } from '../../../middleware/permissions';
import { asyncHandler } from '../../../lib/https';
import { OrgUnitAssignmentsController } from '../../../controllers/org-unit/org.unit.assignment.controller';

const r = Router({ mergeParams: true });

r.get(
  '/units/:unitId/assignments',
  requireAuth,
  requirePermission('assignments.read'),
  asyncHandler(OrgUnitAssignmentsController.listAssignment)
);
r.post(
  '/units/:unitId/assignments',
  requireAuth,
  requirePermission('assignments.manage'),
  asyncHandler(OrgUnitAssignmentsController.createAssignment)
);

r.get(
  '/units/:unitId/assignments/:id',
  requireAuth,
  requirePermission('assignments.read'),
  asyncHandler(OrgUnitAssignmentsController.getAssignment)
);

r.patch(
  '/units/:unitId/assignments/:id',
  requireAuth,
  requirePermission('assignments.manage'),
  asyncHandler(OrgUnitAssignmentsController.updateAssignment)
);

r.delete(
  '/units/:unitId/assignments/:id',
  requireAuth,
  requirePermission('assignments.manage'),
  asyncHandler(OrgUnitAssignmentsController.deleteAssignment)
);

r.post(
  '/units/:unitId/assignments/:id/submissions',
  requireAuth,
  requirePermission('assignments.submit'),
  asyncHandler(OrgUnitAssignmentsController.submitAssignment)
);

r.get(
  '/units/:unitId/assignments/:id/submissions',
  requireAuth,
  requirePermission('assignments.read'),
  asyncHandler(OrgUnitAssignmentsController.listSubmissions)
);

r.patch(
  '/units/:unitId/assignments/:id/grade',
  requireAuth,
  requirePermission('assignments.manage'),
  asyncHandler(OrgUnitAssignmentsController.gradeSubmissions)
);

export default r;
