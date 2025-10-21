import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt';
import { sendMail, wrapHtml } from '../lib/mailer';
import { MailTemplates } from '../lib/mail-templates';
import { sessionCookieOptions } from '../lib/cookies';

import { requireAuth } from '../middleware/auth';
import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import '../lib/openapi/extend';

const r = Router();

const COOKIE_NAME = process.env.COOKIE_NAME || '__knwdle_session';

const authRegistry = new OpenAPIRegistry();

authRegistry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: COOKIE_NAME,
});

function generateToken(len = 32) {
  return crypto.randomBytes(len).toString('hex');
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

/*----------------- Signup -----------------*/
const SignupBody = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
  })
  .openapi('AuthSignupBody');

const LoginBody = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
  })
  .openapi('AuthLoginBody');

const RequestOtpBody = z
  .object({
    email: z.string().email(),
  })
  .openapi('AuthRequestOtpBody');

const VerifyOtpBody = z
  .object({
    email: z.string().email(),
    code: z.string().min(4).max(10),
  })
  .openapi('AuthVerifyOtpBody');

const AuthBasicMessage = z
  .object({
    message: z.string(),
  })
  .openapi('AuthBasicMessage');

const AuthError = z
  .object({
    error: z.string(),
  })
  .openapi('AuthError');

// Define once, give each a name
const AuthUser = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable().optional(),
  })
  .openapi('AuthUser');

const AuthAccessResponse = z
  .object({
    accessToken: z.string(),
    user: AuthUser,
  })
  .openapi('AuthAccessResponse');

authRegistry.registerPath({
  method: 'post',
  path: '/auth/signup',
  summary: 'Create a new user account',
  request: {
    body: { content: { 'application/json': { schema: SignupBody } } },
  },
  responses: {
    200: {
      description: 'Verification email sent',
      content: { 'application/json': { schema: AuthBasicMessage } },
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: AuthError } },
    },
    403: {
      description: 'Unverified user exists (resent email)',
      content: { 'application/json': { schema: AuthError } },
    },
    409: {
      description: 'Already verified',
      content: { 'application/json': { schema: AuthError } },
    },
  },
  tags: ['auth'],
});

r.post('/signup', async (req, res) => {
  const p = SignupBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid input' });
  const { email, password, name } = p.data;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.emailVerified) {
      return res
        .status(409)
        .json({ error: 'User already exists and verified' });
    }

    // Not verified → resend same token or generate new
    let v = await prisma.verificationToken.findFirst({
      where: { userId: existing.id },
    });
    if (!v) {
      const token = generateToken(16);
      v = await prisma.verificationToken.create({
        data: {
          userId: existing.id,
          token,
          type: 'EMAIL_VERIFY',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
    }

    const verifyLink = `${process.env.AUTH_ORIGIN}/auth/verify?token=${v.token}`;
    const t = MailTemplates.verifyEmail(verifyLink);
    await sendMail(
      email,
      t.subject,
      wrapHtml({ title: t.subject, bodyHtml: t.html })
    );

    return res.status(403).json({
      error: 'User exists but not verified. Verification email resent.',
    });
  }

  // Fresh signup
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name },
  });

  const token = generateToken(16);
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      type: 'EMAIL_VERIFY',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  });

  const verifyLink = `${process.env.AUTH_ORIGIN}/auth/verify?token=${token}`;
  const t = MailTemplates.verifyEmail(verifyLink);
  await sendMail(
    email,
    t.subject,
    wrapHtml({ title: t.subject, bodyHtml: t.html })
  );

  res.json({ message: 'Signup successfull. Check email to verify account' });
});

authRegistry.registerPath({
  method: 'get',
  path: '/auth/verify',
  summary: 'Verify email via token and create a session',
  request: { query: z.object({ token: z.string() }) },
  responses: {
    200: {
      description: 'Email verified, returs access token',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            accessToken: z.string(),
            user: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Invalid/expired token',
      content: { 'application/json': { schema: AuthError } },
    },
  },
  tags: ['auth'],
});

