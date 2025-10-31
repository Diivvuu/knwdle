import { prisma } from '../lib/prisma';
export const OtpTokenRepo = {
  create(userId: string, code: string, expiresAt: Date) {
    return prisma.otpToken.create({ data: { userId, code, expiresAt } });
  },
  findLatest(userId: string, code: string) {
    return prisma.otpToken.findFirst({
      where: { userId, code },
      orderBy: { createdAt: 'desc' },
    });
  },
  delete(id: string) {
    return prisma.otpToken.delete({ where: { id } });
  },
};
