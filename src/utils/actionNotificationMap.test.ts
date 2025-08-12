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
    favorite: {
      findUnique: jest.fn(),
    },
    notification: {
      count: jest.fn(),
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
        messageKo: '<span class="font-bold">회원가입</span>을 환영합니다!',
        messageEn: '<span class="font-bold">Registration</span> welcome!',
        messageZh: '<span class="font-bold">注册</span>欢迎！',
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

      (mockPrisma.estimateRequest.findUnique as jest.Mock).mockResolvedValue(
        mockEstimateRequest as any
      );
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(
        mockMovers as any
      );

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
        messageKo: "새 견적 요청이 등록되었습니다.",
        messageEn: "New estimate request has been registered.",
        messageZh: "新估价请求已注册。",
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

      const mockMovers = [{ id: "mover-1" }, { id: "mover-2" }];

      (mockPrisma.estimateRequest.findUnique as jest.Mock).mockResolvedValue(
        mockEstimateRequest as any
      );
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(
        mockMovers as any
      );

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
        userId: "customer-1",
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

      (mockPrisma.estimate.findUnique as jest.Mock).mockResolvedValue(
        mockEstimate as any
      );

      // Exercise
      const mapping = actionNotificationMap.ESTIMATE_SUBMITTED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(receivers).toEqual([{ id: "customer-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        messageKo: "<span class=\"font-bold\"></span> 기사님의 <span class=\"text-primary-400 font-bold\">견적</span>이 도착했어요.",
        messageEn: "<span class=\"font-bold\"></span> mover's <span class=\"text-primary-400 font-bold\">estimate</span> has arrived.",
        messageZh: "<span class=\"font-bold\"></span> 搬家师傅的 <span class=\"text-primary-400 font-bold\">估价</span>已到达。",
        path: `/estimateRequest/pending/${action.entityId}`,
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
        entityType: "ESTIMATE",
        description: "견적 수락",
        metadata: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate-1",
        moverId: "mover-1",
        estimateRequestId: "request-1",
        estimateRequest: {
          customerId: "customer-1",
        },
      };

      (mockPrisma.estimate.findUnique as jest.Mock).mockResolvedValue(
        mockEstimate as any
      );

      // Exercise
      const mapping = actionNotificationMap.ESTIMATE_ACCEPTED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(receivers).toEqual([
        { id: "mover-1", userType: "MOVER" },
        { id: "customer-1", userType: "CUSTOMER" },
      ]);
      expect(message).toEqual({
        messageKo: "<span class=\"font-bold\"></span> 고객님의 견적이 <span class=\"text-primary-400 font-bold\">확정</span>되었어요.",
        messageEn: "<span class=\"font-bold\"></span> customer's estimate has been <span class=\"text-primary-400 font-bold\">confirmed</span>.",
        messageZh: "<span class=\"font-bold\"></span> 客户的估价已 <span class=\"text-primary-400 font-bold\">确定</span>。",
        path: `/estimate/request/${action.entityId}`,
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
        moverId: "mover-1",
      };

      (mockPrisma.estimate.findUnique as jest.Mock).mockResolvedValue(
        mockEstimate as any
      );

      // Exercise
      const mapping = actionNotificationMap.ESTIMATE_REJECTED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(mockPrisma.estimate.findUnique).toHaveBeenCalledWith({
        where: { id: "estimate-1" },
        select: { moverId: true },
      });
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        messageKo: "<span class=\"font-bold\"></span> 고객님의 <span class=\"text-primary-400 font-bold\">undefined</span>에 대한 견적이 <span class=\"text-primary-400 font-bold\">반려</span>되었어요.",
        messageEn: "<span class=\"font-bold\"></span> customer's <span class=\"text-primary-400 font-bold\">undefined</span> estimate has been <span class=\"text-primary-400 font-bold\">rejected</span>.",
        messageZh: "<span class=\"font-bold\"></span> 客户的 <span class=\"text-primary-400 font-bold\">undefined</span> 估价已 <span class=\"text-primary-400 font-bold\">拒绝</span>。",
        path: `/estimate/request/${action.entityId}`,
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
        moverId: "mover-1",
        estimateRequestId: "request-1",
      };

      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue(
        mockReview as any
      );

      // Exercise
      const mapping = actionNotificationMap.REVIEW_SUBMITTED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(mockPrisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: "review-1" },
        select: { moverId: true, estimateRequestId: true },
      });
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        messageKo: "리뷰가 등록되었어요.",
        messageEn: "Review has been registered.",
        messageZh: "评论已注册。",
        path: `/moverMyPage`,
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

      const mockFavorite = {
        id: "favorite-1",
        moverId: "mover-1",
      };

      (mockPrisma.favorite.findUnique as jest.Mock).mockResolvedValue(mockFavorite as any);

      // Exercise
      const mapping = actionNotificationMap.FAVORITE_ADDED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(mockPrisma.favorite.findUnique).toHaveBeenCalledWith({
        where: { id: "favorite-1" },
        select: { moverId: true },
      });
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        messageKo: "찜이 추가되었어요.",
        messageEn: "Favorite has been added.",
        messageZh: "收藏已添加。",
        path: `/moverMyPage`,
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

      const mockFavorite = {
        id: "favorite-1",
        moverId: "mover-1",
      };

      (mockPrisma.favorite.findUnique as jest.Mock).mockResolvedValue(mockFavorite as any);

      // Exercise
      const mapping = actionNotificationMap.FAVORITE_REMOVED;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "MOVER");

      // Assertion
      expect(mockPrisma.favorite.findUnique).toHaveBeenCalledWith({
        where: { id: "favorite-1" },
        select: { moverId: true },
      });
      expect(receivers).toEqual([{ id: "mover-1", userType: "MOVER" }]);
      expect(message).toEqual({
        messageKo: "찜이 제거되었어요.",
        messageEn: "Favorite has been removed.",
        messageZh: "收藏已移除。",
        path: `/moverMyPage`,
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
        entityType: "DESIGNATED_ESTIMATE_REQUEST",
        description: "이사 전날 알림",
        metadata: { moveType: "HOME" },
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimateRequest = {
        id: "request-1",
        customerId: "customer-1",
      };

      (mockPrisma.estimateRequest.findUnique as jest.Mock).mockResolvedValue(mockEstimateRequest);

      // Exercise
      const mapping = actionNotificationMap.MOVE_DAY_REMINDER_TOMORROW;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(receivers).toEqual([{ id: "customer-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        messageKo: "내일은 <span class=\"font-bold\">가정이사</span> 예정일이에요.",
        messageEn: "Tomorrow is the scheduled move date for <span class=\"font-bold\">Home Move</span>.",
        messageZh: "明天是 <span class=\"font-bold\">家庭搬家</span> 预定日期。",
        path: `/estimateRequest/pending/${action.entityId}`,
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
        entityType: "DESIGNATED_ESTIMATE_REQUEST",
        description: "이사 당일 알림",
        metadata: { moveType: "HOME" },
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimateRequest = {
        id: "request-1",
        customerId: "customer-1",
      };

      (mockPrisma.estimateRequest.findUnique as jest.Mock).mockResolvedValue(mockEstimateRequest);

      // Exercise
      const mapping = actionNotificationMap.MOVE_DAY_REMINDER_TODAY;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(receivers).toEqual([{ id: "customer-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        messageKo: "오늘은 <span class=\"font-bold\">가정이사</span> 예정일이에요.",
        messageEn: "Today is the scheduled move date for <span class=\"font-bold\">Home Move</span>.",
        messageZh: "今天是 <span class=\"font-bold\">家庭搬家</span> 预定日期。",
        path: `/estimateRequest/pending/${action.entityId}`,
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
        entityId: "estimate-1",
        entityType: "DESIGNATED_ESTIMATE",
        description: "리뷰 요청",
        metadata: { moverName: "김기사" },
        createdAt: new Date(),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate-1",
        estimateRequest: {
          customerId: "customer-1",
        },
      };

      (mockPrisma.estimate.findUnique as jest.Mock).mockResolvedValue(mockEstimate as any);

      // Exercise
      const mapping = actionNotificationMap.MOVE_DAY_REVIEW_REQUEST;
      const receivers = await mapping.getReceivers(action);
      const message = mapping.buildMessage(action, "CUSTOMER");

      // Assertion
      expect(receivers).toEqual([{ id: "customer-1", userType: "CUSTOMER" }]);
      expect(message).toEqual({
        messageKo: "이사는 어떠셨나요? <span class=\"text-primary-400 font-bold\">김기사</span> 기사님에 대한 <span class=\"font-bold\">리뷰</span>를 남겨주세요.",
        messageEn: "How was your move? Please leave a <span class=\"font-bold\">review</span> for <span class=\"text-primary-400 font-bold\">김기사</span> mover.",
        messageZh: "搬家如何？请为 <span class=\"text-primary-400 font-bold\">김기사</span> 搬家师傅留下 <span class=\"font-bold\">评论</span>。",
        path: `/reviews/writable?modal=write&reviewId=${action.entityId}`,
      });
    });
  });
});
