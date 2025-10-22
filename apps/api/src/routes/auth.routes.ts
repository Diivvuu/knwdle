// src/routes/auth.routes.ts
import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/https';
import { AuthController } from '../controllers/auth.controller';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

const r = Router();

// same paths as before:
r.post('/signup', asyncHandler(AuthController.signup));
r.get('/verify', asyncHandler(AuthController.verify));
r.post('/login', asyncHandler(AuthController.login));
r.post('/request-otp', asyncHandler(AuthController.requestOtp));
r.post('/verify-otp', asyncHandler(AuthController.verifyOtp));
r.post('/refresh', asyncHandler(AuthController.refresh));
r.post('/logout', asyncHandler(AuthController.logout));

r.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // keep your original /me logic as is to start
    const userId = req.user!.id;
    // lazy import to avoid repo for now:
    const { prisma } = await import('../lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        memberships: {
          select: {
            org: { select: { id: true, name: true, type: true } },
            role: true,
          },
        },
      },
    });
    res.json(user);
  })
);

export default r;
