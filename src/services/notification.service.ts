import notificationRepository from "../repositories/notification.repository";

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
    return { ...notifications, hasUnread };
  },
  readNotification: async (notificationId: string) => {
    return notificationRepository.readNotification(notificationId as string);
  },
  readAllNotifications: async (userId: string) => {
    return notificationRepository.readAllNotifications(userId as string);
  },
};

export default notificationService;
