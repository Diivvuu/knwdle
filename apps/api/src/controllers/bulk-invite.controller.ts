// src/controllers/bulk-invites.controller.ts
import { Request, Response } from 'express';
import { BulkInviteBody } from '../domain/bulk-invite.schema';
import { badRequest } from '../lib/https';
import { sseAttach } from '../lib/sse';
import { BulkInvitesService } from '../services/bulk-invite.service';

export const BulkInvitesController = {
  async kickoff(req: Request, res: Response) {
    const orgId = req.params.id;
    const p = BulkInviteBody.safeParse(req.body);
    if (!p.success) throw badRequest('Invalid input');

    const { invites, options } = p.data;
    const result = await BulkInvitesService.kickoff(orgId, invites, options);
    res.json(result);
  },

  // server-sent-events
  async stream(req: Request, res: Response) {
    return sseAttach(req, res, req.params.batchId);
  },

  async status(req: Request, res: Response) {
    const payload = await BulkInvitesService.batchStatus(req.params.batchId);
    res.json(payload);
  },
};
