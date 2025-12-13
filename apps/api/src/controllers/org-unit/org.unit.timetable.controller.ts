import { Request, Response } from 'express';
import { OrgUnitTimetableService } from '../../services/org-unit/org.unit.timetable.service';

export const OrgUnitTimetableController = {
  async list(req: Request, res: Response) {
    const { orgId, unitId } = req.params;
    res.json(await OrgUnitTimetableService.list(orgId, unitId));
  },
  async today(req: Request, res: Response) {
    const { orgId, unitId } = req.params;
    res.json(await OrgUnitTimetableService.today(orgId, unitId));
  },
  async create(req: Request, res: Response) {
    const { orgId, unitId } = req.params;
    res.json(await OrgUnitTimetableService.create(orgId, unitId, req.body));
  },
  async update(req: Request, res: Response) {
    const { orgId, unitId, id } = req.params;
    res.json(await OrgUnitTimetableService.update(orgId, unitId, id, req.body));
  },
  async remove(req: Request, res: Response) {
    const { orgId, unitId, id } = req.params;
    res.json(await OrgUnitTimetableService.remove(orgId, unitId, id));
  },
};
