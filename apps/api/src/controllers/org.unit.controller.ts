import { Request, Response } from 'express';
import { OrgIdParam } from '../domain/org.unit-types.schema';
import { badRequest } from '../lib/https';
import { OrgUnitsService } from '../services/org.unit.service';
import {
  CreateOrgUnitBody,
  UnitIdParam,
  UpdateOrgUnitBody,
} from '../domain/org.unit.schema';

export const OrgUnitController = {
  async list(req: Request, res: Response) {
    const p = OrgIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Invalid org id');
    res.json(await OrgUnitsService.list(p.data.orgId));
  },
  async tree(req: Request, res: Response) {
    const p = OrgIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Invalid org id');
    res.json(await OrgUnitsService.tree(p.data.orgId));
  },
  async get(req: Request, res: Response) {
    const p = UnitIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Invalid org id');
    res.json(await OrgUnitsService.get(p.data.orgId, p.data.unitId));
  },
  async create(req: Request, res: Response) {
    const p = OrgIdParam.safeParse(req.params);
    const b = CreateOrgUnitBody.safeParse(req.body);
    if (!p.success || !b.success) throw badRequest('Invalid input');
    res.status(201).json(await OrgUnitsService.create(p.data.orgId, b.data));
  },

  async udpate(req: Request, res: Response) {
    const p = UnitIdParam.safeParse(req.params);
    const b = UpdateOrgUnitBody.safeParse(req.body);
    if (!p.success || !b.success) throw badRequest('Invalid input');
    res.json(await OrgUnitsService.update(p.data.orgId, p.data.unitId, b.data));
  },

  async remove(req: Request, res: Response) {
    const p = UnitIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Invalid params');
    await OrgUnitsService.remove(p.data.orgId, p.data.unitId);
    res.status(204).end();
  },
};
