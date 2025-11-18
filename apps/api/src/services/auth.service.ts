// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendMail, wrapHtml } from '../lib/mailer';
import { MailTemplates } from '../lib/mail-templates';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt';
import { sessionCookieOptions } from '../lib/cookies';
import { UserRepo } from '../repositories/user.repo';
import { SessionRepo } from '../repositories/session.repo';
import { HttpError } from '../lib/https';
import { VerificationTokenRepo } from '../repositories/verification-token.repo';
import { OtpTokenRepo } from '../repositories/otp-token.repo';

const COOKIE_NAME = process.env.COOKIE_NAME || '__knwdle_session';
const AUTH_ORIGIN = process.env.AUTH_ORIGIN!;

export const AuthService = {
  async signup({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }) {
    const existing = await UserRepo.byEmail(email);

    if (existing?.emailVerified) {
      throw new HttpError(409, 'User already exists and verified');
    }

    if (existing && !existing.emailVerified) {
      let v = await VerificationTokenRepo.findByUserId(existing.id);
      if (!v) {
        v = await VerificationTokenRepo.create(
          existing.id,
          crypto.randomBytes(16).toString('hex'),
          new Date(Date.now() + 86400e3)
        );
      }
      const link = `${AUTH_ORIGIN}/auth/verify?token=${v.token}`;
      const t = MailTemplates.verifyEmail(link);
      await sendMail(
        email,
        t.subject,
        wrapHtml({ title: t.subject, bodyHtml: t.html })
      );
      throw new HttpError(
        403,
        'User exists but not verified. Verification email resent.'
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await UserRepo.create({ email, password: hash, name });
    const token = crypto.randomBytes(16).toString('hex');

    await VerificationTokenRepo.create(
      user.id,
      token,
      new Date(Date.now() + 365 * 86400e3)
    );

    const link = `${AUTH_ORIGIN}/auth/verify?token=${token}`;
    const t = MailTemplates.verifyEmail(link);
    await sendMail(
      email,
      t.subject,
      wrapHtml({ title: t.subject, bodyHtml: t.html })
    );
    return { message: 'Signup successfull. Check email to verify account' };
  },

  async verifyEmail(token: string) {
  const v = await VerificationTokenRepo.findByToken(token);
  if (!v || v.expiresAt < new Date())
    throw new HttpError(400, 'Invalid/expired token');

  await UserRepo.markVerified(v.userId);
  
  // FIX: Use byId instead of byEmail
  const user = await UserRepo.findByIdWithMemberships(v.userId); // ✅ CORRECT

  if (!user) throw new HttpError(404, 'User not found');

  await VerificationTokenRepo.delete(v.id);

  const sess = await SessionRepo.create(user.id);
  const access = signAccess(user.id);
  const refresh = signRefresh(user.id, sess.id);
  await SessionRepo.setToken(sess.id, refresh);

  return {
    cookies: [
      { name: COOKIE_NAME, value: refresh, options: sessionCookieOptions() },
    ],
    body: { message: 'Email verified', accessToken: access, user },
  };
},

  async login({ email, password }: { email: string; password: string }) {
    const user = await UserRepo.byEmail(email);
    if (!user) throw new HttpError(401, 'Invalid credentials');
    if (!user.emailVerified) throw new HttpError(403, 'Email not verified');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new HttpError(401, 'Invalid credentials');

    const sess = await SessionRepo.create(user.id);
    const access = signAccess(user.id);
    const refresh = signRefresh(user.id, sess.id);
    await SessionRepo.setToken(sess.id, refresh);

    return {
      cookies: [
        { name: COOKIE_NAME, value: refresh, options: sessionCookieOptions() },
      ],
      body: {
        accessToken: access,
        user: { id: user.id, email: user.email, name: user.name },
      },
    };
  },

  async requestOtp(email: string) {
    const user = await UserRepo.byEmail(email);
    if (!user) throw new HttpError(404, 'User not found');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpTokenRepo.create(
      user.id,
      code,
      new Date(Date.now() + 10 * 60 * 1000)
    );

    const t = MailTemplates.otp(code);
    await sendMail(
      email,
      t.subject,
      wrapHtml({ title: t.subject, bodyHtml: t.html })
    );
    return { message: 'OTP sent to email' };
  },

  async verifyOtp(email: string, code: string) {
    const user = await UserRepo.byEmail(email);
    if (!user) throw new HttpError(404, 'User not found');

    const otp = await OtpTokenRepo.findLatest(user.id, code);
    if (!otp || otp.expiresAt < new Date())
      throw new HttpError(400, 'Invalid/expired OTP');
    await OtpTokenRepo.delete(otp.id);

    if (!user.emailVerified) await UserRepo.markVerified(user.id);

    const sess = await SessionRepo.create(user.id);
    const access = signAccess(user.id);
    const refresh = signRefresh(user.id, sess.id);
    await SessionRepo.setToken(sess.id, refresh);

    return {
      cookies: [
        { name: COOKIE_NAME, value: refresh, options: sessionCookieOptions() },
      ],
      body: { message: 'OTP login success', accessToken: access, user },
    };
  },

  async refresh(refreshCookie: string | undefined) {
    if (!refreshCookie) throw new HttpError(401, 'No session');
    let payload: { sub: string; jti: string };
    try {
      payload = verifyRefresh(refreshCookie) as any;
    } catch {
      throw new HttpError(401, 'Invalid session');
    }
    const sess = await SessionRepo.get(payload.jti);
    if (!sess || sess.refreshToken !== refreshCookie)
      throw new HttpError(401, 'Session not found/rotated');

    const newAccess = signAccess(payload.sub);
    const newRefresh = signRefresh(payload.sub, sess.id);
    await SessionRepo.setToken(sess.id, newRefresh);
    return {
      cookies: [
        {
          name: COOKIE_NAME,
          value: newRefresh,
          options: sessionCookieOptions(),
        },
      ],
      body: { accessToken: newAccess },
    };
  },

  async logout(refreshCookie?: string) {
    if (refreshCookie) {
      try {
        const { jti } = verifyRefresh(refreshCookie) as any;
        await SessionRepo.delete(jti).catch(() => {});
      } catch {}
    }
    return {
      clearCookie: { name: COOKIE_NAME, options: sessionCookieOptions() },
    };
  },

  async getMe(userId: string) {
    const user = await UserRepo.findByIdWithMemberships(userId);
    if (!user) throw new HttpError(404, 'User not found');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.profilePhoto ?? null,
      memberships: user.memberships.map((m) => ({
        org: {
          id: m.org.id,
          name: m.org.name,
          type: m.org.type,
        },
        role: m.customerRole?.name ?? m.role ?? null,
      })),
    };
  },
};
