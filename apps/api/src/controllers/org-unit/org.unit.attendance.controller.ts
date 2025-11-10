import { Request, Response } from 'express';
import { OrgUnitAttendanceService } from '../../services/org-unit/org.unit.attendance.service';

export const OrgUnitAttendanceController = {
  async listSessions(req: Request, res: Response) {
    const { orgId, unitId } = req.params;
    const data = await OrgUnitAttendanceService.listSessions(orgId, unitId);
    res.json(data);
  },
  async createSession(req: Request, res: Response) {
    const { orgId, unitId } = req.params;
    const userId = req.user!.id;
    const session = await OrgUnitAttendanceService.createSesssion(
      orgId,
      unitId,
      userId,
      req.body
    );
    res.status(201).json(session);
  },

  async markAttendance(req: Request, res: Response) {
    const { orgId, unitId, sessionId } = req.params;
    const userId = req.user!.id;
    const { records } = req.body;
    const result = await OrgUnitAttendanceService.markAttendance(
      orgId,
      unitId,
      sessionId,
      userId,
      records
    );
    res.json(result);
  },

  async getSession(req: Request, res: Response) {
    const { orgId, unitId, sessionId } = req.params;
    const session = await OrgUnitAttendanceService.getSession(
      orgId,
      unitId,
      sessionId
    );
    res.json(session);
  },

  async selfAttendance(req: Request, res: Response) {
    const { orgId, unitId } = req.params;
    const userId = req.user!.id;
    const data = await OrgUnitAttendanceService.selfAttendance(
      orgId,
      unitId,
      userId
    );
    res.json(data);
  },
  async getSummary(req: Request, res: Response) {
    const data = await OrgUnitAttendanceService.getSummary(
      req.params.orgId,
      req.query
    );
    res.json(data);
  },
};
