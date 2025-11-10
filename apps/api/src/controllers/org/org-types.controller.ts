import { Request, Response } from 'express';
import { OrgTypesService } from '../../services/org/org-types.service';
import {
  OrgTypeParam,
  OrgTypesListResponse,
  UISchemaResponse,
} from '../../domain/org-types.schema';
import { badRequest, HttpError } from '../../lib/https';

export const OrgTypesController = {
  async list(_req: Request, res: Response) {
    const payload = OrgTypesService.listTypes();
    // runtime assert (dev-only optional)
    if (process.env.NODE_ENV !== 'production')
      OrgTypesListResponse.parse(payload);
    res.json(payload);
  },

  async uiSchema(req: Request, res: Response) {
    const p = OrgTypeParam.safeParse(req.params);
    if (!p.success) {
      const e = badRequest('Bad org type');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const payload = OrgTypesService.getUiSchema(p.data.type);
    if (process.env.NODE_ENV !== 'production') UISchemaResponse.parse(payload);
    res.json(payload);
  },

  async unitStructure(req: Request, res: Response) {
    const p = OrgTypeParam.safeParse(req.params);
    if (!p.success) {
      const e = badRequest('Bad org id');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const payload = OrgTypesService.getUnitStructure(p.data.type);
    res.json(payload);
  },
};
