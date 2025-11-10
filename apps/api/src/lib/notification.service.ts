import { prisma } from './prisma';

export const NotificationService = {
  //create a notification
  async push(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    meta?: Record<string, any>;
    orgId?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        orgId: data.orgId ?? null,
        type: data.type,
        title: data.title,
        body: data.body,
        meta: data.meta ?? {},
      },
    });
  },
  // list unread notifications
  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },
  // mark as read
  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  },
};
