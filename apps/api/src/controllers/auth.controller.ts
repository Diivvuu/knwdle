// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import {
  SignupBody,
  LoginBody,
  RequestOtpBody,
  VerifyOtpBody,
} from '../domain/auth.schema';
import { AuthService } from '../services/auth.service';
import { badRequest } from '../lib/https';

export const AuthController = {
  signup: async (req: Request, res: Response) => {
    const p = SignupBody.safeParse(req.body);
    if (!p.success) throw badRequest('Invalid input');
    const out = await AuthService.signup(p.data);
    return res.json(out);
  },

  verify: async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    if (!token) throw badRequest('Missing token');
    const out = await AuthService.verifyEmail(token);
    for (const c of out.cookies) res.cookie(c.name, c.value, c.options);
    return res.json(out.body);
  },

  login: async (req: Request, res: Response) => {
    const p = LoginBody.safeParse(req.body);
    if (!p.success) throw badRequest('Invalid body');
    const out = await AuthService.login(p.data);
    for (const c of out.cookies) res.cookie(c.name, c.value, c.options);
    return res.json(out.body);
  },

  requestOtp: async (req: Request, res: Response) => {
    const p = RequestOtpBody.safeParse(req.body);
    if (!p.success) throw badRequest('Email required');
    const out = await AuthService.requestOtp(p.data.email);
    return res.json(out);
  },

  verifyOtp: async (req: Request, res: Response) => {
    const p = VerifyOtpBody.safeParse(req.body);
    if (!p.success) throw badRequest('Invalid/expired OTP');
    const out = await AuthService.verifyOtp(p.data.email, p.data.code);
    for (const c of out.cookies) res.cookie(c.name, c.value, c.options);
    return res.json(out.body);
  },

  refresh: async (req: Request, res: Response) => {
    const out = await AuthService.refresh(req.cookies?.['__knwdle_session']);
    for (const c of out.cookies) res.cookie(c.name, c.value, c.options);
    return res.json(out.body);
  },

  logout: async (req: Request, res: Response) => {
    const out = await AuthService.logout(req.cookies?.['__knwdle_session']);
    res.clearCookie(out.clearCookie.name, out.clearCookie.options);
    return res.sendStatus(204);
  },
};
