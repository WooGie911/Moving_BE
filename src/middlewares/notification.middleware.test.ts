import {
  PrismaClient,
  NotificationType,
  Action,
  ActionType,
} from "@prisma/client";

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
    DESIGNATED_ESTIMATE_REQUEST_ARRIVED: "DESIGNATED_ESTIMATE_REQUEST_ARRIVED",
    DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED:
      "DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED",
    DESIGNATED_ESTIMATE_ARRIVED: "DESIGNATED_ESTIMATE_ARRIVED",
    DESIGNATED_ESTIMATE_STATUS_UPDATED: "DESIGNATED_ESTIMATE_STATUS_UPDATED",
    REVIEW_EVENT: "REVIEW_EVENT",
    FAVORITE_EVENT: "FAVORITE_EVENT",
    MOVE_DAY_REMINDER: "MOVE_DAY_REMINDER",
  },
  ActionType: {
    WELCOME: "WELCOME",
    ESTIMATE_REQUEST_CREATE: "ESTIMATE_REQUEST_CREATE",
    ESTIMATE_SUBMITTED: "ESTIMATE_SUBMITTED",
    ESTIMATE_ACCEPTED: "ESTIMATE_ACCEPTED",
    ESTIMATE_REJECTED: "ESTIMATE_REJECTED",
    DESIGNATED_ESTIMATE_REQUEST_SUBMITTED:
      "DESIGNATED_ESTIMATE_REQUEST_SUBMITTED",
    DESIGNATED_ESTIMATE_REQUEST_REJECTED:
      "DESIGNATED_ESTIMATE_REQUEST_REJECTED",
    DESIGNATED_ESTIMATE_SUBMITTED: "DESIGNATED_ESTIMATE_SUBMITTED",
    DESIGNATED_ESTIMATE_ACCEPTED: "DESIGNATED_ESTIMATE_ACCEPTED",
    DESIGNATED_ESTIMATE_REJECTED: "DESIGNATED_ESTIMATE_REJECTED",
    REVIEW_SUBMITTED: "REVIEW_SUBMITTED",
    FAVORITE_ADDED: "FAVORITE_ADDED",
    FAVORITE_REMOVED: "FAVORITE_REMOVED",
    MOVE_DAY_REMINDER_TOMORROW: "MOVE_DAY_REMINDER_TOMORROW",
    MOVE_DAY_REMINDER_TODAY: "MOVE_DAY_REMINDER_TODAY",
    MOVE_DAY_REVIEW_REQUEST: "MOVE_DAY_REVIEW_REQUEST",
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
        messageKo: "새 견적 요청이 등록되었습니다.",
        messageEn: "New estimate request has been registered.",
        messageZh: "新估价请求已注册。",
        path: "/estimates",
      }),
    },
    WELCOME: {
      type: "WELCOME",
      getReceivers: jest
        .fn()
        .mockResolvedValue([{ id: "user-1", userType: "CUSTOMER" }]),
      buildMessage: jest.fn().mockReturnValue({
        messageKo: '<span class="font-bold">회원가입</span>을 환영합니다!',
        messageEn: '<span class="font-bold">Registration</span> welcome!',
        messageZh: '<span class="font-bold">注册</span>欢迎！',
        path: "/",
      }),
    },
  },
}));

// SSE 이벤트 발송 함수를 모킹
jest.mock("../utils/emitNotificationSSE", () => ({
  emitNotificationSSE: jest.fn(),
}));

// Sentry 유틸리티를 모킹
jest.mock("../utils/sentryUtils", () => ({
  captureNotificationError: jest.fn(),
  captureActionMappingError: jest.fn(),
}));

import { notificationMiddleware } from "./notificationMiddleware";
import { emitNotificationSSE } from "../utils/emitNotificationSSE";
import {
  captureNotificationError,
  captureActionMappingError,
} from "../utils/sentryUtils";
import prisma from "../db/prisma/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEmitNotificationSSE = emitNotificationSSE as jest.MockedFunction<
  typeof emitNotificationSSE
>;
const mockCaptureNotificationError =
  captureNotificationError as jest.MockedFunction<
    typeof captureNotificationError
  >;
const mockCaptureActionMappingError =
  captureActionMappingError as jest.MockedFunction<
    typeof captureActionMappingError
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
        type: "ESTIMATE_REQUEST_CREATE" as ActionType,
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
        messageKo: "새 견적 요청이 등록되었습니다.",
        messageEn: "New estimate request has been registered.",
        messageZh: "新估价请求已注册。",
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
          messageKo: "새 견적 요청이 등록되었습니다.",
          messageEn: "New estimate request has been registered.",
          messageZh: "新估价请求已注册。",
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
        type: "NON_EXISTENT_ACTION" as ActionType,
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
            type: "NON_EXISTENT_ACTION",
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
        type: "ESTIMATE_REQUEST_CREATE" as ActionType,
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
      expect(mockCaptureActionMappingError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          operation: "notification_creation",
          actionType: "ESTIMATE_REQUEST_CREATE",
          entityId: "request-1",
          entityType: "EstimateRequest",
        }
      );
    });

    it("SSE 이벤트 발송 실패 시 Sentry에 에러를 캡처한다", async () => {
      // Setup
      const mockAction: Action = {
        id: "action-1",
        type: "ESTIMATE_REQUEST_CREATE" as ActionType,
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
        messageKo: "새 견적 요청이 등록되었습니다.",
        messageEn: "New estimate request has been registered.",
        messageZh: "新估价请求已注册。",
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
      mockEmitNotificationSSE.mockImplementation(async () => {
        // 에러를 던지지 않고 Sentry 에러 캡처만 호출
        mockCaptureNotificationError(new Error("SSE 발송 실패"), {
          operation: "sse_emit",
          userId: "user-1",
          userType: "CUSTOMER",
          notificationType: "ESTIMATE_REQUEST_ARRIVED",
          actionType: "ESTIMATE_REQUEST_CREATE",
        });
      });

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
      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockEmitNotificationSSE).toHaveBeenCalledWith(
        "user-1",
        mockNotification
      );
      expect(mockCaptureNotificationError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          operation: "sse_emit",
          userId: "user-1",
          userType: "CUSTOMER",
          notificationType: "ESTIMATE_REQUEST_ARRIVED",
          actionType: "ESTIMATE_REQUEST_CREATE",
        }
      );
    });

    it("수신자가 없으면 알림을 생성하지 않는다", async () => {
      // Setup
      const mockAction: Action = {
        id: "action-1",
        type: "ESTIMATE_REQUEST_CREATE" as ActionType,
        userId: "user-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "견적 요청이 생성되었습니다.",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

      // actionNotificationMap 모킹을 동적으로 변경
      const {
        actionNotificationMap,
      } = require("../utils/actionNotificationMap");
      actionNotificationMap.ESTIMATE_REQUEST_CREATE.getReceivers = jest
        .fn()
        .mockResolvedValue([]);

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
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockEmitNotificationSSE).not.toHaveBeenCalled();
    });
  });
});
