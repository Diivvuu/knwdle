// src/routes/invites.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { asyncHandler } from '../lib/https';
import { InvitesController } from '../controllers/invite.controller';
import { BulkInvitesController } from '../controllers/bulk-invite.controller';

const r = Router();

// POST /api/orgs/:id/invites
r.post(
  '/orgs/:id/invites',
  requireAuth,
  requirePermission('people.invite'),
  asyncHandler(InvitesController.create)
);

// GET /api/orgs/:id/invites
r.get(
  '/orgs/:id/invites',
  requireAuth,
  requirePermission('people.manage'),
  asyncHandler(InvitesController.list)
);

// DELETE /api/orgs/:orgId/invites/:inviteId
r.delete(
  '/orgs/:orgId/invites/:inviteId',
  requireAuth,
  requirePermission('people.manage'),
  asyncHandler(InvitesController.remove)
);

// POST /api/invites/:token/accept
r.post(
  '/invites/:token/accept',
  requireAuth,
  asyncHandler(InvitesController.acceptByToken)
);

// POST /api/invites/join-code
r.post(
  '/invites/join-code',
  requireAuth,
  asyncHandler(InvitesController.acceptByJoinCode)
);

r.post(
  '/orgs/:id/invites/bulk',
  requireAuth,
  requirePermission('people.invite'),
  asyncHandler(BulkInvitesController.kickoff)
);
r.get(
  '/orgs/:id/invites/bulk/:batchId/stream',
  requireAuth,
  asyncHandler(BulkInvitesController.stream)
);
r.get(
  '/orgs/:id/invites/bulk/:batchId/status',
  requireAuth,
  asyncHandler(BulkInvitesController.status)
);

export default r;
