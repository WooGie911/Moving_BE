import { PrismaClient, NotificationType, Action } from "@prisma/client";

// PrismaClient를 모킹
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    action: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $use: jest.fn(),
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
    action: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $use: jest.fn(),
  },
}));

// actionNotificationMap을 모킹
jest.mock("../utils/actionNotificationMap", () => ({
  actionNotificationMap: {
    ESTIMATE_REQUEST_CREATE: {
      type: "ESTIMATE_REQUEST_ARRIVED",
      getReceivers: jest
        .fn()
        .mockResolvedValue([{ id: "user-1", userType: "CUSTOMER" }]),
      buildMessage: jest.fn().mockReturnValue({
        title: "새로운 견적 요청",
        content: "새로운 견적 요청이 생성되었습니다.",
        path: "/estimates",
      }),
    },
  },
}));

// SSE 이벤트 발송 함수를 모킹
jest.mock("../utils/emitNotificationSSE", () => ({
  emitNotificationSSE: jest.fn(),
}));

import { notificationMiddleware } from "./notificationMiddleware";
import { emitNotificationSSE } from "../utils/emitNotificationSSE";
import prisma from "../db/prisma/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEmitNotificationSSE = emitNotificationSSE as jest.MockedFunction<
  typeof emitNotificationSSE
>;

describe("NotificationMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Action 생성 시 알림 생성", () => {
    it("Action이 생성되면 알림을 생성하고 SSE 이벤트를 발송한다", async () => {
      // Setup
      const mockAction: Action = {
        id: "action-1",
        type: "ESTIMATE_REQUEST_CREATE",
        userId: "user-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "견적 요청이 생성되었습니다.",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockNotification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        userType: "CUSTOMER",
        type: "ESTIMATE_REQUEST_ARRIVED",
        title: "새로운 견적 요청",
        content: "새로운 견적 요청이 생성되었습니다.",
        path: "/estimates",
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);
      (mockPrisma.notification.create as jest.Mock).mockResolvedValue(
        mockNotification
      );

      // Exercise
      const params = {
        model: "Action" as any,
        action: "create" as any,
        args: {
          data: {
            type: "ESTIMATE_REQUEST_CREATE",
            userId: "user-1",
            entityId: "request-1",
            entityType: "EstimateRequest",
            description: "견적 요청이 생성되었습니다.",
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockAction);

      await notificationMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          userType: "CUSTOMER",
          actionId: "action-1",
          type: "ESTIMATE_REQUEST_ARRIVED",
          title: "새로운 견적 요청",
          content: "새로운 견적 요청이 생성되었습니다.",
          path: "/estimates",
        },
      });
      expect(mockEmitNotificationSSE).toHaveBeenCalledWith(
        "user-1",
        mockNotification
      );
    });

    it("Action 타입이 알림 매핑에 없으면 알림을 생성하지 않는다", async () => {
      // Setup
      const mockAction: Action = {
        id: "action-1",
        type: "WELCOME",
        userId: "user-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "알 수 없는 액션",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

      // Exercise
      const params = {
        model: "Action" as any,
        action: "create" as any,
        args: {
          data: {
            type: "WELCOME",
            userId: "user-1",
            entityId: "request-1",
            entityType: "EstimateRequest",
            description: "알 수 없는 액션",
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockAction);

      await notificationMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockEmitNotificationSSE).not.toHaveBeenCalled();
    });

    it("Action이 아닌 모델에서는 알림을 생성하지 않는다", async () => {
      // Setup
      const mockResult = { id: "user-1", name: "test" };

      // Exercise
      const params = {
        model: "User" as any,
        action: "create" as any,
        args: {
          data: {
            name: "test",
            email: "test@test.com",
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockResult);

      await notificationMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockEmitNotificationSSE).not.toHaveBeenCalled();
    });

    it("알림 생성 중 에러가 발생해도 Action 생성은 계속 진행된다", async () => {
      // Setup
      const mockAction: Action = {
        id: "action-1",
        type: "ESTIMATE_REQUEST_CREATE",
        userId: "user-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "견적 요청이 생성되었습니다.",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);
      (mockPrisma.notification.create as jest.Mock).mockRejectedValue(
        new Error("알림 생성 실패")
      );

      // Exercise
      const params = {
        model: "Action" as any,
        action: "create" as any,
        args: {
          data: {
            type: "ESTIMATE_REQUEST_CREATE",
            userId: "user-1",
            entityId: "request-1",
            entityType: "EstimateRequest",
            description: "견적 요청이 생성되었습니다.",
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockAction);

      await notificationMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockEmitNotificationSSE).not.toHaveBeenCalled();
    });
  });
});
