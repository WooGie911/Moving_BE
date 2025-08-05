import { PrismaClient } from "@prisma/client";

// PrismaClient를 모킹
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    estimateRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  })),
}));

import reviewRepository from "./review.repository";

describe("ReviewRepository", () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    // reviewRepository의 prisma를 mock으로 교체
    (reviewRepository as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("postReview", () => {
    it("성공적으로 리뷰를 작성한다", async () => {
      // Setup
      const mockReview = {
        id: "review-1",
        customerId: "user-1",
        moverId: "mover-1",
        estimateRequestId: "request-1",
        rating: 5,
        content: "좋은 서비스였습니다.",
        status: "COMPLETED",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (mockPrisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      // Exercise
      const result = await reviewRepository.postReview(
        "review-1",
        5,
        "좋은 서비스였습니다."
      );

      // Assertion
      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: "review-1" },
        data: {
          rating: 5,
          content: "좋은 서비스였습니다.",
          status: "COMPLETED",
        },
      });
      expect(result).toEqual(mockReview);
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Prisma 에러");
      (mockPrisma.review.update as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        reviewRepository.postReview("review-1", 5, "좋은 서비스였습니다.")
      ).rejects.toThrow("Prisma 에러");
    });
  });

  describe("getWritableEstimateRequests", () => {
    it("성공적으로 작성 가능한 요청 목록을 조회한다", async () => {
      // Setup
      const mockRequests = [
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
      ];

      (mockPrisma.estimateRequest.findMany as jest.Mock).mockResolvedValue(
        mockRequests
      );
      (mockPrisma.estimateRequest.count as jest.Mock).mockResolvedValue(2);

      // Exercise
      const result = await reviewRepository.getWritableEstimateRequests(
        "user-1",
        { page: 1, pageSize: 10 }
      );

      // Assertion
      expect(mockPrisma.estimateRequest.findMany).toHaveBeenCalledWith({
        where: {
          customerId: "user-1",
          status: "COMPLETED",
          review: { is: { status: "PENDING" } },
        },
        include: {
          estimates: {
            where: { status: "ACCEPTED" },
            include: {
              mover: true,
            },
          },
          fromAddress: true,
          toAddress: true,
          review: true,
        },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        items: mockRequests,
        total: 2,
        page: 1,
        pageSize: 10,
      });
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Prisma 에러");
      (mockPrisma.estimateRequest.findMany as jest.Mock).mockRejectedValue(
        error
      );

      // Exercise & Assertion
      await expect(
        reviewRepository.getWritableEstimateRequests("user-1", {
          page: 1,
          pageSize: 10,
        })
      ).rejects.toThrow("Prisma 에러");
    });
  });

  describe("getWrittenReviews", () => {
    it("성공적으로 작성한 리뷰 목록을 조회한다", async () => {
      // Setup
      const mockReviews = [
        { id: "review-1", rating: 5, content: "좋은 서비스" },
        { id: "review-2", rating: 4, content: "괜찮은 서비스" },
      ];

      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
      (mockPrisma.review.count as jest.Mock).mockResolvedValue(2);

      // Exercise
      const result = await reviewRepository.getWrittenReviews("user-1", {
        page: 1,
        pageSize: 10,
      });

      // Assertion
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { customerId: "user-1" },
        include: {
          request: {
            include: {
              fromAddress: true,
              toAddress: true,
              estimates: true,
            },
          },
          mover: true,
        },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        items: mockReviews,
        total: 2,
        page: 1,
        pageSize: 10,
      });
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Prisma 에러");
      (mockPrisma.review.findMany as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        reviewRepository.getWrittenReviews("user-1", { page: 1, pageSize: 10 })
      ).rejects.toThrow("Prisma 에러");
    });
  });

  describe("getReceivedReviews", () => {
    it("성공적으로 받은 리뷰 목록을 조회한다", async () => {
      // Setup
      const mockReviews = [
        { id: "review-1", rating: 5, content: "좋은 서비스" },
        { id: "review-2", rating: 4, content: "괜찮은 서비스" },
      ];

      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
      (mockPrisma.review.count as jest.Mock).mockResolvedValue(2);

      // Exercise
      const result = await reviewRepository.getReceivedReviews("user-1", {
        page: 1,
        pageSize: 10,
      });

      // Assertion
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: {
          moverId: "user-1",
          deletedAt: null,
        },
        select: {
          id: true,
          customerId: true,
          moverId: true,
          estimateRequestId: true,
          rating: true,
          content: true,
          createdAt: true,
          writer: {
            select: {
              id: true,
              nickname: true,
              customerImage: true,
            },
          },
          request: {
            select: {
              id: true,
              moveType: true,
              moveDate: true,
              fromAddress: true,
              toAddress: true,
              estimates: {
                where: { status: "ACCEPTED" },
                select: {
                  id: true,
                  price: true,
                  isDesignated: true,
                },
              },
            },
          },
        },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        items: mockReviews,
        total: 2,
        page: 1,
        pageSize: 10,
      });
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Prisma 에러");
      (mockPrisma.review.findMany as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        reviewRepository.getReceivedReviews("user-1", { page: 1, pageSize: 10 })
      ).rejects.toThrow("Prisma 에러");
    });
  });

  describe("getReview", () => {
    it("성공적으로 견적 요청 ID로 리뷰를 조회한다", async () => {
      // Setup
      const mockReview = {
        id: "review-1",
        customerId: "user-1",
        moverId: "mover-1",
        estimateRequestId: "request-1",
        status: "PENDING",
        mover: {
          id: "mover-1",
          nickname: "기사님1",
        },
      };

      (mockPrisma.review.findFirst as jest.Mock).mockResolvedValue(mockReview);

      // Exercise
      const result = await reviewRepository.getReview("request-1");

      // Assertion
      expect(mockPrisma.review.findFirst).toHaveBeenCalledWith({
        where: {
          estimateRequestId: "request-1",
        },
        include: {
          mover: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      });
      expect(result).toEqual(mockReview);
    });

    it("견적 요청 ID에 해당하는 리뷰가 없을 때 null을 반환한다", async () => {
      // Setup
      (mockPrisma.review.findFirst as jest.Mock).mockResolvedValue(null);

      // Exercise
      const result = await reviewRepository.getReview("request-1");

      // Assertion
      expect(result).toBeNull();
    });

    it("Prisma 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("Database error");
      (mockPrisma.review.findFirst as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(reviewRepository.getReview("request-1")).rejects.toThrow("Database error");
    });
  });
});
