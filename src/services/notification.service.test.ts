import NotificationService from "./notification.service";
import { NotificationType } from "@prisma/client";

// 레포지토리 모듈 전체를 모킹
jest.mock("../repositories/notification.repository", () => ({
  getNotifications: jest.fn(),
  hasUnreadNotification: jest.fn(),
  readNotification: jest.fn(),
  readAllNotifications: jest.fn(),
}));

import notificationRepository from "../repositories/notification.repository";
const mockRepository = notificationRepository as jest.Mocked<
  typeof notificationRepository
>;

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("성공적으로 알림 목록을 조회한다", async () => {
      // Setup
      const mockNotifications = {
        items: [
          {
            id: "notification-1",
            actionId: "action-1",
            userId: "user-1",
            type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
            title: "새로운 견적 요청",
            content: "테스트 알림 1",
            path: null,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
          {
            id: "notification-2",
            actionId: "action-2",
            userId: "user-1",
            type: "ESTIMATE_ARRIVED" as NotificationType,
            title: "견적이 도착했습니다",
            content: "테스트 알림 2",
            path: null,
            isRead: true,
            createdAt: new Date(),
            updatedAt: new Date(),
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
      const result = await NotificationService.getNotifications(
        "user-1",
        10,
        0
      );

      // Assertion
      expect(mockRepository.getNotifications).toHaveBeenCalledWith(
        "user-1",
        10,
        0
      );
      expect(mockRepository.hasUnreadNotification).toHaveBeenCalledWith(
        "user-1"
      );
      expect(result).toEqual({ ...mockNotifications, hasUnread: true });
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.getNotifications.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        NotificationService.getNotifications("user-1", 10, 0)
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.getNotifications).toHaveBeenCalledWith(
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
        await NotificationService.readNotification("notification-1");

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
        NotificationService.readNotification("notification-1")
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
      const result = await NotificationService.readAllNotifications("user-1");

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
        NotificationService.readAllNotifications("user-1")
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.readAllNotifications).toHaveBeenCalledWith(
        "user-1"
      );
    });
  });
});
