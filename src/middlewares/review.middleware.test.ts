import { PrismaClient, RequestStatus, NotificationType, Prisma } from '@prisma/client';

// PrismaClient를 모킹
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    estimateRequest: {
      update: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $use: jest.fn(),
  })),
  NotificationType: {
    WELCOME: 'WELCOME',
    ESTIMATE_REQUEST_ARRIVED: 'ESTIMATE_REQUEST_ARRIVED',
    ESTIMATE_ARRIVED: 'ESTIMATE_ARRIVED',
    ESTIMATE_STATUS_UPDATED: 'ESTIMATE_STATUS_UPDATED',
    DESIGNATED_ESTIMATE_REQUEST_ARRIVED: 'DESIGNATED_ESTIMATE_REQUEST_ARRIVED',
    DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED: 'DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED',
    DESIGNATED_ESTIMATE_ARRIVED: 'DESIGNATED_ESTIMATE_ARRIVED',
    DESIGNATED_ESTIMATE_STATUS_UPDATED: 'DESIGNATED_ESTIMATE_STATUS_UPDATED',
    REVIEW_EVENT: 'REVIEW_EVENT',
    FAVORITE_EVENT: 'FAVORITE_EVENT',
    MOVE_DAY_REMINDER: 'MOVE_DAY_REMINDER',
  },
  ActionType: {
    WELCOME: 'WELCOME',
    ESTIMATE_REQUEST_CREATE: 'ESTIMATE_REQUEST_CREATE',
    ESTIMATE_CREATE: 'ESTIMATE_CREATE',
    ESTIMATE_ACCEPT: 'ESTIMATE_ACCEPT',
    ESTIMATE_REJECT: 'ESTIMATE_REJECT',
    DESIGNATED_ESTIMATE_REQUEST_CREATE: 'DESIGNATED_ESTIMATE_REQUEST_CREATE',
    DESIGNATED_ESTIMATE_REQUEST_REJECT: 'DESIGNATED_ESTIMATE_REQUEST_REJECT',
    DESIGNATED_ESTIMATE_CREATE: 'DESIGNATED_ESTIMATE_CREATE',
    DESIGNATED_ESTIMATE_ACCEPT: 'DESIGNATED_ESTIMATE_ACCEPT',
    DESIGNATED_ESTIMATE_REJECT: 'DESIGNATED_ESTIMATE_REJECT',
    REVIEW_SUBMITTED: 'REVIEW_SUBMITTED',
    FAVORITE_ADD: 'FAVORITE_ADD',
    FAVORITE_REMOVE: 'FAVORITE_REMOVE',
  },
  ReviewStatus: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
  },
}));

