import { UserType } from "@prisma/client";
import prisma from "../db/prisma/prisma";

const notificationRepository = {
  getNotifications: async (
    userType: UserType,
    userId: string,
    limit: number,
    offset: number
  ) => {
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userType, userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, limit, offset };
  },
  // 안읽은 알림 존재 여부 반환
  hasUnreadNotification: async (userType: UserType, userId: string) => {
    const unread = await prisma.notification.findFirst({
      where: { userType, userId, isRead: false },
      select: { id: true },
    });
    return !!unread;
  },
  readNotification: async (notificationId: string) => {
    // 먼저 알림이 존재하는지 확인
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    
    if (!notification) {
      throw new Error("해당 알림을 찾을수 없습니다.");
    }
    
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
