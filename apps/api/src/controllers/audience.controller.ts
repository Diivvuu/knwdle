import { Request, Response } from 'express';
import {
  CreateAudienceSchema,
  ListAudienceQuerySchema,
  UpdateAudienceSchema,
} from '../domain/audience.schema';
import { badRequest } from '../lib/https';
import { AudienceService } from '../services/audience.service';

export const AudienceController = {
  async create(req: Request, res: Response) {
    const p = CreateAudienceSchema.safeParse(req.body);
    if (!p.success) throw badRequest('Invalid input');

    const audience = await AudienceService.create(req.params.orgId, p.data);
    res.status(201).json(audience);
  },

  async list(req: Request, res: Response) {
    const q = ListAudienceQuerySchema.safeParse(req.query);
    if (!q.success) throw badRequest('Invalid query');

    const data = await AudienceService.list(req.params.orgId, q.data);
    res.json(data);
  },

  async get(req: Request, res: Response) {
    const data = await AudienceService.get(
      req.params.orgId,
      req.params.audienceId
    );
    res.json(data);
  },

  async update(req: Request, res: Response) {
    const p = UpdateAudienceSchema.safeParse(req.body);
    if (!p.success) throw badRequest('Invalid input');

    const data = await AudienceService.update(
      req.params.orgId,
      req.params.audienceId,
      p.data
    );

    res.json(data);
  },

  async remove(req: Request, res: Response) {
    await AudienceService.remove(req.params.orgId, req.params.audienceId);
    res.sendStatus(204);
  },
};
