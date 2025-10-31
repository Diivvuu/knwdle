// src/repositories/user.repo.ts
import { prisma } from '../lib/prisma';

export const UserRepo = {
  byEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        mobile: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        bio: true,
        password: true,
        emailVerified: true,
      },
    }),

  //TODO : make whole controller for user (with admin, and self roles)
  updateProfile(
    userId: string,
    data: Partial<{
      name: string;
      profilePhoto: string;
      mobile: string;
      gender: string;
      dateOfBirth: string;
      address: string;
      bio: string;
    }>
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        mobile: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        bio: true,
      },
    });
  },
  create: (data: { email: string; password: string; name?: string }) =>
    prisma.user.create({ data }),
  markVerified: (userId: string) =>
    prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    }),
  findUserWithMembership(email: string, orgId: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        memberships: {
          where: { orgId },
          select: { id: true },
        },
      },
    });
  },

  findByIdWithMemberships(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        memberships: {
          select: {
            role: true,
            customerRole: { select: { name: true } },
            org: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });
  },
};
