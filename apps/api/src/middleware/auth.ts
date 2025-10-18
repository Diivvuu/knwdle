import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = {
      id: decoded.sub,
      email: user.email,
      memberships: decoded.memberships,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
