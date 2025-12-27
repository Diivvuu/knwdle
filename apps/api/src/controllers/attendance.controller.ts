import { Request, Response } from 'express';
import {
  GetAttendanceSessionQuery,
  ListAttendanceSessionsQuery,
  StudentAttendanceHistoryQuery,
  TakeAttendanceSchema,
  UpdateAttendanceNotesSchema,
  UpdateAttendanceRecordSchema,
} from '../domain/attendance.schema';
import { AttendanceService } from '../services/attendance.services';

export const AttendanceController = {
  async take(req: Request, res: Response) {
    const body = TakeAttendanceSchema.parse(req.body);

    const actorUserId = (req as any).user?.id;
    if (!actorUserId) throw new Error('Auth user missing in request');

    const result = await AttendanceService.takeAttendance({
      orgId: req.params.orgId,
      audienceId: req.params.audienceId,
      actorUserId,
      body,
    });

    return res.status(200).json(result);
  },

  async listSessions(req: Request, res: Response) {
    const query = ListAttendanceSessionsQuery.parse(req.query);

    const result = await AttendanceService.listSessions(
      req.params.orgId,
      req.params.audienceId,
      query
    );

    res.json(result);
  },

  async getSession(req: Request, res: Response) {
    const query = GetAttendanceSessionQuery.parse(req.query);

    const result = await AttendanceService.getSession(
      req.params.orgId,
      req.params.audienceId,
      req.params.sessionId,
      query.includeRecords
    );

    res.json(result);
  },

  async updateNotes(req: Request, res: Response) {
    const body = UpdateAttendanceNotesSchema.parse(req.body);

    const result = await AttendanceService.updateNotes(
      req.params.orgId,
      req.params.audienceId,
      req.params.sessionId,
      body.notes
    );

    return res.json(result);
  },
  async updateRecord(req: Request, res: Response) {
    const body = UpdateAttendanceRecordSchema.parse(req.body);

    const result = await AttendanceService.updateRecord(
      req.params.orgId,
      req.params.audienceId,
      req.params.sessionId,
      req.params.studentId,
      body.status
    );

    return res.json(result);
  },

  async studentHistory(req: Request, res: Response) {
    const query = StudentAttendanceHistoryQuery.parse(req.query);

    const result = await AttendanceService.studentHistory(
      req.params.orgId,
      req.params.studentId,
      query
    );

    return res.json(result);
  },
};
