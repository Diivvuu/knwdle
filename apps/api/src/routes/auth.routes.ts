// src/routes/auth.routes.ts
import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/https';
import { AuthController } from '../controllers/auth.controller';

const r = Router();

// same paths as before:
r.post('/signup', asyncHandler(AuthController.signup));
r.get('/verify', asyncHandler(AuthController.verify));
r.post('/login', asyncHandler(AuthController.login));
r.post('/request-otp', asyncHandler(AuthController.requestOtp));
r.post('/verify-otp', asyncHandler(AuthController.verifyOtp));
r.post('/refresh', asyncHandler(AuthController.refresh));
r.post('/logout', asyncHandler(AuthController.logout));

r.get('/me', requireAuth, asyncHandler(AuthController.me));
r.get('/invites/:token/preview', requireAuth, asyncHandler(AuthController.invitePreview))

export default r;
