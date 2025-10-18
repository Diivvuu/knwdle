import { PrismaClient } from '../generated/prisma';

declare global {
  // Avoid reinitializing in dev with hot reload
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
