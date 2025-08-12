import { UserType, NotificationType } from "@prisma/client";
import notificationRepository from "./notification.repository";

// Prisma 모듈을 모킹
jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

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
          userType: "CUSTOMER" as UserType,
          type: "ESTIMATE_STATUS_UPDATED" as NotificationType,
          messageKo: "<span class=\"font-bold\">성민기사</span> 기사님의 견적이 <span class=\"text-primary-400 font-bold\">확정</span>되었어요.",
          messageEn: "<span class=\"font-bold\">성민기사</span> mover's estimate has been <span class=\"text-primary-400 font-bold\">confirmed</span>.",
          messageZh: "<span class=\"font-bold\">성민기사</span> 搬家师傅的估价已 <span class=\"text-primary-400 font-bold\">确定</span>。",
          path: "/estimateRequest/pending/test-id",
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
          type: "WELCOME" as NotificationType,
          messageKo: "<span class=\"font-bold\">회원가입</span>을 환영합니다!",
          messageEn: "<span class=\"font-bold\">Registration</span> welcome!",
          messageZh: "<span class=\"font-bold\">注册</span>欢迎！",
          path: "/",
          isRead: true,
          createdAt: new Date("2024-01-02T00:00:00Z"),
          updatedAt: new Date("2024-01-02T00:00:00Z"),
          deletedAt: null,
        },
      ];

      (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(2);

      // Exercise
      const result = await notificationRepository.getNotifications(
        "CUSTOMER" as UserType,
        "user-1",
        10,
        0
      );

      // Assertion
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userType: "CUSTOMER", userId: "user-1" },
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

    it("페이지네이션을 올바르게 적용한다", async () => {
      // Setup
      const mockNotifications = [
        {
          id: "notification-3",
          actionId: "action-3",
          userId: "user-1",
          userType: "CUSTOMER" as UserType,
          type: "ESTIMATE_STATUS_UPDATED" as NotificationType,
          messageKo: "<span class=\"font-bold\">김철수</span> 기사님의 견적이 <span class=\"text-primary-400 font-bold\">반려</span>되었어요.",
          messageEn: "<span class=\"font-bold\">김철수</span> mover's estimate has been <span class=\"text-primary-400 font-bold\">rejected</span>.",
          messageZh: "<span class=\"font-bold\">김철수</span> 搬家师傅的估价已 <span class=\"text-primary-400 font-bold\">拒绝</span>。",
          path: null,
          isRead: false,
          createdAt: new Date("2024-01-03T00:00:00Z"),
          updatedAt: new Date("2024-01-03T00:00:00Z"),
          deletedAt: null,
        },
      ];

      (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(3);

      // Exercise
      const result = await notificationRepository.getNotifications(
        "CUSTOMER" as UserType,
        "user-1",
        1,
        2
      );

      // Assertion
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userType: "CUSTOMER", userId: "user-1" },
        orderBy: { createdAt: "desc" },
        skip: 2,
        take: 1,
      });
      expect(result).toEqual({
        items: mockNotifications,
        total: 3,
        limit: 1,
        offset: 2,
      });
    });

    it("다양한 사용자 타입에 대해 올바르게 조회한다", async () => {
      // Setup
      const userTypes: UserType[] = ["CUSTOMER", "MOVER"];
      const mockNotifications = [
        {
          id: "notification-1",
          actionId: "action-1",
          userId: "user-1",
          userType: "MOVER" as UserType,
          type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
          title: "새로운 견적 요청",
          content: "테스트 알림",
          path: null,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(1);

      // Exercise & Assertion
      for (const userType of userTypes) {
        await notificationRepository.getNotifications(userType, "user-1", 10, 0);

        expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
          where: { userType, userId: "user-1" },
          orderBy: { createdAt: "desc" },
          skip: 0,
          take: 10,
        });
      }
    });
  });

  describe("hasUnreadNotification", () => {
    it("안읽은 알림이 있으면 true를 반환한다", async () => {
      // Setup
      const mockUnreadNotification = {
        id: "notification-1",
      };

      (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(mockUnreadNotification as any);

      // Exercise
      const result = await notificationRepository.hasUnreadNotification(
        "CUSTOMER" as UserType,
        "user-1"
      );

      // Assertion
      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: { userType: "CUSTOMER", userId: "user-1", isRead: false },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it("안읽은 알림이 없으면 false를 반환한다", async () => {
      // Setup
      (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      // Exercise
      const result = await notificationRepository.hasUnreadNotification(
        "CUSTOMER" as UserType,
        "user-1"
      );

      // Assertion
      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: { userType: "CUSTOMER", userId: "user-1", isRead: false },
        select: { id: true },
      });
      expect(result).toBe(false);
    });

    it("다양한 사용자 타입에 대해 올바르게 확인한다", async () => {
      // Setup
      const userTypes: UserType[] = ["CUSTOMER", "MOVER"];
      (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      // Exercise & Assertion
      for (const userType of userTypes) {
        await notificationRepository.hasUnreadNotification(userType, "user-1");

        expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
          where: { userType, userId: "user-1", isRead: false },
          select: { id: true },
        });
      }
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
        messageKo: "새로운 견적 요청",
        messageEn: "New estimate request",
        messageZh: "新估价请求",
        path: null,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockUpdatedNotification = {
        ...mockNotification,
        isRead: true,
      };

      (mockPrisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
      (mockPrisma.notification.update as jest.Mock).mockResolvedValue(mockUpdatedNotification);

      // Exercise
      const result = await notificationRepository.readNotification("notification-1");

      // Assertion
      expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: "notification-1" },
      });
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notification-1" },
        data: { isRead: true },
      });
      expect(result).toEqual(mockUpdatedNotification);
    });

    it("존재하지 않는 알림 ID에 대해 에러를 던진다", async () => {
      // Setup
      (mockPrisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

      // Exercise & Assertion
      await expect(
        notificationRepository.readNotification("non-existent-id")
      ).rejects.toThrow("해당 알림을 찾을수 없습니다");
      expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-id" },
      });
    });
  });

  describe("readAllNotifications", () => {
    it("성공적으로 모든 알림을 읽음 처리한다", async () => {
      // Setup
      const mockUpdateResult = { count: 5 };
      (mockPrisma.notification.updateMany as jest.Mock).mockResolvedValue(mockUpdateResult as any);

      // Exercise
      const result = await notificationRepository.readAllNotifications("user-1");

      // Assertion
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isRead: false },
        data: { isRead: true },
      });
      expect(result).toBe(5);
    });

    it("읽음 처리할 알림이 없으면 0을 반환한다", async () => {
      // Setup
      const mockUpdateResult = { count: 0 };
      (mockPrisma.notification.updateMany as jest.Mock).mockResolvedValue(mockUpdateResult as any);

      // Exercise
      const result = await notificationRepository.readAllNotifications("user-1");

      // Assertion
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isRead: false },
        data: { isRead: true },
      });
      expect(result).toBe(0);
    });

    it("다양한 사용자에 대해 올바르게 처리한다", async () => {
      // Setup
      const userIds = ["user-1", "user-2", "user-3"];
      const mockUpdateResult = { count: 1 };
      (mockPrisma.notification.updateMany as jest.Mock).mockResolvedValue(mockUpdateResult as any);

      // Exercise & Assertion
      for (const userId of userIds) {
        await notificationRepository.readAllNotifications(userId);

        expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
      }
    });
  });
});
