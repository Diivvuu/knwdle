import { Request, Response } from 'express';
import {
  AddAudienceMemberBody,
  ListAudienceMembersQuery,
  MoveStudentBody,
  MoveStudentSchema,
} from '../domain/audience.members.schema';
import { AudienceMemberService } from '../services/audience.members.service';

export const AudienceMembersController = {
  async availableMembers(req: Request, res: Response) {
    const result = await AudienceMemberService.listAvailableMembers(
      req.params.orgId,
      req.params.audienceId,
      req.query
    );
    res.json(result);
  },
  async list(req: Request, res: Response) {
    const query = ListAudienceMembersQuery.parse(req.query);
    const result = await AudienceMemberService.list(
      req.params.orgId,
      req.params.audienceId,
      query
    );
    res.json(result);
  },

  async add(req: Request, res: Response) {
    const body = AddAudienceMemberBody.parse(req.body);
    const result = await AudienceMemberService.add(
      req.params.orgId,
      req.params.audienceId,
      body
    );
    res.status(201).json(result);
  },

  async remove(req: Request, res: Response) {
    await AudienceMemberService.remove(
      req.params.orgId,
      req.params.audienceId,
      req.params.userId
    );
    res.status(204).send();
  },

  async moveStudent(req: Request, res: Response) {
    const body = MoveStudentSchema.parse(req.body);
    const result = await AudienceMemberService.moveStudent(
      req.params.orgId,
      body
    );
    res.json(result);
  },

  async userAudience(req: Request, res: Response) {
    const result = await AudienceMemberService.listUserAudiences(
      req.params.orgId,
      req.params.userId
    );
    res.json(result);
  },
};
