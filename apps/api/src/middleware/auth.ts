import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  console.log(header, 'check');
  if (!header) return res.status(401).json({ error: 'No token' });
  console.log(header, 'check');
  const token = header.replace('Bearer ', '');
  try {
    console.log(header, 'check');
    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    req.user = { id: decoded.sub, memberships: decoded.memberships };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
