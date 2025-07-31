import ReviewService from './review.service';
import { ReviewStatus } from '@prisma/client';

// 레포지토리 모듈 전체를 모킹
jest.mock('../repositories/review.repository', () => ({
  postReview: jest.fn(),
  getWritableEstimateRequests: jest.fn(),
  getWrittenReviews: jest.fn(),
  getReceivedReviews: jest.fn(),
}));

import reviewRepository from '../repositories/review.repository';
const mockRepository = reviewRepository as jest.Mocked<typeof reviewRepository>;

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('postReview', () => {
    it('성공적으로 리뷰를 작성한다', async () => {
      // Setup
      const mockReview = {
        id: 'review-1',
        customerId: 'user-1',
        moverId: 'mover-1',
        estimateRequestId: 'request-1',
        rating: 5,
        content: '좋은 서비스였습니다.',
        status: 'COMPLETED' as ReviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.postReview.mockResolvedValue(mockReview as any);

      // Exercise
      const result = await ReviewService.postReview('review-1', 5, '좋은 서비스였습니다.');

      // Assertion
      expect(mockRepository.postReview).toHaveBeenCalledWith('review-1', 5, '좋은 서비스였습니다.');
      expect(result).toEqual(mockReview);
    });

    it('레포지토리 에러 시 에러를 던진다', async () => {
      // Setup
      const error = new Error('레포지토리 에러');
      mockRepository.postReview.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(ReviewService.postReview('review-1', 5, '좋은 서비스였습니다.')).rejects.toThrow('레포지토리 에러');
      expect(mockRepository.postReview).toHaveBeenCalledWith('review-1', 5, '좋은 서비스였습니다.');
    });
  });

  describe('getWritableEstimateRequests', () => {
    it('성공적으로 작성 가능한 요청 목록을 조회한다', async () => {
      // Setup
      const mockRequests = {
        items: [
          { 
            id: 'request-1', 
            status: 'COMPLETED', 
            estimateRequestId: 'request-1',
            fromAddress: { id: 'addr-1', city: '서울' },
            toAddress: { id: 'addr-2', city: '부산' },
            estimates: [{ id: 'estimate-1', moverId: 'mover-1', status: 'ACCEPTED' }],
            review: { id: 'review-1', status: 'PENDING' }
          },
          { 
            id: 'request-2', 
            status: 'COMPLETED', 
            estimateRequestId: 'request-2',
            fromAddress: { id: 'addr-3', city: '대구' },
            toAddress: { id: 'addr-4', city: '인천' },
            estimates: [{ id: 'estimate-2', moverId: 'mover-2', status: 'ACCEPTED' }],
            review: { id: 'review-2', status: 'PENDING' }
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10
      };

      mockRepository.getWritableEstimateRequests.mockResolvedValue(mockRequests as any);

      // Exercise
      const result = await ReviewService.getWritableEstimateRequests('user-1', { page: 1, pageSize: 10 });

      // Assertion
      expect(mockRepository.getWritableEstimateRequests).toHaveBeenCalledWith('user-1', { page: 1, pageSize: 10 });
      expect(result).toEqual(mockRequests);
    });

    it('레포지토리 에러 시 에러를 던진다', async () => {
      // Setup
      const error = new Error('레포지토리 에러');
      mockRepository.getWritableEstimateRequests.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(ReviewService.getWritableEstimateRequests('user-1', { page: 1, pageSize: 10 })).rejects.toThrow('레포지토리 에러');
      expect(mockRepository.getWritableEstimateRequests).toHaveBeenCalledWith('user-1', { page: 1, pageSize: 10 });
    });
  });

  describe('getWrittenReviews', () => {
    it('성공적으로 작성한 리뷰 목록을 조회한다', async () => {
      // Setup
      const mockReviews = {
        items: [
          { 
            id: 'review-1', 
            rating: 5, 
            content: '좋은 서비스',
            createdAt: new Date(),
            request: {
              id: 'request-1',
              moveType: 'HOME',
              moveDate: new Date(),
              fromAddress: { id: 'addr-1', city: '서울' },
              toAddress: { id: 'addr-2', city: '부산' },
              estimates: [{ id: 'estimate-1', price: 50000 }]
            },
            mover: { id: 'mover-1', name: '기사님1' }
          },
          { 
            id: 'review-2', 
            rating: 4, 
            content: '괜찮은 서비스',
            createdAt: new Date(),
            request: {
              id: 'request-2',
              moveType: 'OFFICE',
              moveDate: new Date(),
              fromAddress: { id: 'addr-3', city: '대구' },
              toAddress: { id: 'addr-4', city: '인천' },
              estimates: [{ id: 'estimate-2', price: 60000 }]
            },
            mover: { id: 'mover-2', name: '기사님2' }
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10
      };

      mockRepository.getWrittenReviews.mockResolvedValue(mockReviews as any);

      // Exercise
      const result = await ReviewService.getWrittenReviews('user-1', { page: 1, pageSize: 10 });

      // Assertion
      expect(mockRepository.getWrittenReviews).toHaveBeenCalledWith('user-1', { page: 1, pageSize: 10 });
      expect(result).toEqual(mockReviews);
    });

    it('레포지토리 에러 시 에러를 던진다', async () => {
      // Setup
      const error = new Error('레포지토리 에러');
      mockRepository.getWrittenReviews.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(ReviewService.getWrittenReviews('user-1', { page: 1, pageSize: 10 })).rejects.toThrow('레포지토리 에러');
      expect(mockRepository.getWrittenReviews).toHaveBeenCalledWith('user-1', { page: 1, pageSize: 10 });
    });
  });

  describe('getReceivedReviews', () => {
    it('성공적으로 받은 리뷰 목록을 조회한다', async () => {
      // Setup
      const mockReviews = {
        items: [
          { 
            id: 'review-1', 
            rating: 5, 
            content: '좋은 서비스',
            createdAt: new Date(),
            customerId: 'customer-1',
            estimateRequestId: 'request-1',
            moverId: 'mover-1',
            writer: { id: 'customer-1', nickname: '고객1', customerImage: 'image1.jpg' },
            request: {
              id: 'request-1',
              moveType: 'HOME',
              moveDate: new Date(),
              fromAddress: { id: 'addr-1', city: '서울' },
              toAddress: { id: 'addr-2', city: '부산' },
              estimates: [{ id: 'estimate-1', price: 50000, isDesignated: false }]
            }
          },
          { 
            id: 'review-2', 
            rating: 4, 
            content: '괜찮은 서비스',
            createdAt: new Date(),
            customerId: 'customer-2',
            estimateRequestId: 'request-2',
            moverId: 'mover-1',
            writer: { id: 'customer-2', nickname: '고객2', customerImage: 'image2.jpg' },
            request: {
              id: 'request-2',
              moveType: 'OFFICE',
              moveDate: new Date(),
              fromAddress: { id: 'addr-3', city: '대구' },
              toAddress: { id: 'addr-4', city: '인천' },
              estimates: [{ id: 'estimate-2', price: 60000, isDesignated: true }]
            }
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10
      };

      mockRepository.getReceivedReviews.mockResolvedValue(mockReviews as any);

      // Exercise
      const result = await ReviewService.getReceivedReviews('user-1', { page: 1, pageSize: 10 });

      // Assertion
      expect(mockRepository.getReceivedReviews).toHaveBeenCalledWith('user-1', { page: 1, pageSize: 10 });
      expect(result).toEqual(mockReviews);
    });

    it('레포지토리 에러 시 에러를 던진다', async () => {
      // Setup
      const error = new Error('레포지토리 에러');
      mockRepository.getReceivedReviews.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(ReviewService.getReceivedReviews('user-1', { page: 1, pageSize: 10 })).rejects.toThrow('레포지토리 에러');
      expect(mockRepository.getReceivedReviews).toHaveBeenCalledWith('user-1', { page: 1, pageSize: 10 });
    });
  });
}); 