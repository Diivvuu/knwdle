import { Request, Response } from 'express';
import { asyncHandler, badRequest } from '../lib/https';
import { OrgIdParam } from '../domain/bulk-invite.schema';
import {
  CreateUnitBody,
  ListUnitsQuery,
  SearchUnitsQuery,
  UnitIdParam,
  UpdateUnitBody,
} from '../domain/org.unit.schema';
import { OrgUnitService } from '../services/org.unit.service';
import { RequestCharged } from '@aws-sdk/client-s3';

export const OrgUnitsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const p = OrgIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');

    const b = CreateUnitBody.safeParse(req.body);
    if (!b.success) throw badRequest('Invalid input');

    const unit = await OrgUnitService.create(p.data.id, b.data);
    res.status(201).json({
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const p = OrgIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');

    const q = ListUnitsQuery.safeParse(req.query);
    if (!q.success) throw badRequest('Invalid query');

    const payload = await OrgUnitService.list(p.data.id, q.data);
    res.json({
      items: payload.items.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      nextCursosr: payload.nextCursor,
    });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const p = UnitIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad params');

    const u = await OrgUnitService.get(p.data.id, p.data.unitId);
    res.json({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const p = UnitIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad params');

    const b = UpdateUnitBody.safeParse(req.body);
    if (!b.success) throw badRequest('Invalid input');

    const u = await OrgUnitService.update(p.data.id, p.data.unitId, b.data);
    res.json({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const p = UnitIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad params');

    const force = String(req.query.force ?? 'false') == 'true';
    await OrgUnitService.remove(p.data.id, p.data.unitId, force);
    res.sendStatus(204);
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const p = OrgIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');

    const q = SearchUnitsQuery.safeParse(req.query);
    if (!q.success) throw badRequest('Invalid query');

    const payload = await OrgUnitService.search(p.data.id, q.data);
    res.json({
      items: payload.items.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      nextCursor: payload.nextCursor,
    });
  }),
};
