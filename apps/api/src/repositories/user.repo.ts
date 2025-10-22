// src/repositories/user.repo.ts
import { prisma } from '../lib/prisma';

export const UserRepo = {
  byEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),
  create: (data: { email: string; password: string; name?: string }) =>
    prisma.user.create({ data }),
  markVerified: (userId: string) =>
    prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } }),
};