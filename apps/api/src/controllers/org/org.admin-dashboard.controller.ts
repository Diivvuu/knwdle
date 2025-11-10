import { Request, Response } from 'express';
import { asyncHandler, badRequest } from '../../lib/https';
import { IdParam } from '../../domain/org.mega-dashboard.schema';
import { OrgAdminDashboardService } from '../../services/org/org.admin-dashboard.service';
import { ActivityQuery } from '../../domain/org.admin-dashboard.schema';
import { encodeCursor } from '../../lib/pagination';

export const AdminDashboardController = {
  hero: asyncHandler(async (req: Request, res: Response) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');
    const payload = await OrgAdminDashboardService.hero(p.data.id);
    res.set('Cache-Control', 'private, max-age=30');
    res.json(payload);
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');
    const payload = await OrgAdminDashboardService.summary(p.data.id);
    res.set('Cache-Control', 'private, max-age=30');
    res.json(payload);
  }),

  activity: asyncHandler(async (req: Request, res: Response) => {
    const idOk = IdParam.safeParse(req.params);
    if (!idOk.success) throw badRequest('Bad org id');

    const q = ActivityQuery.safeParse(req.query);
    if (!q.success) throw badRequest('Invalid query');

    const rows = await OrgAdminDashboardService.activity(idOk.data.id, q.data);

    const items = rows?.slice(0, q.data.limit).map((l) => ({
      id: l.id,
      type: l.action,
      at: l.createdAt,
      entity: l.entity,
      entityId: l.entityId,
      meta: l.meta,
      actorId: l.actorId ?? null,
    }));

    const nextCursor =
      rows?.length > q.data.limit
        ? encodeCursor(rows[q.data.limit].createdAt, rows[q.data.limit].id)
        : null;

    res.json({ items, nextCursor });
  }),

  dashboardConfig: asyncHandler(async (req: Request, res: Response) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');

    const payload = await OrgAdminDashboardService.dashboardConfig(
      p.data.id,
      req.user!.id
    );
    res.set('Cache-Control', 'private, max-age=120');
    res.json(payload);
  }),

  unitsGlance: asyncHandler(async (req: Request, res: Response) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');
    const data = await OrgAdminDashboardService.unitsGlance(p.data.id);
    res.set('Cache-Control', 'private, max-age=60');
    res.json(data);
  }),

  membersPeek: asyncHandler(async (req: Request, res: Response) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');
    const data = await OrgAdminDashboardService.membersPeek(p.data.id);
    res.set('Cache-Control', 'private, max-age=60');
    res.json(data);
  }),

  announcementsPeek: asyncHandler(async (req: Request, res: Response) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');
    const data = await OrgAdminDashboardService.announcementsPeek(p.data.id);
    res.set('Cache-Control', 'private, max-age=60');
    res.json(data);
  }),

  attendanceSnapshot: asyncHandler(async (req: Request, res: Response) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');
    const data = await OrgAdminDashboardService.attendanceSnapshot(p.data.id);
    res.set('Cache-Control', 'private, max-age=60');
    res.json(data);
  }),

  feesSnapshot: asyncHandler(async (req: Request, res: Response) => {
    const p = IdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Bad org id');
    const data = await OrgAdminDashboardService.feesSnapshot(p.data.id);
    res.set('Cache-Control', 'private, max-age=60');
    res.json(data);
  }),
};