// prisma 모듈을 모킹
jest.mock('../db/prisma/prisma', () => ({
  __esModule: true,
  default: {
    estimateRequest: {
      update: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $use: jest.fn(),
  },
}));

import { reviewPrismaMiddleware } from './reviewMiddleware';
import prisma from '../db/prisma/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Jest 모킹 함수로 타입 캐스팅
const mockFindUnique = mockPrisma.estimateRequest.findUnique as jest.MockedFunction<typeof mockPrisma.estimateRequest.findUnique>;
const mockFindFirst = mockPrisma.review.findFirst as jest.MockedFunction<typeof mockPrisma.review.findFirst>;
const mockCreate = mockPrisma.review.create as jest.MockedFunction<typeof mockPrisma.review.create>;

describe('ReviewMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EstimateRequest 상태 변경 시 리뷰 생성', () => {
    it('EstimateRequest가 COMPLETED로 변경되고 수락된 견적이 있으면 리뷰를 생성한다', async () => {
      // Setup
      const mockEstimateRequest = {
        id: 'request-1',
        status: 'COMPLETED',
        customerId: 'user-1',
        estimates: [
          {
            id: 'estimate-1',
            moverId: 'mover-1',
            status: 'ACCEPTED',
          },
        ],
        review: null,
      };

      const mockReview = {
        id: 'review-1',
        customerId: 'user-1',
        moverId: 'mover-1',
        estimateRequestId: 'request-1',
        rating: 0,
        content: '',
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockFindUnique.mockResolvedValue(mockEstimateRequest as Prisma.EstimateRequestGetPayload<{
        include: { estimates: true; review: true }
      }>);
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockReview as Prisma.ReviewGetPayload<{}>);

      // Exercise
      const params: Prisma.MiddlewareParams = {
        model: 'EstimateRequest',
        action: 'update',
        args: {
          where: { id: 'request-1' },
          data: { status: 'COMPLETED' },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockEstimateRequest);
      
      await reviewPrismaMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'request-1' },
        include: {
          estimates: true,
          review: true,
        },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          estimateRequestId: 'request-1',
          customerId: 'user-1',
          moverId: 'mover-1',
          rating: 0,
          content: '',
        },
      });
    });

    it('EstimateRequest가 COMPLETED가 아니면 리뷰를 생성하지 않는다', async () => {
      // Setup
      const mockEstimateRequest = {
        id: 'request-1',
        status: 'PENDING',
        customerId: 'user-1',
        estimates: [
          {
            id: 'estimate-1',
            moverId: 'mover-1',
            status: 'ACCEPTED',
          },
        ],
        review: null,
      };

      // Exercise
      const params: Prisma.MiddlewareParams = {
        model: 'EstimateRequest',
        action: 'update',
        args: {
          where: { id: 'request-1' },
          data: { status: 'PENDING' },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockEstimateRequest);
      
      await reviewPrismaMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('수락된 견적이 없으면 리뷰를 생성하지 않는다', async () => {
      // Setup
      const mockEstimateRequest = {
        id: 'request-1',
        status: 'COMPLETED',
        customerId: 'user-1',
        estimates: [
          {
            id: 'estimate-1',
            moverId: 'mover-1',
            status: 'PROPOSED',
          },
        ],
        review: null,
      };

      mockFindUnique.mockResolvedValue(mockEstimateRequest as Prisma.EstimateRequestGetPayload<{
        include: { estimates: true; review: true }
      }>);

      // Exercise
      const params: Prisma.MiddlewareParams = {
        model: 'EstimateRequest',
        action: 'update',
        args: {
          where: { id: 'request-1' },
          data: { status: 'COMPLETED' },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockEstimateRequest);
      
      await reviewPrismaMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('이미 리뷰가 존재하면 새로운 리뷰를 생성하지 않는다', async () => {
      // Setup
      const mockEstimateRequest = {
        id: 'request-1',
        status: 'COMPLETED',
        customerId: 'user-1',
        estimates: [
          {
            id: 'estimate-1',
            moverId: 'mover-1',
            status: 'ACCEPTED',
          },
        ],
        review: {
          id: 'review-1',
          estimateRequestId: 'request-1',
        },
      };

      mockFindUnique.mockResolvedValue(mockEstimateRequest as Prisma.EstimateRequestGetPayload<{
        include: { estimates: true; review: true }
      }>);

      // Exercise
      const params: Prisma.MiddlewareParams = {
        model: 'EstimateRequest',
        action: 'update',
        args: {
          where: { id: 'request-1' },
          data: { status: 'COMPLETED' },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockEstimateRequest);
      
      await reviewPrismaMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockCreate).not.toHaveBeenCalled();
    });



    it('다른 모델의 업데이트는 리뷰 생성 로직을 실행하지 않는다', async () => {
      // Setup
      const mockUser = {
        id: 'user-1',
        name: '테스트 유저',
      };

      // Exercise
      const params: Prisma.MiddlewareParams = {
        model: 'User',
        action: 'update',
        args: {
          where: { id: 'user-1' },
          data: { name: '새로운 이름' },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockUser);
      
      await reviewPrismaMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('EstimateRequest의 다른 필드 업데이트는 리뷰 생성 로직을 실행하지 않는다', async () => {
      // Setup
      const mockEstimateRequest = {
        id: 'request-1',
        status: 'COMPLETED',
        customerId: 'user-1',
        estimates: [
          {
            id: 'estimate-1',
            moverId: 'mover-1',
            status: 'ACCEPTED',
          },
        ],
        review: null,
      };

      // Exercise
      const params: Prisma.MiddlewareParams = {
        model: 'EstimateRequest',
        action: 'update',
        args: {
          where: { id: 'request-1' },
          data: { description: '새로운 설명' },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = jest.fn().mockResolvedValue(mockEstimateRequest);
      
      await reviewPrismaMiddleware(params, next);

      // Assertion
      expect(next).toHaveBeenCalledWith(params);
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});