r.get('/verify', async (req, res) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const v = await prisma.verificationToken.findUnique({ where: { token } });
  if (!v || v.expiresAt < new Date())
    return res.status(400).json({ error: `Invalid/expired token` });

  const user = await prisma.user.update({
    where: { id: v.userId },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { id: v.id } });

  const session = await prisma.session.create({
    data: { userId: user.id, refreshToken: '' },
  });

  const access = signAccess(user.id);
  const refresh = signRefresh(user.id, session.id);
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: refresh },
  });

  res.cookie(COOKIE_NAME, refresh, sessionCookieOptions());
  res.json({ message: 'Email verified', accessToken: access, user });
});

authRegistry.registerPath({
  method: 'post',
  path: '/auth/login',
  summary: 'Login using email + password',
  request: {
    body: { content: { 'application/json': { schema: LoginBody } } },
  },
  responses: {
    200: {
      description: 'Logged in',
      content: { 'application/json': { schema: AuthAccessResponse } },
    },
    400: {
      description: 'Invalid body',
      content: { 'application/json': { schema: AuthError } },
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: AuthError } },
    },
    403: {
      description: 'Email not verified',
      content: { 'application/json': { schema: AuthError } },
    },
  },
  tags: ['auth'],
});

r.post('/login', async (req, res) => {
  const p = LoginBody.safeParse(req.body);
  console.log('all good', p);
  if (!p.success) return res.status(400).json({ error: 'Invalid body' });
  const { email, password } = p.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.emailVerified)
    return res.status(403).json({ error: 'Email not verified' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const session = await prisma.session.create({
    data: { userId: user.id, refreshToken: '' },
  });

  const access = signAccess(user.id);
  const refresh = signRefresh(user.id, session.id);
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: refresh,
    },
  });

  res.cookie(COOKIE_NAME, refresh, sessionCookieOptions());

  res.json({
    accessToken: access,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

authRegistry.registerPath({
  method: 'post',
  path: '/auth/request-otp',
  summary: 'Request a login OTP via email',
  request: {
    body: { content: { 'application/json': { schema: RequestOtpBody } } },
  },
  responses: {
    200: {
      description: 'OTP sent',
      content: { 'application/json': { schema: AuthBasicMessage } },
    },
    400: {
      description: 'Email required',
      content: { 'application/json': { schema: AuthError } },
    },
    404: {
      description: 'User not found',
      content: { 'application/json': { schema: AuthError } },
    },
  },
  tags: ['auth'],
});

//otp based routes
r.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const code = generateOtp();
  await prisma.otpToken.create({
    data: {
      userId: user.id,
      code,
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
    },
  });

  const t = MailTemplates.otp(code);
  await sendMail(
    email,
    t.subject,
    wrapHtml({ title: t.subject, bodyHtml: t.html })
  );

  res.json({ message: 'OTP sent to email' });
});

authRegistry.registerPath({
  method: 'post',
  path: '/auth/verify-otp',
  summary: 'Verify OTP and login',
  request: {
    body: { content: { 'application/json': { schema: VerifyOtpBody } } },
  },
  responses: {
    200: {
      description: 'OTP login success',
      content: { 'application/json': { schema: AuthAccessResponse } },
    },
    400: {
      description: 'Invalid/expired OTP',
      content: { 'application/json': { schema: AuthError } },
    },
    404: {
      description: 'User not found',
      content: { 'application/json': { schema: AuthError } },
    },
  },
  tags: ['auth'],
});

// verify routes
r.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ error: 'Email + code required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = await prisma.otpToken.findFirst({
    where: { userId: user.id, code },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp || otp.expiresAt < new Date())
    return res.status(400).json({ error: 'Invalid/expired OTP' });

  await prisma.otpToken.delete({ where: { id: otp.id } });

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  const session = await prisma.session.create({
    data: { userId: user.id, refreshToken: '' },
  });

  const access = signAccess(user.id);
  const refresh = signRefresh(user.id, session.id);
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: refresh },
  });

  res.cookie(COOKIE_NAME, refresh, sessionCookieOptions());

  res.json({ message: 'OTP login success', accessToken: access, user });
});

