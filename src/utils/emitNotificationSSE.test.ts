import { Notification, NotificationType, UserType } from "@prisma/client";
import { emitNotificationSSE } from "./emitNotificationSSE";

// Prisma 모듈을 모킹
jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    notification: {
      count: jest.fn(),
    },
  },
}));

// Sentry 유틸리티를 모킹
jest.mock("./sentryUtils", () => ({
  captureSSEError: jest.fn(),
}));

import prisma from "../db/prisma/prisma";
import { captureSSEError } from "./sentryUtils";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCaptureSSEError = captureSSEError as jest.MockedFunction<
  typeof captureSSEError
>;

describe("EmitNotificationSSE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // sseClients 초기화
    const { sseClients } = require("./emitNotificationSSE");
    sseClients.clear();
  });

  afterEach(() => {
    // sseClients 정리
    const { sseClients } = require("./emitNotificationSSE");
    sseClients.clear();
  });

  describe("emitNotificationSSE", () => {
    it("클라이언트가 연결되어 있으면 알림을 전송한다", async () => {
      // Setup
      const userId = "user-1";
      const notification: Notification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        userType: "CUSTOMER" as UserType,
        type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
        messageKo: "새로운 견적 요청",
        messageEn: "New estimate request",
        messageZh: "新估价请求",
        path: "/estimates",
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockClient = {
        write: jest.fn(),
      };

      // sseClients를 직접 모킹
      const { sseClients } = require("./emitNotificationSSE");
      sseClients.clear();
      sseClients.set(userId, mockClient);

      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(3);

      // Exercise
      await emitNotificationSSE(userId, notification);

      // Assertion
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          isRead: false,
        },
      });

      expect(mockClient.write).toHaveBeenCalledWith("event: notification\n");
      expect(mockClient.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({
          notification,
          unreadCount: 3,
          hasUnread: true,
        })}\n\n`
      );

      // 정리
      sseClients.delete(userId);
    });

    it("클라이언트가 연결되어 있지 않으면 아무것도 하지 않는다", async () => {
      // Setup
      const userId = "user-1";
      const notification: Notification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        userType: "CUSTOMER" as UserType,
        type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
        messageKo: "새로운 견적 요청",
        messageEn: "New estimate request",
        messageZh: "新估价请求",
        path: "/estimates",
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Exercise
      await emitNotificationSSE(userId, notification);

      // Assertion
      expect(mockPrisma.notification.count).not.toHaveBeenCalled();
    });

    it("안읽은 알림이 없으면 hasUnread가 false로 설정된다", async () => {
      // Setup
      const userId = "user-1";
      const notification: Notification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        userType: "CUSTOMER" as UserType,
        type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
        messageKo: "새로운 견적 요청",
        messageEn: "New estimate request",
        messageZh: "新估价请求",
        path: "/estimates",
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockClient = {
        write: jest.fn(),
      };

      // sseClients에 클라이언트 추가
      const { sseClients } = require("./emitNotificationSSE");
      sseClients.set(userId, mockClient);

      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(0);

      // Exercise
      await emitNotificationSSE(userId, notification);

      // Assertion
      expect(mockClient.write).toHaveBeenCalledWith("event: notification\n");
      expect(mockClient.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({
          notification,
          unreadCount: 0,
          hasUnread: false,
        })}\n\n`
      );
    });

    it("에러 발생 시 Sentry에 에러를 캡처한다", async () => {
      // Setup
      const userId = "user-1";
      const notification: Notification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        userType: "CUSTOMER" as UserType,
        type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
        messageKo: "새로운 견적 요청",
        messageEn: "New estimate request",
        messageZh: "新估价请求",
        path: "/estimates",
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockClient = {
        write: jest.fn(),
      };

      // sseClients에 클라이언트 추가
      const { sseClients } = require("./emitNotificationSSE");
      sseClients.set(userId, mockClient);

      (mockPrisma.notification.count as jest.Mock).mockRejectedValue(new Error("DB 에러"));

      // Exercise
      await expect(emitNotificationSSE(userId, notification)).rejects.toThrow("DB 에러");

      // Assertion
      expect(mockCaptureSSEError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          operation: "emit_notification_sse",
          userId: "user-1",
          notificationId: "notification-1",
        }
      );
    });

    it("클라이언트 write 에러 시 Sentry에 에러를 캡처한다", async () => {
      // Setup
      const userId = "user-1";
      const notification: Notification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        userType: "CUSTOMER" as UserType,
        type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
        messageKo: "새로운 견적 요청",
        messageEn: "New estimate request",
        messageZh: "新估价请求",
        path: "/estimates",
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockClient = {
        write: jest.fn().mockImplementation(() => {
          throw new Error("Write 에러");
        }),
      };

      // sseClients에 클라이언트 추가
      const { sseClients } = require("./emitNotificationSSE");
      sseClients.set(userId, mockClient);

      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(1);

      // Exercise
      await expect(emitNotificationSSE(userId, notification)).rejects.toThrow("Write 에러");

      // Assertion
      expect(mockCaptureSSEError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          operation: "emit_notification_sse",
          userId: "user-1",
          notificationId: "notification-1",
        }
      );
    });

    it("다양한 알림 타입에 대해 올바른 페이로드를 전송한다", async () => {
      // Setup
      const userId = "user-1";
      const notificationTypes: NotificationType[] = [
        "WELCOME",
        "ESTIMATE_REQUEST_ARRIVED",
        "ESTIMATE_ARRIVED",
        "ESTIMATE_STATUS_UPDATED",
        "DESIGNATED_ESTIMATE_REQUEST_ARRIVED",
        "DESIGNATED_ESTIMATE_ARRIVED",
        "DESIGNATED_ESTIMATE_STATUS_UPDATED",
        "REVIEW_EVENT",
        "FAVORITE_EVENT",
        "MOVE_DAY_REMINDER",
      ];

      const mockClient = {
        write: jest.fn(),
      };

      // sseClients에 클라이언트 추가
      const { sseClients } = require("./emitNotificationSSE");
      sseClients.set(userId, mockClient);

      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(1);

      // Exercise & Assertion
      for (const type of notificationTypes) {
        const notification: Notification = {
          id: `notification-${type}`,
          actionId: "action-1",
          userId: "user-1",
          userType: "CUSTOMER" as UserType,
          type,
          messageKo: `${type} 알림`,
          messageEn: `${type} notification`,
          messageZh: `${type} 通知`,
          path: "/test",
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        await emitNotificationSSE(userId, notification);

        expect(mockClient.write).toHaveBeenCalledWith("event: notification\n");
        expect(mockClient.write).toHaveBeenCalledWith(
          `data: ${JSON.stringify({
            notification,
            unreadCount: 1,
            hasUnread: true,
          })}\n\n`
        );
      }
    });

    it("다양한 사용자 타입에 대해 올바른 페이로드를 전송한다", async () => {
      // Setup
      const userTypes: UserType[] = ["CUSTOMER", "MOVER"];
      const mockClient = {
        write: jest.fn(),
      };

      // sseClients에 클라이언트 추가
      const { sseClients } = require("./emitNotificationSSE");
      sseClients.set("user-1", mockClient);

      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(1);

      // Exercise & Assertion
      for (const userType of userTypes) {
        const notification: Notification = {
          id: `notification-${userType}`,
          actionId: "action-1",
          userId: "user-1",
          userType,
          type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
          messageKo: `${userType} 알림`,
          messageEn: `${userType} notification`,
          messageZh: `${userType} 通知`,
          path: "/test",
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        await emitNotificationSSE("user-1", notification);

        expect(mockClient.write).toHaveBeenCalledWith("event: notification\n");
        expect(mockClient.write).toHaveBeenCalledWith(
          `data: ${JSON.stringify({
            notification,
            unreadCount: 1,
            hasUnread: true,
          })}\n\n`
        );
      }
    });
  });
}); 