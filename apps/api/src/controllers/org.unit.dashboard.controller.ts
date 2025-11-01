import { Request, Response } from 'express';
import {
  UnitDashParams,
  UnitDashQuery,
} from '../domain/org.unit.dashboard.schema';
import { OrgUnitDashboardService } from '../services/org.unit.dashboard.service';

export const OrgUnitDashboardController = {
  async dashboardConfig(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    const userId = req.user!.id;
    const data = await OrgUnitDashboardService.dashboardConfig(
      orgId,
      unitId,
      userId
    );
    res.json(data);
  },
  async hero(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    const data = await OrgUnitDashboardService.hero(orgId, unitId);
    res.json(data);
  },
  async summary(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    const { range } = UnitDashQuery.parse(req.query);
    const data = await OrgUnitDashboardService.summary(
      orgId,
      unitId,
      range ?? '30d'
    );
    res.json(data);
  },

  async timetableToday(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    res.json(await OrgUnitDashboardService.timetableToday(orgId, unitId));
  },
  async announcementsPeek(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    res.json(await OrgUnitDashboardService.announcementsPeek(orgId, unitId));
  },

  async assignmentsDue(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    res.json(await OrgUnitDashboardService.assignmentsDue(orgId, unitId));
  },

  async testsDue(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    res.json(await OrgUnitDashboardService.testsDue(orgId, unitId));
  },

  async attendanceSummary(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    res.json(await OrgUnitDashboardService.attendanceSummary(orgId, unitId));
  },

  async resultsSummary(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    res.json(await OrgUnitDashboardService.resultsSummary(orgId, unitId));
  },

  async feesSnapshot(req: Request, res: Response) {
    const { orgId, unitId } = UnitDashParams.parse(req.params);
    res.json(await OrgUnitDashboardService.feesSnapshot(orgId, unitId));
  },
};
