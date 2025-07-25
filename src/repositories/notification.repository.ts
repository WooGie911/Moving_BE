import prisma from "../db/prisma/prisma";

const notificationRepository = {
  getNotifications: async (userId: string, limit: number, offset: number) => {
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, limit, offset };
  },
  // 안읽은 알림 존재 여부 반환
  hasUnreadNotification: async (userId: string) => {
    const unread = await prisma.notification.findFirst({
      where: { userId, isRead: false },
      select: { id: true },
    });
    return !!unread;
  },
  readNotification: async (notificationId: string) => {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },
  readAllNotifications: async (userId: string) => {
    const { count } = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return count;
  },
};

export default notificationRepository;
