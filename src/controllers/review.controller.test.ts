import { Request, Response } from "express";
import { ReviewStatus } from "@prisma/client";
import ReviewController from "./review.controller";

// 테스트용 Request 타입 정의
interface TestRequest extends Omit<Request, "user"> {
  user?: {
    userId: string;
    name: string | null;
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
        status: "COMPLETED" as ReviewStatus,
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
        success: true,
        message: "리뷰 작성 가능한 견적 요청 리스트입니다.",
        data: {
          items: [
            {
              id: "request-1",
              reviewId: "review-1",
              status: "COMPLETED",
              mover: {
                id: "mover-1",
                profileImage: "https://.../profile.png",
                nickname: "김코드 기사님",
                shortIntro: "이사부터 정리까지 꼼꼼한 마무리!",
                detailIntro: "10년간 서울 지역에서 이사 서비스를 제공해온 베테랑 기사님입니다.",
              },
              moveType: "HOME",
              estimate: {
                id: "estimate-1",
                price: 180000,
                comment: "신속하고 안전한 이사 서비스",
                status: "ACCEPTED",
                isDesignated: true,
              },
            },
            {
              id: "request-2",
              reviewId: "review-2",
              status: "COMPLETED",
              mover: {
                id: "mover-2",
                profileImage: "https://.../profile2.png",
                nickname: "박이사 기사님",
                shortIntro: "사무실 이사 전문가입니다",
                detailIntro: "15년간 사무실 이사 경험을 바탕으로 안전하고 신속한 서비스를 제공합니다.",
              },
              moveType: "OFFICE",
              estimate: {
                id: "estimate-2",
                price: 250000,
                comment: "전문적인 사무실 이사 서비스",
                status: "ACCEPTED",
                isDesignated: false,
              },
            },
          ],
          total: 2,
          page: 1,
          pageSize: 4,
          hasNextPage: false,
          hasPrevPage: false,
        },
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
      expect(res.json).toHaveBeenCalledWith(mockRequests);
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
        success: true,
        message: "내가 쓴 리뷰 목록입니다.",
        data: {
          items: [
            { 
              id: "review-1", 
              rating: 5, 
              content: "좋은 서비스",
              status: "COMPLETED",
              mover: {
                id: "mover-1",
                profileImage: "https://.../profile.png",
                nickname: "김코드 기사님",
                shortIntro: "이사부터 정리까지 꼼꼼한 마무리!",
                detailIntro: "10년간 서울 지역에서 이사 서비스를 제공해온 베테랑 기사님입니다.",
              },
              moveType: "HOME",
              estimate: {
                id: "estimate-1",
                price: 180000,
                comment: "신속하고 안전한 이사 서비스",
                status: "ACCEPTED",
                isDesignated: true,
              },
              estimateRequest: {
                id: "request-1",
                status: "COMPLETED",
              },
            },
            { 
              id: "review-2", 
              rating: 4, 
              content: "괜찮은 서비스",
              status: "COMPLETED",
              mover: {
                id: "mover-2",
                profileImage: "https://.../profile2.png",
                nickname: "박이사 기사님",
                shortIntro: "사무실 이사 전문가입니다",
                detailIntro: "15년간 사무실 이사 경험을 바탕으로 안전하고 신속한 서비스를 제공합니다.",
              },
              moveType: "OFFICE",
              estimate: {
                id: "estimate-2",
                price: 250000,
                comment: "전문적인 사무실 이사 서비스",
                status: "ACCEPTED",
                isDesignated: false,
              },
              estimateRequest: {
                id: "request-2",
                status: "COMPLETED",
              },
            },
          ],
          total: 2,
          page: 1,
          pageSize: 4,
          hasNextPage: false,
          hasPrevPage: false,
        },
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
      expect(res.json).toHaveBeenCalledWith(mockReviews);
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
        success: true,
        message: "기사님 리뷰 목록입니다.",
        data: {
          items: [
            { 
              id: "review-1", 
              rating: 5, 
              content: "좋은 서비스",
              status: "COMPLETED",
              customer: {
                id: "customer-1",
                profileImage: "image1.jpg",
                nickname: "고객1",
                shortIntro: "깔끔한 이사를 원합니다",
                detailIntro: "신중하고 꼼꼼한 이사 서비스를 원하는 고객입니다.",
              },
              moveType: "HOME",
              estimate: {
                id: "estimate-1",
                price: 180000,
                comment: "신속하고 안전한 이사 서비스",
                status: "ACCEPTED",
                isDesignated: true,
              },
              estimateRequest: {
                id: "request-1",
                status: "COMPLETED",
              },
            },
            { 
              id: "review-2", 
              rating: 4, 
              content: "괜찮은 서비스",
              status: "COMPLETED",
              customer: {
                id: "customer-2",
                profileImage: "image2.jpg",
                nickname: "고객2",
                shortIntro: "안전한 이사를 원합니다",
                detailIntro: "신뢰할 수 있는 기사님과 함께하는 이사를 원하는 고객입니다.",
              },
              moveType: "OFFICE",
              estimate: {
                id: "estimate-2",
                price: 250000,
                comment: "전문적인 사무실 이사 서비스",
                status: "ACCEPTED",
                isDesignated: false,
              },
              estimateRequest: {
                id: "request-2",
                status: "COMPLETED",
              },
            },
          ],
          total: 2,
          page: 1,
          pageSize: 5,
          hasNextPage: false,
          hasPrevPage: false,
        },
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
      expect(res.json).toHaveBeenCalledWith(mockReviews);
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
