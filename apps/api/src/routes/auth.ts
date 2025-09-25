import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  signAccess,
  signRefresh,
  verifyRefresh,
  verifyAccess,
} from '../lib/jwt';

const router = Router();

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'refresh_token';
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || 'localhost';

// In-memory stores (replace with DB/Prisma)
type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  name?: string;
};
const USERS = new Map<string, User>(); // key = email
const REFRESH_STORE = new Map<
  string,
  { tokenId: string; userEmail: string; expiresAt: number }
>();

// Helper to create user (for dev)
async function createUser(email: string, password: string, role = 'admin') {
  const id = randomBytes(8).toString('hex');
  const hash = await bcrypt.hash(password, 10);
  const user: User = { id, email, passwordHash: hash, role };
  USERS.set(email, user);
  return user;
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  let user = USERS.get(email);
  if (!user) {
    // auto-provision for dev convenience (REMOVE in prod)
    user = await createUser(email, password, 'admin');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  // create refresh token id, store hashed or id (we store id for this demo)
  const tokenId = randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30d
  REFRESH_STORE.set(tokenId, { tokenId, userEmail: email, expiresAt });

  const accessToken = signAccess({ sub: user.id, role: user.role });
  const refreshTokenJwt = signRefresh({ sub: user.id, tid: tokenId });

  res.cookie(COOKIE_NAME, refreshTokenJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    domain: COOKIE_DOMAIN,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  return res.json({
    accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'missing refresh' });
  try {
    const payload: any = verifyRefresh(token) as any;
    const tokenId = payload.tid;
    const userId = payload.sub;

    const record = REFRESH_STORE.get(tokenId);
    if (!record) return res.status(401).json({ error: 'invalid refresh' });

    // rotate: create new token id
    const newId = randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
    REFRESH_STORE.delete(tokenId);
    REFRESH_STORE.set(newId, {
      tokenId: newId,
      userEmail: record.userEmail,
      expiresAt,
    });

    const accessToken = signAccess({ sub: userId, role: 'user' });
    const newRefreshJwt = signRefresh({ sub: userId, tid: newId });

    res.cookie(COOKIE_NAME, newRefreshJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: COOKIE_DOMAIN,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return res.json({ accessToken });
  } catch (_e) {
    return res.status(401).json({ error: 'invalid token' });
  }
});

router.post('/logout', (_req, res) => {
  const token = _req.cookies ? _req.cookies[COOKIE_NAME] : null;
  if (token) {
    try {
      const payload: any = verifyRefresh(token);
      const tokenId = payload.tid;
      REFRESH_STORE.delete(tokenId);
    } catch {}
  }
  res.clearCookie(COOKIE_NAME, { domain: COOKIE_DOMAIN, path: '/' });
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  // expects Authorization: Bearer <accessToken>
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).end();
  const token = auth.split(' ')[1];
  try {
    const decoded = verifyAccess(token) as any; // uses lib/jwt verifyAccess
    // find user by sub
    const user = Array.from(USERS.values()).find((u) => u.id === decoded.sub);
    if (!user) return res.status(401).end();
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (e) {
    res.status(401).end();
  }
});

export default router;
