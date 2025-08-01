import { PrismaClient, ActionType } from "@prisma/client";

// PrismaClient를 모킹
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    action: {
      create: jest.fn(),
    },
  })),
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
  },
}));

import actionRepository from "./action.repository";
import prisma from "../db/prisma/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("ActionRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAction", () => {
    it("성공적으로 액션을 생성한다", async () => {
      // Setup
      const mockAction = {
        id: "action-1",
        userId: "user-1",
        type: "ESTIMATE_REQUEST_CREATE",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "견적 요청이 생성되었습니다.",
        metadata: { price: 100000 },
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

      // Exercise
      const result = await actionRepository.createAction({
        userId: "user-1",
        type: "ESTIMATE_REQUEST_CREATE",
        entityId: "request-1",
        entityType: "EstimateRequest",
        metadata: { price: 100000 },
      });

      // Assertion
      expect(mockPrisma.action.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          type: "ESTIMATE_REQUEST_CREATE",
          entityId: "request-1",
          entityType: "EstimateRequest",
          metadata: { price: 100000 },
        },
      });
      expect(result).toEqual(mockAction);
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Prisma 에러");
      (mockPrisma.action.create as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        actionRepository.createAction({
          userId: "user-1",
          type: "ESTIMATE_REQUEST_CREATE",
          entityId: "request-1",
          entityType: "EstimateRequest",
          metadata: { price: 100000 },
        })
      ).rejects.toThrow("Prisma 에러");
    });
  });

  describe("다양한 액션 타입별 테스트", () => {
    it("견적 요청 생성 액션을 생성한다", async () => {
      // Setup
      const mockAction = {
        id: "action-1",
        userId: "user-1",
        type: "ESTIMATE_REQUEST_CREATE",
        entityId: "request-1",
        entityType: "EstimateRequest",
        description: "견적 요청이 생성되었습니다.",
        metadata: { moveType: "RESIDENTIAL" },
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

      // Exercise
      const result = await actionRepository.createAction({
        userId: "user-1",
        type: "ESTIMATE_REQUEST_CREATE",
        entityId: "request-1",
        entityType: "EstimateRequest",
        metadata: { moveType: "RESIDENTIAL" },
      });

      // Assertion
      expect(mockPrisma.action.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          type: "ESTIMATE_REQUEST_CREATE",
          entityId: "request-1",
          entityType: "EstimateRequest",
          metadata: { moveType: "RESIDENTIAL" },
        },
      });
      expect(result).toEqual(mockAction);
    });

    it("견적 제출 액션을 생성한다", async () => {
      // Setup
      const mockAction = {
        id: "action-2",
        userId: "mover-1",
        type: "ESTIMATE_SUBMITTED",
        entityId: "estimate-1",
        entityType: "Estimate",
        description: "견적이 제출되었습니다.",
        metadata: { moverName: "김기사", price: 150000 },
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

      // Exercise
      const result = await actionRepository.createAction({
        userId: "mover-1",
        type: "ESTIMATE_SUBMITTED",
        entityId: "estimate-1",
        entityType: "Estimate",
        metadata: { moverName: "김기사", price: 150000 },
      });

      // Assertion
      expect(mockPrisma.action.create).toHaveBeenCalledWith({
        data: {
          userId: "mover-1",
          type: "ESTIMATE_SUBMITTED",
          entityId: "estimate-1",
          entityType: "Estimate",
          metadata: { moverName: "김기사", price: 150000 },
        },
      });
      expect(result).toEqual(mockAction);
    });

    it("견적 확정 액션을 생성한다", async () => {
      // Setup
      const mockAction = {
        id: "action-3",
        userId: "user-1",
        type: "ESTIMATE_ACCEPTED",
        entityId: "estimate-1",
        entityType: "Estimate",
        description: "견적이 확정되었습니다.",
        metadata: { moverName: "김기사", customerName: "이고객" },
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

      // Exercise
      const result = await actionRepository.createAction({
        userId: "user-1",
        type: "ESTIMATE_ACCEPTED",
        entityId: "estimate-1",
        entityType: "Estimate",
        metadata: { moverName: "김기사", customerName: "이고객" },
      });

      // Assertion
      expect(mockPrisma.action.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          type: "ESTIMATE_ACCEPTED",
          entityId: "estimate-1",
          entityType: "Estimate",
          metadata: { moverName: "김기사", customerName: "이고객" },
        },
      });
      expect(result).toEqual(mockAction);
    });

    it("리뷰 제출 액션을 생성한다", async () => {
      // Setup
      const mockAction = {
        id: "action-4",
        userId: "user-1",
        type: "REVIEW_SUBMITTED",
        entityId: "review-1",
        entityType: "Review",
        description: "리뷰가 제출되었습니다.",
        metadata: { rating: 5, content: "좋은 서비스" },
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

      // Exercise
      const result = await actionRepository.createAction({
        userId: "user-1",
        type: "REVIEW_SUBMITTED",
        entityId: "review-1",
        entityType: "Review",
        metadata: { rating: 5, content: "좋은 서비스" },
      });

      // Assertion
      expect(mockPrisma.action.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          type: "REVIEW_SUBMITTED",
          entityId: "review-1",
          entityType: "Review",
          metadata: { rating: 5, content: "좋은 서비스" },
        },
      });
      expect(result).toEqual(mockAction);
    });

    it("찜 추가 액션을 생성한다", async () => {
      // Setup
      const mockAction = {
        id: "action-5",
        userId: "user-1",
        type: "FAVORITE_ADDED",
        entityId: "favorite-1",
        entityType: "Favorite",
        description: "찜이 추가되었습니다.",
        metadata: { moverId: "mover-1" },
        createdAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

      // Exercise
      const result = await actionRepository.createAction({
        userId: "user-1",
        type: "FAVORITE_ADDED",
        entityId: "favorite-1",
        entityType: "Favorite",
        metadata: { moverId: "mover-1" },
      });

      // Assertion
      expect(mockPrisma.action.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          type: "FAVORITE_ADDED",
          entityId: "favorite-1",
          entityType: "Favorite",
          metadata: { moverId: "mover-1" },
        },
      });
      expect(result).toEqual(mockAction);
    });

         it("이사일 알림 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-6",
         userId: "user-1",
         type: "MOVE_DAY_REMINDER_TODAY",
         entityId: "estimate-1",
         entityType: "Estimate",
         description: "오늘 이사일입니다.",
         metadata: { moveType: "RESIDENTIAL" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "MOVE_DAY_REMINDER_TODAY",
         entityId: "estimate-1",
         entityType: "Estimate",
         metadata: { moveType: "RESIDENTIAL" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "MOVE_DAY_REMINDER_TODAY",
           entityId: "estimate-1",
           entityType: "Estimate",
           metadata: { moveType: "RESIDENTIAL" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("견적 반려 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-7",
         userId: "user-1",
         type: "ESTIMATE_REJECTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         description: "견적이 반려되었습니다.",
         metadata: { moveType: "RESIDENTIAL", customerName: "이고객" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "ESTIMATE_REJECTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         metadata: { moveType: "RESIDENTIAL", customerName: "이고객" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "ESTIMATE_REJECTED",
           entityId: "estimate-1",
           entityType: "Estimate",
           metadata: { moveType: "RESIDENTIAL", customerName: "이고객" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("지정 견적 요청 제출 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-8",
         userId: "user-1",
         type: "DESIGNATED_ESTIMATE_REQUEST_SUBMITTED",
         entityId: "request-1",
         entityType: "EstimateRequest",
         description: "지정 견적 요청이 제출되었습니다.",
         metadata: { customerName: "이고객" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "DESIGNATED_ESTIMATE_REQUEST_SUBMITTED",
         entityId: "request-1",
         entityType: "EstimateRequest",
         metadata: { customerName: "이고객" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "DESIGNATED_ESTIMATE_REQUEST_SUBMITTED",
           entityId: "request-1",
           entityType: "EstimateRequest",
           metadata: { customerName: "이고객" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("지정 견적 요청 반려 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-9",
         userId: "mover-1",
         type: "DESIGNATED_ESTIMATE_REQUEST_REJECTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         description: "지정 견적 요청이 반려되었습니다.",
         metadata: { moveType: "RESIDENTIAL" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "mover-1",
         type: "DESIGNATED_ESTIMATE_REQUEST_REJECTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         metadata: { moveType: "RESIDENTIAL" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "mover-1",
           type: "DESIGNATED_ESTIMATE_REQUEST_REJECTED",
           entityId: "estimate-1",
           entityType: "Estimate",
           metadata: { moveType: "RESIDENTIAL" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("지정 견적 제출 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-10",
         userId: "mover-1",
         type: "DESIGNATED_ESTIMATE_SUBMITTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         description: "지정 견적이 제출되었습니다.",
         metadata: { moverName: "김기사", moveType: "RESIDENTIAL" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "mover-1",
         type: "DESIGNATED_ESTIMATE_SUBMITTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         metadata: { moverName: "김기사", moveType: "RESIDENTIAL" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "mover-1",
           type: "DESIGNATED_ESTIMATE_SUBMITTED",
           entityId: "estimate-1",
           entityType: "Estimate",
           metadata: { moverName: "김기사", moveType: "RESIDENTIAL" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("지정 견적 확정 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-11",
         userId: "user-1",
         type: "DESIGNATED_ESTIMATE_ACCEPTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         description: "지정 견적이 확정되었습니다.",
         metadata: { moverName: "김기사", customerName: "이고객", moveType: "RESIDENTIAL" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "DESIGNATED_ESTIMATE_ACCEPTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         metadata: { moverName: "김기사", customerName: "이고객", moveType: "RESIDENTIAL" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "DESIGNATED_ESTIMATE_ACCEPTED",
           entityId: "estimate-1",
           entityType: "Estimate",
           metadata: { moverName: "김기사", customerName: "이고객", moveType: "RESIDENTIAL" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("지정 견적 반려 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-12",
         userId: "user-1",
         type: "DESIGNATED_ESTIMATE_REJECTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         description: "지정 견적이 반려되었습니다.",
         metadata: { customerName: "이고객", moveType: "RESIDENTIAL" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "DESIGNATED_ESTIMATE_REJECTED",
         entityId: "estimate-1",
         entityType: "Estimate",
         metadata: { customerName: "이고객", moveType: "RESIDENTIAL" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "DESIGNATED_ESTIMATE_REJECTED",
           entityId: "estimate-1",
           entityType: "Estimate",
           metadata: { customerName: "이고객", moveType: "RESIDENTIAL" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("찜 제거 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-13",
         userId: "user-1",
         type: "FAVORITE_REMOVED",
         entityId: "favorite-1",
         entityType: "Favorite",
         description: "찜이 제거되었습니다.",
         metadata: { moverId: "mover-1" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "FAVORITE_REMOVED",
         entityId: "favorite-1",
         entityType: "Favorite",
         metadata: { moverId: "mover-1" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "FAVORITE_REMOVED",
           entityId: "favorite-1",
           entityType: "Favorite",
           metadata: { moverId: "mover-1" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("내일 이사일 알림 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-14",
         userId: "user-1",
         type: "MOVE_DAY_REMINDER_TOMORROW",
         entityId: "estimate-1",
         entityType: "Estimate",
         description: "내일 이사일입니다.",
         metadata: { moveType: "RESIDENTIAL" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "MOVE_DAY_REMINDER_TOMORROW",
         entityId: "estimate-1",
         entityType: "Estimate",
         metadata: { moveType: "RESIDENTIAL" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "MOVE_DAY_REMINDER_TOMORROW",
           entityId: "estimate-1",
           entityType: "Estimate",
           metadata: { moveType: "RESIDENTIAL" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("리뷰 요청 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-15",
         userId: "user-1",
         type: "MOVE_DAY_REVIEW_REQUEST",
         entityId: "estimate-1",
         entityType: "Estimate",
         description: "리뷰를 작성해주세요.",
         metadata: { moverName: "김기사" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "MOVE_DAY_REVIEW_REQUEST",
         entityId: "estimate-1",
         entityType: "Estimate",
         metadata: { moverName: "김기사" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "MOVE_DAY_REVIEW_REQUEST",
           entityId: "estimate-1",
           entityType: "Estimate",
           metadata: { moverName: "김기사" },
         },
       });
       expect(result).toEqual(mockAction);
     });

     it("회원가입 환영 액션을 생성한다", async () => {
       // Setup
       const mockAction = {
         id: "action-16",
         userId: "user-1",
         type: "WELCOME",
         entityId: "user-1",
         entityType: "User",
         description: "회원가입을 환영합니다.",
         metadata: { userType: "CUSTOMER" },
         createdAt: new Date(),
         deletedAt: null,
       };

       (mockPrisma.action.create as jest.Mock).mockResolvedValue(mockAction);

       // Exercise
       const result = await actionRepository.createAction({
         userId: "user-1",
         type: "WELCOME",
         entityId: "user-1",
         entityType: "User",
         metadata: { userType: "CUSTOMER" },
       });

       // Assertion
       expect(mockPrisma.action.create).toHaveBeenCalledWith({
         data: {
           userId: "user-1",
           type: "WELCOME",
           entityId: "user-1",
           entityType: "User",
           metadata: { userType: "CUSTOMER" },
         },
       });
       expect(result).toEqual(mockAction);
     });
  });
});
