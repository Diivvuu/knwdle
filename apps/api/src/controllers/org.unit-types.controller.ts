import { Request, Response } from 'express';
import {
  AllowedChildrenResponse,
  AllowedQuery,
  OrgIdParam,
  orgUnitTypeParam,
  OrgUnitTypesListResponse,
  OrgUnitUISchemaResponse,
} from '../domain/org.unit-types.schema';
import { badRequest, HttpError } from '../lib/https';
import { OrgUnitTypesService } from '../services/org.unit-types.service';
import { OrgUnitType } from '../generated/prisma';

export const OrgUnitTypesController = {
  async list(req: Request, res: Response) {
    const p = OrgIdParam.safeParse(req.params);
    if (!p.success) {
      const e = badRequest('Invalid org Id');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const result = await OrgUnitTypesService.list(p.data.orgId);
    if (process.env.NODE_ENV !== 'production') {
      OrgUnitTypesListResponse.parse(result);
    }
    res.json(result);
  },

  async schema(req: Request, res: Response) {
    const p = orgUnitTypeParam.safeParse(req.params);
    if (!p.success) {
      const e = badRequest('Invalid parameters');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const result = await OrgUnitTypesService.getSchema(
      p.data.orgId,
      p.data.type
    );
    if (process.env.NODE_ENV !== 'production') {
      OrgUnitUISchemaResponse.parse(result);
    }
    res.json(result);
  },

  async features(req: Request, res: Response) {
    const p = orgUnitTypeParam.safeParse(req.params);
    if (!p.success) {
      const e = badRequest('Invalid parameters');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const result = await OrgUnitTypesService.getFeatures(
      p.data.orgId,
      p.data.type
    );
    res.json(result);
  },

  async allowed(req: Request, res: Response) {
    const p = OrgIdParam.safeParse(req.params);
    if (!p.success) {
      const e = badRequest('Invalid parameters / bad org id');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const q = AllowedQuery.safeParse(req.query);
    if (!q.success) {
      const e = badRequest('Invalid query');
      (e as HttpError & { details?: any }).details = q.error.flatten();
      throw e;
    }

    const parentType =
      q.data.parentType && q.data.parentType in OrgUnitType
        ? (OrgUnitType[
            q.data.parentType as keyof typeof OrgUnitType
          ] as OrgUnitType)
        : null;
    const result = await OrgUnitTypesService.allowed(p.data.orgId, parentType);
    if (process.env.NODE_ENV !== 'production')
      AllowedChildrenResponse.parse(result);
    res.json(result);
  },
};
