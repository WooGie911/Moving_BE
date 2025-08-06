import { UserType, NotificationType } from "@prisma/client";
import notificationService from "./notification.service";

// 레포지토리 모듈 전체를 모킹
jest.mock("../repositories/notification.repository", () => ({
  getNotifications: jest.fn(),
  hasUnreadNotification: jest.fn(),
  readNotification: jest.fn(),
  readAllNotifications: jest.fn(),
}));

// dateUtils 모듈을 모킹
jest.mock("../utils/dateUtils", () => ({
  formatDateForAPI: jest.fn((date) => `formatted-${date.toISOString()}`),
}));

import notificationRepository from "../repositories/notification.repository";
import { formatDateForAPI } from "../utils/dateUtils";

const mockRepository = notificationRepository as jest.Mocked<
  typeof notificationRepository
>;
const mockFormatDateForAPI = formatDateForAPI as jest.MockedFunction<
  typeof formatDateForAPI
>;

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("성공적으로 알림 목록을 조회하고 날짜를 포맷팅한다", async () => {
      // Setup
      const mockNotifications = {
        items: [
          {
            id: "notification-1",
            actionId: "action-1",
            userId: "user-1",
            userType: "CUSTOMER" as UserType,
            type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
            title: "새로운 견적 요청",
            content: "테스트 알림 1",
            path: null,
            isRead: false,
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
            deletedAt: null,
          },
          {
            id: "notification-2",
            actionId: "action-2",
            userId: "user-1",
            userType: "CUSTOMER" as UserType,
            type: "ESTIMATE_ARRIVED" as NotificationType,
            title: "견적이 도착했습니다",
            content: "테스트 알림 2",
            path: null,
            isRead: true,
            createdAt: new Date("2024-01-02T00:00:00Z"),
            updatedAt: new Date("2024-01-02T00:00:00Z"),
            deletedAt: null,
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };

      mockRepository.getNotifications.mockResolvedValue(mockNotifications);
      mockRepository.hasUnreadNotification.mockResolvedValue(true);

      // Exercise
      const result = await notificationService.getNotifications(
        "CUSTOMER" as UserType,
        "user-1",
        10,
        0
      );

      // Assertion
      expect(mockRepository.getNotifications).toHaveBeenCalledWith(
        "CUSTOMER",
        "user-1",
        10,
        0
      );
      expect(mockRepository.hasUnreadNotification).toHaveBeenCalledWith(
        "CUSTOMER",
        "user-1"
      );
      
      // 날짜 포맷팅이 적용되었는지 확인
      expect(mockFormatDateForAPI).toHaveBeenCalledTimes(4); // createdAt, updatedAt 각각 2번씩
      expect(result.items[0].createdAt).toBe("formatted-2024-01-01T00:00:00.000Z");
      expect(result.items[0].updatedAt).toBe("formatted-2024-01-01T00:00:00.000Z");
      expect(result.items[1].createdAt).toBe("formatted-2024-01-02T00:00:00.000Z");
      expect(result.items[1].updatedAt).toBe("formatted-2024-01-02T00:00:00.000Z");
      
      expect(result).toEqual({
        ...mockNotifications,
        items: result.items,
        hasUnread: true,
      });
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.getNotifications.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        notificationService.getNotifications("CUSTOMER" as UserType, "user-1", 10, 0)
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.getNotifications).toHaveBeenCalledWith(
        "CUSTOMER",
        "user-1",
        10,
        0
      );
    });
  });

  describe("readNotification", () => {
    it("성공적으로 알림을 읽음 처리한다", async () => {
      // Setup
      const mockNotification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        userType: "CUSTOMER" as UserType,
        type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
        title: "새로운 견적 요청",
        content: "테스트 알림 1",
        path: null,
        isRead: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockRepository.readNotification.mockResolvedValue(mockNotification);

      // Exercise
      const result =
        await notificationService.readNotification("notification-1");

      // Assertion
      expect(mockRepository.readNotification).toHaveBeenCalledWith(
        "notification-1"
      );
      expect(result).toEqual(mockNotification);
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.readNotification.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        notificationService.readNotification("notification-1")
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.readNotification).toHaveBeenCalledWith(
        "notification-1"
      );
    });
  });

  describe("readAllNotifications", () => {
    it("성공적으로 모든 알림을 읽음 처리한다", async () => {
      // Setup
      const mockResult = 5;
      mockRepository.readAllNotifications.mockResolvedValue(mockResult);

      // Exercise
      const result = await notificationService.readAllNotifications("user-1");

      // Assertion
      expect(mockRepository.readAllNotifications).toHaveBeenCalledWith(
        "user-1"
      );
      expect(result).toEqual(mockResult);
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.readAllNotifications.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        notificationService.readAllNotifications("user-1")
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.readAllNotifications).toHaveBeenCalledWith(
        "user-1"
      );
    });
  });
});
