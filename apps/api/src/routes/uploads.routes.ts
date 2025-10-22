// Private bucket uploads. View/download must go through backend which issues short-lived GET presigns.
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/https';
import { UploadsController } from '../controllers/uploads.controller';

const r = Router();

// POST /api/uploads/presign  -> presigned POST for upload
r.post(
  '/uploads/presign',
  requireAuth,
  asyncHandler(UploadsController.presignPost)
);

// POST /api/uploads/presign-get -> short-lived GET to read an object
r.post(
  '/uploads/presign-get',
  requireAuth,
  asyncHandler(UploadsController.presignGet)
);

export default r;
