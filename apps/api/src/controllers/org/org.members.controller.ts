import { Request, Response } from 'express';
import {
  CreateMemberBody,
  ListMembersQuery,
  UpdateMemberBody,
} from '../../domain/org.members.schema';
import { OrgMemberService } from '../../services/org/org.members.service';

export const OrgMembersController = {
  async list(req: Request, res: Response) {
    const query = ListMembersQuery.parse(req.query);
    const result = await OrgMemberService.listMembers(req.params.orgId, query);
    return res.json(result);
  },

  async create(req: Request, res: Response) {
    const body = CreateMemberBody.parse(req.body);
    const result = await OrgMemberService.addMember(req.params.orgId, body);
    return res.status(201).json(result);
  },

  async update(req: Request, res: Response) {
    const body = UpdateMemberBody.parse(req.body);
    const result = await OrgMemberService.updateMember(
      req.params.orgId,
      req.params.memberId,
      body
    );
    return res.json(result);
  },

  async remove(req: Request, res: Response) {
    await OrgMemberService.removeMember(req.params.orgId, req.params.memberId);
    return res.status(204).send();
  },

  async get(req: Request, res: Response) {
    const result = await OrgMemberService.getMember(
      req.params.orgId,
      req.params.memberId
    );
    return res.json(result);
  },
};