authRegistry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  summary: 'Rotate refresh token and gew new access token',
  responses: {
    200: {
      description: 'New access token',
      content: {
        'application/json': { schema: z.object({ accessToken: z.string() }) },
      },
    },
    401: {
      description: 'No/invalid session',
      content: { 'application/json': { schema: AuthError } },
    },
  },
  tags: ['auth'],
  security: [{ cookieAuth: [] }],
});

//refresh routes
r.post('/refresh', async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'No session' });
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefresh(token) as any;
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const sess = await prisma.session.findUnique({ where: { id: payload.jti } });
  if (!sess || sess.refreshToken !== token)
    return res.status(401).json({ error: 'Session not found/rotated' });

  const newAccess = signAccess(payload.sub);
  const newRefresh = signRefresh(payload.sub, sess.id);
  await prisma.session.update({
    where: { id: sess.id },
    data: { refreshToken: newRefresh },
  });

  res.cookie(COOKIE_NAME, newRefresh, sessionCookieOptions());
  res.json({ accessToken: newAccess });
});

authRegistry.registerPath({
  method: 'post',
  path: '/auth/logout',
  summary: 'Logout and clear refresh cookie',
  responses: { 204: { description: 'Logged out' } },
  tags: ['auth'],
  security: [{ cookieAuth: [] }],
});
//logout
r.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      try {
        const { jti } = verifyRefresh(token) as any;
        await prisma.session.delete({ where: { id: jti } }).catch(() => {});
      } catch {}
    }
  } finally {
    res.clearCookie(COOKIE_NAME, sessionCookieOptions());
    return res.sendStatus(204);
  }
});

authRegistry.registerPath({
  method: 'get',
  path: '/auth/me',
  summary: 'Get current user + org memberships',
  responses: {
    200: {
      description: 'Current user',
      content: { 'application/json': { schema: z.any() } },
    },
  },
  tags: ['auth'],
  security: [{ cookieAuth: [] }],
});

r.get('/me', requireAuth, async (req, res) => {
  const userId = req.user!.id;
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
});

authRegistry.registerPath({
  method: 'get',
  path: '/auth/invites/{token}/preview',
  summary: 'Preview an invite token',
  request: { params: z.object({ token: z.string() }) },
  responses: {
    200: {
      description: 'Invite preview',
      content: { 'application/json': { schema: z.any() } },
    },
    404: {
      description: 'Invite not found',
      content: { 'application/json': { schema: AuthError } },
    },
    410: {
      description: 'Invite expired',
      content: { 'application/json': { schema: AuthError } },
    },
  },
  tags: ['auth'],
});

r.get('/invites/:token/preview', async (req, res) => {
  const { token } = req.params;

  const inv = await prisma.invite.findUnique({
    where: { token },
    select: {
      orgId: true,
      unitId: true,
      email: true,
      role: true,
      roleId: true,
      expiresAt: true,
      org: { select: { name: true } },
      unit: { select: { name: true } },
      roleRef: { select: { name: true, parentRole: true } },
    },
  });

  if (!inv) return res.status(404).json({ error: 'Invite not found' });
  if (inv.expiresAt < new Date())
    return res.status(410).json({ error: 'Invite Expired' });

  res.json({
    orgId: inv.orgId,
    orgName: inv.org?.name ?? 'Organisation',
    unitName: inv.unit?.name ?? null,
    invitedEmail: inv.email,
    parentRole: inv.roleRef?.parentRole ?? inv.role,
    roleName: inv.roleRef?.name ?? null,
    expiresAt: inv.expiresAt.toISOString(),
  });
});

export const getAuthOpenApiPaths = () => {
  const generator = new OpenApiGeneratorV3(authRegistry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Auth API', version: '1.0.0' },
  });
};

export default r;
