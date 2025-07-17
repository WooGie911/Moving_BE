import prisma from "../db/prisma/prisma";

const notificationRepository = {
  getNotifications: async (userId: number, limit: number, offset: number) => {
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
  hasUnreadNotification: async (userId: number) => {
    const unread = await prisma.notification.findFirst({
      where: { userId, isRead: false },
      select: { id: true },
    });
    return !!unread;
  },
};

export default notificationRepository;
