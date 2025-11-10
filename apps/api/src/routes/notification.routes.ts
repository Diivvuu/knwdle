import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/https';
import { NotificationService } from '../lib/notification.service';

const r = Router();

r.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const data = await NotificationService.list(req.user!.id);
    res.json(data);
  })
);

r.post(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.markRead(req.params.id, req.user!.id);
    res.json({ ok: true });
  })
);

export default r;
