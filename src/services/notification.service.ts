import notificationRepository from "../repositories/notification.repository";
import { formatDateForAPI } from "../utils/dateUtils";

const notificationService = {
  getNotifications: async (userId: string, limit: number, offset: number) => {
    const notifications = await notificationRepository.getNotifications(
      userId as string,
      limit,
      offset
    );
    const hasUnread = await notificationRepository.hasUnreadNotification(
      userId as string
    );

    // 날짜 포맷팅 적용
    const formattedItems = notifications.items.map((notification: any) => ({
      ...notification,
      createdAt: formatDateForAPI(notification.createdAt),
      updatedAt: formatDateForAPI(notification.updatedAt),
    }));

    return { ...notifications, items: formattedItems, hasUnread };
  },
  readNotification: async (notificationId: string) => {
    return notificationRepository.readNotification(notificationId as string);
  },
  readAllNotifications: async (userId: string) => {
    return notificationRepository.readAllNotifications(userId as string);
  },
};

export default notificationService;
