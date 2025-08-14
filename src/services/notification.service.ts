import { UserType } from "@prisma/client";
import notificationRepository from "../repositories/notification.repository";
import { parseDateToDateTime } from "../utils/dateUtils";

const notificationService = {
  getNotifications: async (
    userType: UserType,
    userId: string,
    limit: number,
    offset: number,
    lang: string = 'ko' // 기본값은 한국어
  ) => {
    const notifications = await notificationRepository.getNotifications(
      userType,
      userId as string,
      limit,
      offset
    );
    const hasUnread = await notificationRepository.hasUnreadNotification(
      userType,
      userId as string
    );

    // 날짜 포맷팅 적용
    const formattedItems = notifications.items.map((notification: any) => {
      // 언어별 메시지 선택
      let message;
      switch (lang) {
        case 'en':
          message = notification.messageEn;
          break;
        case 'zh':
          message = notification.messageZh;
          break;
        default:
          message = notification.messageKo;
          break;
      }

      return {
        ...notification,
        message, // 선택된 언어의 메시지만 포함
        createdAt: parseDateToDateTime(notification.createdAt),
        updatedAt: parseDateToDateTime(notification.updatedAt),
        messageKo: undefined, // 원본 다국어 필드 제거
        messageEn: undefined,
        messageZh: undefined
      };
    });

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
