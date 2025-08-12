import ReviewService, { updateMoverReviewStats } from "./review.service";
import { ReviewStatus } from "@prisma/client";

// Sentry 모킹
jest.mock("../utils/sentryUtils", () => ({
  captureReviewError: jest.fn(),
}));

// 레포지토리 모듈 전체를 모킹
jest.mock("../repositories/review.repository", () => ({
  postReview: jest.fn(),
  getWritableEstimateRequests: jest.fn(),
  getWrittenReviews: jest.fn(),
  getReceivedReviews: jest.fn(),
  getReviewDetailForAction: jest.fn(),
}));

import reviewRepository from "../repositories/review.repository";
const mockRepository = reviewRepository as jest.Mocked<typeof reviewRepository>;

// 액션 서비스 모킹
jest.mock("./action.service", () => ({
  createAction: jest.fn(),
}));

import actionService from "./action.service";
const mockActionService = actionService as jest.Mocked<typeof actionService>;

describe("ReviewService", () => {
  beforeEach(() => {
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
        status: "COMPLETED" as ReviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockReviewDetail = {
        customerId: "user-1",
        moverId: "mover-1",
      };

      mockRepository.postReview.mockResolvedValue(mockReview as any);
      mockRepository.getReviewDetailForAction.mockResolvedValue(
        mockReviewDetail as any
      );
      mockActionService.createAction.mockResolvedValue({} as any);

      // Exercise
      const result = await ReviewService.postReview(
        "review-1",
        5,
        "좋은 서비스였습니다."
      );

      // Assertion
      expect(mockRepository.postReview).toHaveBeenCalledWith(
        "review-1",
        5,
        "좋은 서비스였습니다."
      );
      expect(mockRepository.getReviewDetailForAction).toHaveBeenCalledWith(
        "review-1"
      );
      expect(mockActionService.createAction).toHaveBeenCalledWith(
        "user-1",
        "REVIEW_SUBMITTED",
        "review-1",
        "REVIEW",
        { moverId: "mover-1" }
      );
      expect(result).toEqual(mockReview);
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.postReview.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        ReviewService.postReview("review-1", 5, "좋은 서비스였습니다.")
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.postReview).toHaveBeenCalledWith(
        "review-1",
        5,
        "좋은 서비스였습니다."
      );
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
            moveType: "HOME",
            moveDate: new Date("2024-07-01"),
            description: "소형 이사 서비스",
            fromAddress: {
              id: "addr-1",
              city: "서울",
              district: "강남구",
              detail: "101동 202호",
              region: "SEOUL",
              zoneCode: "06123",
            },
            toAddress: {
              id: "addr-2",
              city: "부산",
              district: "해운대구",
              detail: "301동 404호",
              region: "BUSAN",
              zoneCode: "48001",
            },
            estimates: [
              {
                id: "estimate-1",
                moverId: "mover-1",
                status: "ACCEPTED",
                price: 180000,
                comment: "신속하고 안전한 이사 서비스",
                isDesignated: true,
                validUntil: new Date("2024-07-15"),
                createdAt: new Date("2024-06-25"),
                updatedAt: new Date("2024-06-25"),
                mover: {
                  id: "mover-1",
                  moverImage: "https://.../profile.png",
                  nickname: "김코드 기사님",
                  shortIntro: "이사부터 정리까지 꼼꼼한 마무리!",
                  detailIntro:
                    "10년간 서울 지역에서 이사 서비스를 제공해온 베테랑 기사님입니다.",
                },
              },
            ],
            review: { id: "review-1", status: "PENDING" },
            createdAt: new Date("2024-06-20"),
            updatedAt: new Date("2024-06-25"),
          },
          {
            id: "request-2",
            status: "COMPLETED",
            moveType: "OFFICE",
            moveDate: new Date("2024-07-02"),
            description: "사무실 이사 서비스",
            fromAddress: {
              id: "addr-3",
              city: "대구",
              district: "중구",
              detail: "201동 303호",
              region: "DAEGU",
              zoneCode: "41911",
            },
            toAddress: {
              id: "addr-4",
              city: "인천",
              district: "연수구",
              detail: "401동 505호",
              region: "INCHEON",
              zoneCode: "22001",
            },
            estimates: [
              {
                id: "estimate-2",
                moverId: "mover-2",
                status: "ACCEPTED",
                price: 250000,
                comment: "전문적인 사무실 이사 서비스",
                isDesignated: false,
                validUntil: new Date("2024-07-20"),
                createdAt: new Date("2024-06-26"),
                updatedAt: new Date("2024-06-26"),
                mover: {
                  id: "mover-2",
                  moverImage: "https://.../profile2.png",
                  nickname: "박이사 기사님",
                  shortIntro: "사무실 이사 전문가입니다",
                  detailIntro:
                    "15년간 사무실 이사 경험을 바탕으로 안전하고 신속한 서비스를 제공합니다.",
                },
              },
            ],
            review: { id: "review-2", status: "PENDING" },
            createdAt: new Date("2024-06-21"),
            updatedAt: new Date("2024-06-26"),
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      mockRepository.getWritableEstimateRequests.mockResolvedValue(
        mockRequests as any
      );

      // Exercise
      const result = await ReviewService.getWritableEstimateRequests("user-1", {
        page: 1,
        pageSize: 10,
      });

      // Assertion
      expect(mockRepository.getWritableEstimateRequests).toHaveBeenCalledWith(
        "user-1",
        { page: 1, pageSize: 10 }
      );
      expect(result).toEqual({
        success: true,
        message: "리뷰 작성 가능한 견적 요청 리스트입니다.",
        data: {
          items: expect.arrayContaining([
            expect.objectContaining({
              id: "request-1",
              reviewId: "review-1",
              mover: expect.objectContaining({
                id: "mover-1",
                profileImage: "https://.../profile.png",
                nickname: "김코드 기사님",
                shortIntro: "이사부터 정리까지 꼼꼼한 마무리!",
                detailIntro:
                  "10년간 서울 지역에서 이사 서비스를 제공해온 베테랑 기사님입니다.",
              }),
              moveType: "HOME",
              estimate: expect.objectContaining({
                id: "estimate-1",
                price: 180000,
                comment: "신속하고 안전한 이사 서비스",
                status: "ACCEPTED",
                isDesignated: true,
              }),
            }),
            expect.objectContaining({
              id: "request-2",
              reviewId: "review-2",
              mover: expect.objectContaining({
                id: "mover-2",
                profileImage: "https://.../profile2.png",
                nickname: "박이사 기사님",
                shortIntro: "사무실 이사 전문가입니다",
                detailIntro:
                  "15년간 사무실 이사 경험을 바탕으로 안전하고 신속한 서비스를 제공합니다.",
              }),
              moveType: "OFFICE",
              estimate: expect.objectContaining({
                id: "estimate-2",
                price: 250000,
                comment: "전문적인 사무실 이사 서비스",
                status: "ACCEPTED",
                isDesignated: false,
              }),
            }),
          ]),
          total: 2,
          page: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.getWritableEstimateRequests.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        ReviewService.getWritableEstimateRequests("user-1", {
          page: 1,
          pageSize: 10,
        })
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.getWritableEstimateRequests).toHaveBeenCalledWith(
        "user-1",
        { page: 1, pageSize: 10 }
      );
    });
  });

  describe("getWrittenReviews", () => {
    it("성공적으로 작성한 리뷰 목록을 조회한다", async () => {
      // Setup
      const mockReviews = {
        items: [
          {
            id: "review-1",
            rating: 5,
            content: "좋은 서비스",
            status: "COMPLETED",
            createdAt: new Date("2024-07-18"),
            updatedAt: new Date("2024-07-18"),
            moverId: "mover-1",
            mover: {
              id: "mover-1",
              moverImage: "https://.../profile.png",
              nickname: "김코드 기사님",
              shortIntro: "이사부터 정리까지 꼼꼼한 마무리!",
              detailIntro:
                "10년간 서울 지역에서 이사 서비스를 제공해온 베테랑 기사님입니다.",
            },
            request: {
              id: "request-1",
              moveType: "HOME",
              moveDate: new Date("2024-07-01"),
              description: "소형 이사 서비스",
              fromAddress: {
                id: "addr-1",
                city: "서울",
                district: "강남구",
                detail: "101동 202호",
                region: "SEOUL",
                zoneCode: "06123",
              },
              toAddress: {
                id: "addr-2",
                city: "부산",
                district: "해운대구",
                detail: "301동 404호",
                region: "BUSAN",
                zoneCode: "48001",
              },
              estimates: [
                {
                  id: "estimate-1",
                  price: 180000,
                  comment: "신속하고 안전한 이사 서비스",
                  status: "ACCEPTED",
                  isDesignated: true,
                  validUntil: new Date("2024-07-15"),
                  createdAt: new Date("2024-06-25"),
                  updatedAt: new Date("2024-06-25"),
                },
              ],
              createdAt: new Date("2024-06-20"),
              updatedAt: new Date("2024-06-25"),
            },
          },
          {
            id: "review-2",
            rating: 4,
            content: "괜찮은 서비스",
            status: "COMPLETED",
            createdAt: new Date("2024-07-19"),
            updatedAt: new Date("2024-07-19"),
            moverId: "mover-2",
            mover: {
              id: "mover-2",
              moverImage: "https://.../profile2.png",
              nickname: "박이사 기사님",
              shortIntro: "사무실 이사 전문가입니다",
              detailIntro:
                "15년간 사무실 이사 경험을 바탕으로 안전하고 신속한 서비스를 제공합니다.",
            },
            request: {
              id: "request-2",
              moveType: "OFFICE",
              moveDate: new Date("2024-07-02"),
              description: "사무실 이사 서비스",
              fromAddress: {
                id: "addr-3",
                city: "대구",
                district: "중구",
                detail: "201동 303호",
                region: "DAEGU",
                zoneCode: "41911",
              },
              toAddress: {
                id: "addr-4",
                city: "인천",
                district: "연수구",
                detail: "401동 505호",
                region: "INCHEON",
                zoneCode: "22001",
              },
              estimates: [
                {
                  id: "estimate-2",
                  price: 250000,
                  comment: "전문적인 사무실 이사 서비스",
                  status: "ACCEPTED",
                  isDesignated: false,
                  validUntil: new Date("2024-07-20"),
                  createdAt: new Date("2024-06-26"),
                  updatedAt: new Date("2024-06-26"),
                },
              ],
              createdAt: new Date("2024-06-21"),
              updatedAt: new Date("2024-06-26"),
            },
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      mockRepository.getWrittenReviews.mockResolvedValue(mockReviews as any);

      // Exercise
      const result = await ReviewService.getWrittenReviews("user-1", {
        page: 1,
        pageSize: 10,
      });

      // Assertion
      expect(mockRepository.getWrittenReviews).toHaveBeenCalledWith("user-1", {
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual({
        success: true,
        message: "내가 쓴 리뷰 목록입니다.",
        data: {
          items: expect.arrayContaining([
            expect.objectContaining({
              id: "review-1",
              rating: 5,
              content: "좋은 서비스",
              status: "COMPLETED",
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              description: expect.any(String),
              moveDate: expect.any(String),
              mover: expect.objectContaining({
                id: "mover-1",
                profileImage: "https://.../profile.png",
                nickname: "김코드 기사님",
                shortIntro: "이사부터 정리까지 꼼꼼한 마무리!",
                detailIntro:
                  "10년간 서울 지역에서 이사 서비스를 제공해온 베테랑 기사님입니다.",
              }),
              moveType: "HOME",
              fromAddress: expect.objectContaining({
                id: "addr-1",
                city: "서울",
                district: "강남구",
                detail: "101동 202호",
                region: "SEOUL",
                zoneCode: "06123",
              }),
              toAddress: expect.objectContaining({
                id: "addr-2",
                city: "부산",
                district: "해운대구",
                detail: "301동 404호",
                region: "BUSAN",
                zoneCode: "48001",
              }),
              estimate: expect.objectContaining({
                id: "estimate-1",
                price: 180000,
                comment: "신속하고 안전한 이사 서비스",
                status: "ACCEPTED",
                isDesignated: true,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                validUntil: expect.any(String),
              }),
              estimateRequest: expect.objectContaining({
                id: "request-1",
                status: null,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            }),
            expect.objectContaining({
              id: "review-2",
              rating: 4,
              content: "괜찮은 서비스",
              status: "COMPLETED",
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              description: expect.any(String),
              moveDate: expect.any(String),
              mover: expect.objectContaining({
                id: "mover-2",
                profileImage: "https://.../profile2.png",
                nickname: "박이사 기사님",
                shortIntro: "사무실 이사 전문가입니다",
                detailIntro:
                  "15년간 사무실 이사 경험을 바탕으로 안전하고 신속한 서비스를 제공합니다.",
              }),
              moveType: "OFFICE",
              fromAddress: expect.objectContaining({
                id: "addr-3",
                city: "대구",
                district: "중구",
                detail: "201동 303호",
                region: "DAEGU",
                zoneCode: "41911",
              }),
              toAddress: expect.objectContaining({
                id: "addr-4",
                city: "인천",
                district: "연수구",
                detail: "401동 505호",
                region: "INCHEON",
                zoneCode: "22001",
              }),
              estimate: expect.objectContaining({
                id: "estimate-2",
                price: 250000,
                comment: "전문적인 사무실 이사 서비스",
                status: "ACCEPTED",
                isDesignated: false,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                validUntil: expect.any(String),
              }),
              estimateRequest: expect.objectContaining({
                id: "request-2",
                status: null,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            }),
          ]),
          total: 2,
          page: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.getWrittenReviews.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        ReviewService.getWrittenReviews("user-1", { page: 1, pageSize: 10 })
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.getWrittenReviews).toHaveBeenCalledWith("user-1", {
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe("getReceivedReviews", () => {
    it("성공적으로 받은 리뷰 목록을 조회한다", async () => {
      // Setup
      const mockReviews = {
        items: [
          {
            id: "review-1",
            rating: 5,
            content: "좋은 서비스",
            status: "COMPLETED",
            createdAt: new Date("2024-07-11"),
            updatedAt: new Date("2024-07-11"),
            customerId: "customer-1",
            estimateRequestId: "request-1",
            moverId: "mover-1",
            writer: {
              id: "customer-1",
              nickname: "고객1",
              customerImage: "image1.jpg",
              shortIntro: "깔끔한 이사를 원합니다",
              detailIntro: "신중하고 꼼꼼한 이사 서비스를 원하는 고객입니다.",
            },
            request: {
              id: "request-1",
              moveType: "HOME",
              moveDate: new Date("2024-07-10"),
              description: "소형 이사 서비스",
              fromAddress: {
                id: "addr-1",
                city: "서울",
                district: "강남구",
                detail: "101동 202호",
                region: "SEOUL",
                zoneCode: "06123",
              },
              toAddress: {
                id: "addr-2",
                city: "부산",
                district: "해운대구",
                detail: "301동 404호",
                region: "BUSAN",
                zoneCode: "48001",
              },
              estimates: [
                {
                  id: "estimate-1",
                  price: 180000,
                  comment: "신속하고 안전한 이사 서비스",
                  status: "ACCEPTED",
                  isDesignated: true,
                  validUntil: new Date("2024-07-15"),
                  createdAt: new Date("2024-06-25"),
                  updatedAt: new Date("2024-06-25"),
                },
              ],
              createdAt: new Date("2024-06-20"),
              updatedAt: new Date("2024-06-25"),
            },
          },
          {
            id: "review-2",
            rating: 4,
            content: "괜찮은 서비스",
            status: "COMPLETED",
            createdAt: new Date("2024-07-12"),
            updatedAt: new Date("2024-07-12"),
            customerId: "customer-2",
            estimateRequestId: "request-2",
            moverId: "mover-1",
            writer: {
              id: "customer-2",
              nickname: "고객2",
              customerImage: "image2.jpg",
              shortIntro: "안전한 이사를 원합니다",
              detailIntro:
                "신뢰할 수 있는 기사님과 함께하는 이사를 원하는 고객입니다.",
            },
            request: {
              id: "request-2",
              moveType: "OFFICE",
              moveDate: new Date("2024-07-13"),
              description: "사무실 이사 서비스",
              fromAddress: {
                id: "addr-3",
                city: "대구",
                district: "중구",
                detail: "201동 303호",
                region: "DAEGU",
                zoneCode: "41911",
              },
              toAddress: {
                id: "addr-4",
                city: "인천",
                district: "연수구",
                detail: "401동 505호",
                region: "INCHEON",
                zoneCode: "22001",
              },
              estimates: [
                {
                  id: "estimate-2",
                  price: 250000,
                  comment: "전문적인 사무실 이사 서비스",
                  status: "ACCEPTED",
                  isDesignated: false,
                  validUntil: new Date("2024-07-20"),
                  createdAt: new Date("2024-06-26"),
                  updatedAt: new Date("2024-06-26"),
                },
              ],
              createdAt: new Date("2024-06-21"),
              updatedAt: new Date("2024-06-26"),
            },
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      mockRepository.getReceivedReviews.mockResolvedValue(mockReviews as any);

      // Exercise
      const result = await ReviewService.getReceivedReviews("user-1", {
        page: 1,
        pageSize: 10,
      });

      // Assertion
      expect(mockRepository.getReceivedReviews).toHaveBeenCalledWith("user-1", {
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual({
        success: true,
        message: "기사님 리뷰 목록입니다.",
        data: {
          items: expect.arrayContaining([
            expect.objectContaining({
              id: "review-1",
              rating: 5,
              content: "좋은 서비스",
              status: "COMPLETED",
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              description: expect.any(String),
              moveDate: expect.any(String),
              customer: expect.objectContaining({
                id: "customer-1",
                profileImage: "image1.jpg",
                nickname: "고객1",
                shortIntro: "깔끔한 이사를 원합니다",
                detailIntro: "신중하고 꼼꼼한 이사 서비스를 원하는 고객입니다.",
              }),
              moveType: "HOME",
              fromAddress: expect.objectContaining({
                id: "addr-1",
                city: "서울",
                district: "강남구",
                detail: "101동 202호",
                region: "SEOUL",
                zoneCode: "06123",
              }),
              toAddress: expect.objectContaining({
                id: "addr-2",
                city: "부산",
                district: "해운대구",
                detail: "301동 404호",
                region: "BUSAN",
                zoneCode: "48001",
              }),
              estimate: expect.objectContaining({
                id: "estimate-1",
                price: 180000,
                comment: "신속하고 안전한 이사 서비스",
                status: "ACCEPTED",
                isDesignated: true,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                validUntil: expect.any(String),
              }),
              estimateRequest: expect.objectContaining({
                id: "request-1",
                status: null,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            }),
            expect.objectContaining({
              id: "review-2",
              rating: 4,
              content: "괜찮은 서비스",
              status: "COMPLETED",
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              description: expect.any(String),
              moveDate: expect.any(String),
              customer: expect.objectContaining({
                id: "customer-2",
                profileImage: "image2.jpg",
                nickname: "고객2",
                shortIntro: "안전한 이사를 원합니다",
                detailIntro:
                  "신뢰할 수 있는 기사님과 함께하는 이사를 원하는 고객입니다.",
              }),
              moveType: "OFFICE",
              fromAddress: expect.objectContaining({
                id: "addr-3",
                city: "대구",
                district: "중구",
                detail: "201동 303호",
                region: "DAEGU",
                zoneCode: "41911",
              }),
              toAddress: expect.objectContaining({
                id: "addr-4",
                city: "인천",
                district: "연수구",
                detail: "401동 505호",
                region: "INCHEON",
                zoneCode: "22001",
              }),
              estimate: expect.objectContaining({
                id: "estimate-2",
                price: 250000,
                comment: "전문적인 사무실 이사 서비스",
                status: "ACCEPTED",
                isDesignated: false,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                validUntil: expect.any(String),
              }),
              estimateRequest: expect.objectContaining({
                id: "request-2",
                status: null,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            }),
          ]),
          total: 2,
          page: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("레포지토리 에러 시 에러를 던진다", async () => {
      // Setup
      const error = new Error("레포지토리 에러");
      mockRepository.getReceivedReviews.mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        ReviewService.getReceivedReviews("user-1", { page: 1, pageSize: 10 })
      ).rejects.toThrow("레포지토리 에러");
      expect(mockRepository.getReceivedReviews).toHaveBeenCalledWith("user-1", {
        page: 1,
        pageSize: 10,
      });
    });
  });
});
