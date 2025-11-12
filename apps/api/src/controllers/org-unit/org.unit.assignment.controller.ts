import { Request, Response } from 'express';
import { OrgUnitAssignmentService } from '../../services/org-unit/org.unit.assignments.service';

export const OrgUnitAssignmentsController = {
  async listAssignment(req: Request, res: Response) {
    const { orgId, unitId } = req.params;
    const data = await OrgUnitAssignmentService.listAssignments(
      orgId,
      unitId,
      req.query
    );
    res.json(data);
  },

  async createAssignment(req: Request, res: Response) {
    const { orgId, unitId } = req.params;
    const userId = req.user!.id;
    const data = await OrgUnitAssignmentService.create(
      orgId,
      unitId,
      userId,
      req.body
    );

    res.status(201).json(data);
  },

  async getAssignment(req: Request, res: Response) {
    const { orgId, unitId, assignmentId } = req.params;
    const data = await OrgUnitAssignmentService.get(
      orgId,
      unitId,
      assignmentId
    );
    res.json(data);
  },

  async updateAssignment(req: Request, res: Response) {
    const { orgId, unitId, assignmentId } = req.params;
    const data = await OrgUnitAssignmentService.update(
      orgId,
      unitId,
      assignmentId,
      req.body
    );
    res.json(data);
  },

  async deleteAssignment(req: Request, res: Response) {
    const { orgId, unitId, assignmentId } = req.params;
    const result = await OrgUnitAssignmentService.remove(
      orgId,
      unitId,
      assignmentId
    );
    res.json(result);
  },

  async submitAssignment(req: Request, res: Response) {
    const { orgId, unitId, assignmentId } = req.params;
    const studentId = req.user!.id;
    const data = await OrgUnitAssignmentService.submit(
      orgId,
      unitId,
      assignmentId,
      studentId,
      req.body
    );
    res.status(201).json(data);
  },

  async listSubmissions(req: Request, res: Response) {
    const { orgId, unitId, assignmentId } = req.params;
    const data = await OrgUnitAssignmentService.listSubmissions(
      orgId,
      unitId,
      assignmentId,
      req.query
    );
    res.json(data);
  },

  async gradeSubmissions(req: Request, res: Response) {
    const { orgId, unitId, assignmentId } = req.params;
    const data = await OrgUnitAssignmentService.grade(
      orgId,
      unitId,
      assignmentId,
      req.body
    );
    res.json(data);
  },
};
