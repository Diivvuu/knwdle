import { Request, Response } from 'express';
import { asyncHandler, badRequest, HttpError } from '../lib/https';
import {
  UploadsPresignBody,
  UploadsPresignGetBody,
} from '../domain/uploads.schema';
import { UploadsService } from '../services/uploads.service';

export const UploadsController = {
  presignPost: asyncHandler(async (req: Request, res: Response) => {
    const p = UploadsPresignBody.safeParse(req.body);
    if (!p.success) {
      const e = badRequest('Invalid input');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const result = await UploadsService.presignUpload(req.user!.id, p.data);
    res.json(result);
  }),

  presignGet: asyncHandler(async (req: Request, res: Response) => {
    const p = UploadsPresignGetBody.safeParse(req.body);
    if (!p.success) {
      const e = badRequest('Invalid input');
      (e as HttpError & { details?: any }).details = p.error.flatten();
      throw e;
    }

    const payload = await UploadsService.presignGet(req.user!.id, p.data.key);
    res.json(payload);
  }),
};
