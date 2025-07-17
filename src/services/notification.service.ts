import notificationRepository from "../repositories/notification.repository";

const notificationService = {
  getNotifications: async (userId: number, limit: number, offset: number) => {
    const notifications = await notificationRepository.getNotifications(
      userId,
      limit,
      offset
    );
    const hasUnread =
      await notificationRepository.hasUnreadNotification(userId);
    return { ...notifications, hasUnread };
  },
  readNotification: async (notificationId: number) => {
    return notificationRepository.readNotification(notificationId);
  },
  readAllNotifications: async (userId: number) => {
    return notificationRepository.readAllNotifications(userId);
  },
};

export default notificationService;
