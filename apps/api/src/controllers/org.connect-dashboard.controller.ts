import { Request, Response } from 'express';
import { OrgConnectDashboardService } from '../services/org.connect-dashboard.service';

export const OrgConnectDashboardController = {
  async hero(req: Request, res: Response) {
    const data = await OrgConnectDashboardService.hero(
      req.params.id,
      req.user!.id
    );
    res.json(data);
  },
  async summary(req: Request, res: Response) {
    const data = await OrgConnectDashboardService.summary(
      req.params.id,
      req.user!.id
    );
    res.json(data);
  },
  async timetableToday(req: Request, res: Response) {
    const data = await OrgConnectDashboardService.timetableToday(
      req.params.id,
      req.user!.id
    );
    res.json(data);
  },
  async announcementsPeek(req: Request, res: Response) {
    const data = await OrgConnectDashboardService.announcementsPeek(
      req.params.id,
      req.user!.id
    );
    res.json(data);
  },
  async config(req: Request, res: Response) {
    const data = await OrgConnectDashboardService.config(
      req.params.id,
      req.user!.id
    );
    res.json(data);
  },
};
