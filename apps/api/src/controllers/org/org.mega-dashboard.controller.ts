import { Request, Response } from 'express';
import {
  CreateOrgBody,
  UpdateOrgBody,
  IdParam,
} from '../../domain/org.mega-dashboard.schema';
import { badRequest, HttpError } from '../../lib/https';
import { OrgDashboardService } from '../../services/org/org.mega-dashboard.service';

export const OrgMegaDashboardController = {
  async create(req: Request, res: Response) {
    const p = CreateOrgBody.safeParse(req.body);
    if (!p.success) {
      const e = badRequest('Invalid input');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const org = await OrgDashboardService.createOrg(req.user!.id, p.data);
    res.status(201).json(org);
  },

  async listMine(req: Request, res: Response) {
    const rows = await OrgDashboardService.listMyOrgs(req.user!.id);
    res.json(rows);
  },

  async getOne(req: Request, res: Response) {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');

    const payload = await OrgDashboardService.getOrg(req.user!.id, p.data.id);
    res.json(payload);
  },

  async update(req: Request, res: Response) {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');

    const b = UpdateOrgBody.safeParse(req.body);
    if (!b.success) {
      const e = badRequest('Invalid input');
      (e as HttpError & { details?: any }).details = b.error.flatten();
      throw e;
    }

    const updated = await OrgDashboardService.updateOrg(
      req.user!.id,
      p.data.id,
      b.data
    );
    res.json(updated);
  },

  async remove(req: Request, res: Response) {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');
    await OrgDashboardService.deleteOrg(req.user!.id, p.data.id);
    res.sendStatus(204);
  },
};
