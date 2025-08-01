import { PrismaClient, NotificationType } from "@prisma/client";

// PrismaClient를 모킹
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    notification: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  })),
  NotificationType: {
    WELCOME: "WELCOME",
    ESTIMATE_REQUEST_ARRIVED: "ESTIMATE_REQUEST_ARRIVED",
    ESTIMATE_ARRIVED: "ESTIMATE_ARRIVED",
    ESTIMATE_STATUS_UPDATED: "ESTIMATE_STATUS_UPDATED",
    DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED:
      "DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED",
    DESIGNATED_ESTIMATE_STATUS_UPDATED: "DESIGNATED_ESTIMATE_STATUS_UPDATED",
    REVIEW_EVENT: "REVIEW_EVENT",
    FAVORITE_EVENT: "FAVORITE_EVENT",
    MOVE_DAY_REMINDER: "MOVE_DAY_REMINDER",
  },
}));

// prisma 모듈을 모킹
jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    notification: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import notificationRepository from "./notification.repository";
import prisma from "../db/prisma/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("NotificationRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("성공적으로 알림 목록을 조회한다", async () => {
      // Setup
      const mockNotifications = [
        {
          id: "notification-1",
          actionId: "action-1",
          userId: "user-1",
          type: "ESTIMATE_REQUEST_ARRIVED",
          title: "새로운 견적 요청",
          content: "테스트 알림 1",
          isRead: false,
        },
        {
          id: "notification-2",
          actionId: "action-2",
          userId: "user-1",
          type: "ESTIMATE_ARRIVED",
          title: "견적이 도착했습니다",
          content: "테스트 알림 2",
          isRead: true,
        },
      ];

      (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(
        mockNotifications
      );
      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(2);

      // Exercise
      const result = await notificationRepository.getNotifications(
        "user-1",
        10,
        0
      );

      // Assertion
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
      expect(result).toEqual({
        items: mockNotifications,
        total: 2,
        limit: 10,
        offset: 0,
      });
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Prisma 에러");
      (mockPrisma.notification.findMany as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        notificationRepository.getNotifications("user-1", 10, 0)
      ).rejects.toThrow("Prisma 에러");
    });
  });

  describe("hasUnreadNotification", () => {
    it("안읽은 알림이 있으면 true를 반환한다", async () => {
      // Setup
      (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue({
        id: "notification-1",
      });

      // Exercise
      const result =
        await notificationRepository.hasUnreadNotification("user-1");

      // Assertion
      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-1", isRead: false },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it("안읽은 알림이 없으면 false를 반환한다", async () => {
      // Setup
      (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      // Exercise
      const result =
        await notificationRepository.hasUnreadNotification("user-1");

      // Assertion
      expect(result).toBe(false);
    });
  });

  describe("readNotification", () => {
    it("성공적으로 알림을 읽음 처리한다", async () => {
      // Setup
      const mockNotification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        type: "ESTIMATE_REQUEST_ARRIVED",
        title: "새로운 견적 요청",
        content: "테스트 알림 1",
        isRead: true,
      };
      (mockPrisma.notification.update as jest.Mock).mockResolvedValue(
        mockNotification
      );

      // Exercise
      const result =
        await notificationRepository.readNotification("notification-1");

      // Assertion
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notification-1" },
        data: { isRead: true },
      });
      expect(result).toEqual(mockNotification);
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Prisma 에러");
      (mockPrisma.notification.update as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        notificationRepository.readNotification("notification-1")
      ).rejects.toThrow("Prisma 에러");
    });
  });

  describe("readAllNotifications", () => {
    it("성공적으로 모든 알림을 읽음 처리한다", async () => {
      // Setup
      const mockResult = { count: 5 };
      (mockPrisma.notification.updateMany as jest.Mock).mockResolvedValue(
        mockResult
      );

      // Exercise
      const result =
        await notificationRepository.readAllNotifications("user-1");

      // Assertion
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isRead: false },
        data: { isRead: true },
      });
      expect(result).toEqual(5);
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Prisma 에러");
      (mockPrisma.notification.updateMany as jest.Mock).mockRejectedValue(
        error
      );

      // Exercise & Assertion
      await expect(
        notificationRepository.readAllNotifications("user-1")
      ).rejects.toThrow("Prisma 에러");
    });
  });
});
