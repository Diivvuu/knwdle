import { prisma } from '../lib/prisma';

export const VerificationTokenRepo = {
  findByUserId(userId: string) {
    return prisma.verificationToken.findFirst({ where: { userId } });
  },
  create(userId: string, token: string, expiresAt: Date) {
    return prisma.verificationToken.create({
      data: { userId, token, type: 'EMAIL_VERIFY', expiresAt },
    });
  },
  findByToken(token: string) {
    return prisma.verificationToken.findUnique({ where: { token } });
  },
  delete(id: string) {
    return prisma.verificationToken.delete({ where: { id } });
  },
};
