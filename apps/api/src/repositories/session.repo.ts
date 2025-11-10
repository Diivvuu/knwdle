// src/repositories/session.repo.ts
import { prisma } from '../lib/prisma';

export const SessionRepo = {
  create: (userId: string) =>
    prisma.session.create({ data: { userId, refreshToken: '' } }),
  setToken: (id: string, token: string) =>
    prisma.session.update({ where: { id }, data: { refreshToken: token } }),
  get: (id: string) => prisma.session.findUnique({ where: { id } }),
  delete: (id: string) => prisma.session.delete({ where: { id } }),
};
