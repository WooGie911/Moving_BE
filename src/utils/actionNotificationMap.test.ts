import { Action, UserType } from "@prisma/client";
import { actionNotificationMap } from "./actionNotificationMap";

// Prisma 모듈을 모킹
jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    estimateRequest: {
      findUnique: jest.fn(),
    },
    estimate: {
      findUnique: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from "../db/prisma/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("ActionNotificationMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("WELCOME 액션", () => {
    it("회원가입 환영 알림을 생성한다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "WELCOME",
        userId: "user-1",
        entityId: "user-1",
        entityType: "User",
        description: "회원가입 환영",
        metadata: { userType: "CUSTOMER" },
        createdAt: new Date(),
        deletedAt: null,
      };

      // Exercise
      const mapping = actionNotificationMap.WELCOME;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(receivers).toEqual([{ id: "user-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        title: '<span class="font-bold">회원가입</span>을 환영합니다!',
        content: "서비스 이용을 시작해보세요.",
        path: "/",
      });
    });
  });

  describe("ESTIMATE_REQUEST_CREATE 액션", () => {
    it("지역 기반으로 기사님들에게 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "ESTIMATE_REQUEST_CREATE",
        userId: "customer-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "견적 요청 생성",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimateRequest = {
        id: "request-1",
        fromAddress: {
          region: "SEOUL",
        },
      };

      const mockMovers = [
        { id: "mover-1" },
        { id: "mover-2" },
        { id: "mover-3" },
      ];

      (mockPrisma.estimateRequest.findUnique as jest.Mock).mockResolvedValue(mockEstimateRequest as any);
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockMovers as any);

      // Exercise
      const mapping = actionNotificationMap.ESTIMATE_REQUEST_CREATE;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(mockPrisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: { id: "request-1" },
        select: { fromAddress: true },
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          userType: { has: "MOVER" },
          id: { not: "customer-1" },
          currentAreas: { has: "SEOUL" },
        },
        select: { id: true },
      });
      expect(receivers).toEqual([
        { id: "mover-1", userType: "MOVER" },
        { id: "mover-2", userType: "MOVER" },
        { id: "mover-3", userType: "MOVER" },
      ]);
      expect(message).toEqual({
        title: "새 견적 요청이 등록되었습니다.",
        content: "새로운 견적 요청이 등록되었습니다.",
        path: `/estimate/received`,
      });
    });

    it("지역 정보가 없으면 모든 기사님에게 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "ESTIMATE_REQUEST_CREATE",
        userId: "customer-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "견적 요청 생성",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimateRequest = {
        id: "request-1",
        fromAddress: null,
      };

      const mockMovers = [
        { id: "mover-1" },
        { id: "mover-2" },
      ];

      (mockPrisma.estimateRequest.findUnique as jest.Mock).mockResolvedValue(mockEstimateRequest as any);
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockMovers as any);

      // Exercise
      const mapping = actionNotificationMap.ESTIMATE_REQUEST_CREATE;
      const receivers = await mapping.getReceivers(action);

      // Assertion
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          userType: { has: "MOVER" },
          id: { not: "customer-1" },
        },
        select: { id: true },
      });
      expect(receivers).toEqual([
        { id: "mover-1", userType: "MOVER" },
        { id: "mover-2", userType: "MOVER" },
      ]);
    });
  });

  describe("ESTIMATE_SUBMITTED 액션", () => {
    it("견적 요청자에게 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "ESTIMATE_SUBMITTED",
        userId: "mover-1",
        entityId: "estimate-1",
        entityType: "Estimate",
        description: "견적 제출",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate-1",
        estimateRequest: {
          userId: "customer-1",
        },
      };

      (mockPrisma.estimate.findUnique as jest.Mock).mockResolvedValue(mockEstimate as any);

      // Exercise
      const mapping = actionNotificationMap.ESTIMATE_SUBMITTED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(mockPrisma.estimate.findUnique).toHaveBeenCalledWith({
        where: { id: "estimate-1" },
        select: { estimateRequest: { select: { userId: true } } },
      });
      expect(receivers).toEqual([{ id: "customer-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        title: "새 견적이 도착했습니다!",
        content: "새로운 견적이 도착했습니다. 확인해보세요.",
        path: `/estimateRequests/${action.entityId}`,
      });
    });
  });

  describe("ESTIMATE_ACCEPTED 액션", () => {
    it("견적 제출자에게 수락 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "ESTIMATE_ACCEPTED",
        userId: "customer-1",
        entityId: "estimate-1",
        entityType: "Estimate",
        description: "견적 수락",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate-1",
        userId: "mover-1",
      };

      (mockPrisma.estimate.findUnique as jest.Mock).mockResolvedValue(mockEstimate as any);

      // Exercise
      const mapping = actionNotificationMap.ESTIMATE_ACCEPTED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(mockPrisma.estimate.findUnique).toHaveBeenCalledWith({
        where: { id: "estimate-1" },
        select: { userId: true },
      });
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        title: "견적이 수락되었습니다!",
        content: "고객님이 견적을 수락했습니다.",
        path: `/estimates/${action.entityId}`,
      });
    });
  });

  describe("ESTIMATE_REJECTED 액션", () => {
    it("견적 제출자에게 거절 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "ESTIMATE_REJECTED",
        userId: "customer-1",
        entityId: "estimate-1",
        entityType: "Estimate",
        description: "견적 거절",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate-1",
        userId: "mover-1",
      };

      (mockPrisma.estimate.findUnique as jest.Mock).mockResolvedValue(mockEstimate as any);

      // Exercise
      const mapping = actionNotificationMap.ESTIMATE_REJECTED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        title: "견적이 거절되었습니다.",
        content: "고객님이 견적을 거절했습니다.",
        path: `/estimates/${action.entityId}`,
      });
    });
  });

  describe("REVIEW_SUBMITTED 액션", () => {
    it("리뷰 대상자에게 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "REVIEW_SUBMITTED",
        userId: "customer-1",
        entityId: "review-1",
        entityType: "Review",
        description: "리뷰 작성",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockReview = {
        id: "review-1",
        receiverId: "mover-1",
      };

      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview as any);

      // Exercise
      const mapping = actionNotificationMap.REVIEW_SUBMITTED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(mockPrisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: "review-1" },
        select: { receiverId: true },
      });
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        title: "새 리뷰가 작성되었습니다!",
        content: "고객님이 리뷰를 작성했습니다.",
        path: `/reviews/${action.entityId}`,
      });
    });
  });

  describe("FAVORITE_ADDED 액션", () => {
    it("찜 대상자에게 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "FAVORITE_ADDED",
        userId: "customer-1",
        entityId: "favorite-1",
        entityType: "Favorite",
        description: "찜 추가",
        metadata: { targetUserId: "mover-1" },
        createdAt: new Date(),
        deletedAt: null,
      };

      // Exercise
      const mapping = actionNotificationMap.FAVORITE_ADDED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        title: "새로운 찜이 추가되었습니다!",
        content: "고객님이 당신을 찜했습니다.",
        path: `/profile/${(action.metadata as any).targetUserId}`,
      });
    });
  });

  describe("FAVORITE_REMOVED 액션", () => {
    it("찜 제거 대상자에게 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "FAVORITE_REMOVED",
        userId: "customer-1",
        entityId: "favorite-1",
        entityType: "Favorite",
        description: "찜 제거",
        metadata: { targetUserId: "mover-1" },
        createdAt: new Date(),
        deletedAt: null,
      };

      // Exercise
      const mapping = actionNotificationMap.FAVORITE_REMOVED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        title: "찜이 제거되었습니다.",
        content: "고객님이 찜을 제거했습니다.",
        path: `/profile/${(action.metadata as any).targetUserId}`,
      });
    });
  });

  describe("MOVE_DAY_REMINDER_TOMORROW 액션", () => {
    it("이사 전날 고객에게 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "MOVE_DAY_REMINDER_TOMORROW",
        userId: "customer-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "이사 전날 알림",
        metadata: { moveType: "HOME" },
        createdAt: new Date(),
        deletedAt: null,
      };

      // Exercise
      const mapping = actionNotificationMap.MOVE_DAY_REMINDER_TOMORROW;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(receivers).toEqual([{ id: "customer-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        title: "내일이 이사 날입니다!",
        content: "내일 가정이사가 예정되어 있습니다. 준비하세요.",
        path: `/estimateRequests/${action.entityId}`,
      });
    });
  });

  describe("MOVE_DAY_REMINDER_TODAY 액션", () => {
    it("이사 당일 고객에게 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "MOVE_DAY_REMINDER_TODAY",
        userId: "customer-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "이사 당일 알림",
        metadata: { moveType: "HOME" },
        createdAt: new Date(),
        deletedAt: null,
      };

      // Exercise
      const mapping = actionNotificationMap.MOVE_DAY_REMINDER_TODAY;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(receivers).toEqual([{ id: "customer-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        title: "오늘이 이사 날입니다!",
        content: "오늘 가정이사가 진행됩니다. 기사님이 곧 도착합니다.",
        path: `/estimateRequests/${action.entityId}`,
      });
    });
  });

  describe("MOVE_DAY_REVIEW_REQUEST 액션", () => {
    it("이사 다음날 고객에게 리뷰 요청 알림을 보낸다", async () => {
      // Setup
      const action: Action = {
        id: "action-1",
        type: "MOVE_DAY_REVIEW_REQUEST",
        userId: "customer-1",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "리뷰 요청",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      // Exercise
      const mapping = actionNotificationMap.MOVE_DAY_REVIEW_REQUEST;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(receivers).toEqual([{ id: "customer-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        title: "이사 후기를 작성해주세요!",
        content: "이사 서비스에 대한 후기를 작성해주세요.",
        path: `/estimateRequests/${action.entityId}/review`,
      });
    });
  });
}); 