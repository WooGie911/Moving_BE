import { PrismaClient } from "@prisma/client";
// PrismaClient를 모킹
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    estimateRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
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
    ESTIMATE_CREATE: "ESTIMATE_CREATE",
    ESTIMATE_ACCEPT: "ESTIMATE_ACCEPT",
    ESTIMATE_REJECT: "ESTIMATE_REJECT",
    DESIGNATED_ESTIMATE_REQUEST_CREATE: "DESIGNATED_ESTIMATE_REQUEST_CREATE",
    DESIGNATED_ESTIMATE_REQUEST_REJECT: "DESIGNATED_ESTIMATE_REQUEST_REJECT",
    DESIGNATED_ESTIMATE_CREATE: "DESIGNATED_ESTIMATE_CREATE",
    DESIGNATED_ESTIMATE_ACCEPT: "DESIGNATED_ESTIMATE_ACCEPT",
    DESIGNATED_ESTIMATE_REJECT: "DESIGNATED_ESTIMATE_REJECT",
    REVIEW_SUBMITTED: "REVIEW_SUBMITTED",
    FAVORITE_ADD: "FAVORITE_ADD",
    FAVORITE_REMOVE: "FAVORITE_REMOVE",
  },
  ReviewStatus: {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
  },
}));

// prisma.ts 파일을 모킹
jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    estimateRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $use: jest.fn(),
  },
}));

import reviewRepository from "./review.repository";
import prisma from "../db/prisma/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Jest 모킹 함수로 타입 캐스팅
const mockCreate = mockPrisma.review.create as jest.MockedFunction<typeof mockPrisma.review.create>;
const mockFindMany = mockPrisma.review.findMany as jest.MockedFunction<typeof mockPrisma.review.findMany>;
const mockUpdate = mockPrisma.review.update as jest.MockedFunction<typeof mockPrisma.review.update>;
const mockCount = mockPrisma.review.count as jest.MockedFunction<typeof mockPrisma.review.count>;
const mockFindFirst = mockPrisma.review.findFirst as jest.MockedFunction<typeof mockPrisma.review.findFirst>;
const mockFindUnique = mockPrisma.review.findUnique as jest.MockedFunction<typeof mockPrisma.review.findUnique>;

// estimateRequest 모킹 함수들
const mockEstimateRequestFindMany = mockPrisma.estimateRequest.findMany as jest.MockedFunction<typeof mockPrisma.estimateRequest.findMany>;
const mockEstimateRequestCount = mockPrisma.estimateRequest.count as jest.MockedFunction<typeof mockPrisma.estimateRequest.count>;

describe("ReviewRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('postReview', () => {
    it('리뷰를 성공적으로 생성한다', async () => {
      // Setup
      const reviewId = 'review-1';
      const rating = 5;
      const content = '좋은 서비스였습니다.';

      const mockReview = {
        id: reviewId,
        rating,
        content,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpdate.mockResolvedValue(mockReview as any);

      // Exercise
      const result = await reviewRepository.postReview(reviewId, rating, content);

      // Assertion
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: { rating, content, status: 'COMPLETED' },
      });
      expect(result).toEqual(mockReview);
    });

    it('리뷰 생성 중 에러가 발생하면 에러를 던진다', async () => {
      // Setup
      const reviewId = 'review-1';
      const rating = 5;
      const content = '좋은 서비스였습니다.';

      mockUpdate.mockRejectedValue(new Error('리뷰 생성 실패'));

      // Exercise & Assertion
      await expect(reviewRepository.postReview(reviewId, rating, content)).rejects.toThrow('리뷰 생성 실패');
    });
  });

  describe('getWritableEstimateRequests', () => {
    it('작성 가능한 견적 요청 목록을 성공적으로 조회한다', async () => {
      // Setup
      const customerId = 'user-1';
      const pageQuery = { page: 1, pageSize: 10 };
      const mockEstimateRequests = [
        {
          id: 'request-1',
          status: 'COMPLETED',
          moveDate: new Date('2024-01-01'),
        },
        {
          id: 'request-2',
          status: 'COMPLETED',
          moveDate: new Date('2024-01-02'),
        },
      ];

      mockEstimateRequestFindMany.mockResolvedValue(mockEstimateRequests as any);
      mockEstimateRequestCount.mockResolvedValue(2);

      // Exercise
      const result = await reviewRepository.getWritableEstimateRequests(customerId, pageQuery);

      // Assertion
      expect(mockEstimateRequestFindMany).toHaveBeenCalledWith({
        where: {
          customerId,
          status: 'COMPLETED',
          review: { is: { status: 'PENDING' } },
        },
        include: {
          estimates: {
            where: { status: 'ACCEPTED' },
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
        items: mockEstimateRequests,
        total: 2,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('getWrittenReviews', () => {
    it('작성한 리뷰 목록을 성공적으로 조회한다', async () => {
      // Setup
      const customerId = 'user-1';
      const pageQuery = { page: 1, pageSize: 10 };
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          content: '좋은 서비스였습니다.',
          status: 'COMPLETED',
          createdAt: new Date(),
        },
      ];

      mockFindMany.mockResolvedValue(mockReviews as any);
      mockCount.mockResolvedValue(1);

      // Exercise
      const result = await reviewRepository.getWrittenReviews(customerId, pageQuery);

      // Assertion
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          customerId,
          status: 'COMPLETED',
        },
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
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('getReceivedReviews', () => {
    it('받은 리뷰 목록을 성공적으로 조회한다', async () => {
      // Setup
      const moverId = 'mover-1';
      const pageQuery = { page: 1, pageSize: 10 };
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          content: '좋은 서비스였습니다.',
          status: 'COMPLETED',
          createdAt: new Date(),
        },
      ];

      mockFindMany.mockResolvedValue(mockReviews as any);
      mockCount.mockResolvedValue(1);

      // Exercise
      const result = await reviewRepository.getReceivedReviews(moverId, pageQuery);

      // Assertion
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          moverId,
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
                where: { status: 'ACCEPTED' },
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
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('getReviewDetailForAction', () => {
    it('액션용 리뷰 상세 정보를 성공적으로 조회한다', async () => {
      // Setup
      const reviewId = 'review-1';
      const mockReview = {
        id: reviewId,
        rating: 5,
        content: '좋은 서비스였습니다.',
        status: 'COMPLETED',
        customerId: 'user-1',
        moverId: 'mover-1',
        estimateRequestId: 'request-1',
        mover: {
          id: 'mover-1',
          nickname: '김기사',
        },
      };

      mockFindUnique.mockResolvedValue(mockReview as any);

      // Exercise
      const result = await reviewRepository.getReviewDetailForAction(reviewId);

      // Assertion
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
        select: {
          id: true,
          customerId: true,
          moverId: true,
          estimateRequestId: true,
          status: true,
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

    it('리뷰가 존재하지 않으면 null을 반환한다', async () => {
      // Setup
      const reviewId = 'review-1';

      mockFindUnique.mockResolvedValue(null);

      // Exercise
      const result = await reviewRepository.getReviewDetailForAction(reviewId);

      // Assertion
      expect(result).toBeNull();
    });
  });
});
