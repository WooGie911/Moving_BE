import { ActionType } from "@prisma/client";
import ActionService from "./action.service";

// 레포지토리 모듈 전체를 모킹
jest.mock("../repositories/action.repository", () => ({
  createAction: jest.fn(),
}));

import actionRepository from "../repositories/action.repository";
const mockRepository = actionRepository as jest.Mocked<typeof actionRepository>;

describe("ActionService", () => {
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

      mockRepository.createAction.mockResolvedValue(mockAction as any);

      // Exercise
      const result = await ActionService.createAction(
        "user-1",
        "ESTIMATE_REQUEST_CREATE",
        "request-1",
        "EstimateRequest",
        { price: 100000 }
      );

      // Assertion
      expect(mockRepository.createAction).toHaveBeenCalledWith({
        userId: "user-1",
        type: "ESTIMATE_REQUEST_CREATE",
        entityId: "request-1",
        entityType: "EstimateRequest",
        metadata: { price: 100000 },
      });
      expect(result).toEqual(mockAction);
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.createAction.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        ActionService.createAction(
          "user-1",
          "ESTIMATE_REQUEST_CREATE",
          "request-1",
          "EstimateRequest",
          { price: 100000 }
        )
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.createAction).toHaveBeenCalledWith({
        userId: "user-1",
        type: "ESTIMATE_REQUEST_CREATE",
        entityId: "request-1",
        entityType: "EstimateRequest",
        metadata: { price: 100000 },
      });
    });
  });
});
