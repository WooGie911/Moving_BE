import { Request, Response } from "express";
import { ReviewStatus } from "@prisma/client";
import ReviewController from "./review.controller";

// 테스트용 Request 타입 정의
interface TestRequest extends Omit<Request, 'user'> {
  user?: {
    userId: string;
    name: string;
    userType: "CUSTOMER" | "MOVER";
    hasProfile: boolean;
  };
}

// 서비스 모듈 전체를 모킹
jest.mock("../services/review.service", () => ({
  postReview: jest.fn(),
  getWritableEstimateRequests: jest.fn(),
  getWrittenReviews: jest.fn(),
  getReceivedReviews: jest.fn(),
}));

import ReviewService from "../services/review.service";
const mockService = ReviewService as jest.Mocked<typeof ReviewService>;

describe("ReviewController", () => {
  let req: Partial<TestRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      user: {
        userId: "user-1",
        name: "test",
        userType: "CUSTOMER",
        hasProfile: true,
      },
      params: {},
      query: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("postReview", () => {
    it("성공적으로 리뷰를 작성한다", async () => {
      // Setup
      req.params = { reviewId: "review-1" };
      req.body = {
        rating: 5,
        content: "좋은 서비스였습니다.",
      };

      const mockReview = {
        id: "review-1",
        customerId: "user-1",
        moverId: "mover-1",
        estimateRequestId: "request-1",
        rating: 5,
        content: "좋은 서비스였습니다.",
        status: "PENDING" as ReviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockService.postReview.mockResolvedValue(mockReview as any);

      // Exercise
      await ReviewController.postReview(req as Request, res as Response, next);

      // Assertion
      expect(mockService.postReview).toHaveBeenCalledWith(
        "review-1",
        5,
        "좋은 서비스였습니다."
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "리뷰가 작성되었습니다.",
        data: mockReview,
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      req.params = { reviewId: "review-1" };
      req.body = {
        rating: 5,
        content: "좋은 서비스였습니다.",
      };

      const error = new Error("서비스 에러");
      mockService.postReview.mockRejectedValue(error);

      // Exercise
      await ReviewController.postReview(req as Request, res as Response, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getWritableEstimateRequests", () => {
    it("성공적으로 작성 가능한 요청 목록을 조회한다", async () => {
      // Setup
      const mockRequests = {
        items: [
          {
            id: "request-1",
            status: "COMPLETED",
            estimateRequestId: "request-1",
          },
          {
            id: "request-2",
            status: "COMPLETED",
            estimateRequestId: "request-2",
          },
        ],
        total: 2,
        page: 1,
        pageSize: 4,
      };

      mockService.getWritableEstimateRequests.mockResolvedValue(
        mockRequests as any
      );

      // Exercise
      await ReviewController.getWritableEstimateRequests(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.getWritableEstimateRequests).toHaveBeenCalledWith(
        "user-1",
        { page: 1, pageSize: 4 }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "리뷰 작성 가능한 견적 요청 리스트입니다.",
        data: mockRequests,
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      const error = new Error("서비스 에러");
      mockService.getWritableEstimateRequests.mockRejectedValue(error);

      // Exercise
      await ReviewController.getWritableEstimateRequests(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getWrittenReviews", () => {
    it("성공적으로 작성한 리뷰 목록을 조회한다", async () => {
      // Setup
      req.params = { customerId: "user-1" };
      const mockReviews = {
        items: [
          { id: "review-1", rating: 5, content: "좋은 서비스" },
          { id: "review-2", rating: 4, content: "괜찮은 서비스" },
        ],
        total: 2,
        page: 1,
        pageSize: 4,
      };

      mockService.getWrittenReviews.mockResolvedValue(mockReviews as any);

      // Exercise
      await ReviewController.getWrittenReviews(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.getWrittenReviews).toHaveBeenCalledWith("user-1", {
        page: 1,
        pageSize: 4,
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "내가 쓴 리뷰 목록입니다.",
        data: mockReviews,
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      req.params = { customerId: "user-1" };
      const error = new Error("서비스 에러");
      mockService.getWrittenReviews.mockRejectedValue(error);

      // Exercise
      await ReviewController.getWrittenReviews(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getReceivedReviews", () => {
    it("성공적으로 받은 리뷰 목록을 조회한다", async () => {
      // Setup
      req.params = { moverId: "user-1" };
      const mockReviews = {
        items: [
          { id: "review-1", rating: 5, content: "좋은 서비스" },
          { id: "review-2", rating: 4, content: "괜찮은 서비스" },
        ],
        total: 2,
        page: 1,
        pageSize: 5,
      };

      mockService.getReceivedReviews.mockResolvedValue(mockReviews as any);

      // Exercise
      await ReviewController.getReceivedReviews(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.getReceivedReviews).toHaveBeenCalledWith("user-1", {
        page: 1,
        pageSize: 5,
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "기사님 리뷰 목록입니다.",
        data: mockReviews,
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      req.params = { moverId: "user-1" };
      const error = new Error("서비스 에러");
      mockService.getReceivedReviews.mockRejectedValue(error);

      // Exercise
      await ReviewController.getReceivedReviews(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
