import jwt from 'jsonwebtoken';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_MIN = Number(process.env.ACCESS_EXPIRES_MIN || 15);
const REFRESH_DAYS = Number(process.env.REFRESH_EXPIRY_DAYS || 30);

export const signAccess = (sub: string) =>
  jwt.sign({ sub }, ACCESS_SECRET, { expiresIn: `${ACCESS_MIN}m` });

export const signRefresh = (sub: string, jti: string) =>
  jwt.sign({ sub, jti }, REFRESH_SECRET, { expiresIn: `${REFRESH_DAYS}d` });

export const verifyRefresh = (t: string) =>
  jwt.verify(t, REFRESH_SECRET) as { sub: string; jti: string };
