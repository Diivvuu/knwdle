import { Request, Response } from 'express';
import {
  RoleIdParam,
  RoleCreateBody,
  RoleUpdateBody,
  AssignRoleBody,
} from '../../domain/roles.schema';
import { RolesService } from '../../services/org/roles.service';
import { asyncHandler, badRequest, HttpError } from '../../lib/https';
import z from 'zod';

const OrgIdParam = z.object({
  id: z.string().cuid(),
});

export const RolesController = {
  listPermissions: asyncHandler(async (_req: Request, res: Response) => {
    const perms = await RolesService.listPermissions();
    res.json(perms);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    console.log(req.params)
    const p = OrgIdParam.safeParse(req.params);
    if (!p.success) {
      const e = badRequest('Invalid org id');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }
    const roles = await RolesService.listRoles( p.data.id );
    res.json(roles);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const pParams = OrgIdParam.safeParse(req.params);
    if (!pParams.success) throw badRequest('Invalid org id');

    const p = RoleCreateBody.safeParse(req.body);
    if (!p.success) {
      const e = badRequest('Invalid input');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const role = await RolesService.createRole(pParams.data.id, p.data);
    res.status(201).json(role);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const pParams = RoleIdParam.safeParse(req.params);
    if (!pParams.success) throw badRequest('Invalid params');

    const p = RoleUpdateBody.safeParse(req.body);
    if (!p.success) {
      const e = badRequest('Invalid input');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const updated = await RolesService.updateRole(
      pParams.data.id,
      pParams.data.roleId,
      p.data
    );
    res.json(updated);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const p = RoleIdParam.safeParse(req.params);
    if (!p.success) throw badRequest('Invalid params');

    await RolesService.deleteRole(p.data.id, p.data.roleId);
    res.sendStatus(204);
  }),

  assignMemberRole: asyncHandler(async (req: Request, res: Response) => {
    const pParams = OrgIdParam.safeParse(req.params);
    if (!pParams.success) throw badRequest('Invalid org id');

    const p = AssignRoleBody.safeParse(req.body);
    if (!p.success) {
      const e = badRequest('Invalid input');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const updated = await RolesService.assignOrUnassignCustomRole(
      pParams.data.id,
      p.data.userId,
      p.data.roleId
    );
    res.json(updated);
  }),
};
