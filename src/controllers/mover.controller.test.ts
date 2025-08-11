// @ts-nocheck

import {
  getMoverListController,
  getFavoriteMoversController,
  getMoverDetailController,
  postDesignatedQuoteRequestController,
  getDesignatedQuoteRequestCheckController,
  checkActiveEstimateRequestController,
} from "./mover.controller";

jest.mock("../services/mover.service", () => ({
  fetchMoverList: jest.fn(),
  fetchFavoriteMovers: jest.fn(),
  fetchMoverDetail: jest.fn(),
  requestDesignatedQuote: jest.fn(),
  checkDesignatedQuoteRequest: jest.fn(),
}));

jest.mock("../services/estimateRequest.service", () => {
  const mockEstimateRequestService = {
    hasActiveRequestBeforeMoveDate: jest.fn(),
  };
  return jest.fn().mockImplementation(() => mockEstimateRequestService);
});

import * as moverService from "../services/mover.service";

const mockMoverService = moverService as jest.Mocked<typeof moverService>;

// 공통 Mock 데이터 팩토리 함수들
const createMockRequest = (overrides = {}) => ({
  user: {
    userId: "test-user-id",
    name: "테스트 유저",
    userType: "CUSTOMER",
  },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const createMockMover = (overrides = {}) => ({
  id: "user_123",
  nickname: "김기사",
  name: "김***",
  career: 10,
  shortIntro: "10년 경력의 믿을만한 기사입니다",
  detailIntro: "안전하고 신속한 이사를 약속드립니다",
  workedCount: 150,
  averageRating: 4.5,
  totalReviewCount: 89,
  serviceTypes: ["HOME", "OFFICE"],
  favoriteCount: 23,
  moverImage: "https://example.com/profile.jpg",
  currentAreas: ["SEOUL", "GYEONGGI"],
  serviceAreas: ["SEOUL", "GYEONGGI"],
  ...overrides,
});

describe("MoverController - 유닛 테스트", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getMoverListController", () => {
    it("기사님 목록을 성공적으로 조회한다", async () => {
      const mockMovers = [
        createMockMover(),
        createMockMover({
          id: "user_124",
          nickname: "이기사",
          name: "이***",
          career: 8,
          shortIntro: "8년차 전문 이사업체 운영",
          detailIntro: "대형 이사부터 소형 이사까지 모든 것을 처리합니다",
          workedCount: 120,
          averageRating: 4.8,
          totalReviewCount: 65,
          serviceTypes: ["SMALL", "HOME"],
          favoriteCount: 15,
        }),
      ];

      const mockResponse = {
        items: mockMovers,
        nextCursor: "next-cursor",
        hasNext: true,
      };

      mockReq.query = {
        region: "서울특별시",
        serviceTypeId: "2",
        search: "김기사",
        sort: "rating",
        take: "10",
      };

      mockMoverService.fetchMoverList.mockResolvedValue(mockResponse);

      await getMoverListController(mockReq, mockRes, mockNext);

      expect(mockMoverService.fetchMoverList).toHaveBeenCalledWith({
        region: "서울특별시",
        serviceType: "2",
        search: "김기사",
        sort: "rating",
        cursor: undefined,
        take: 10,
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "기사님 목록을 성공적으로 조회했습니다.",
        data: {
          items: mockMovers,
          nextCursor: "next-cursor",
          hasNext: true,
        },
      });
    });

    it("기본 파라미터로 기사님 목록을 조회한다", async () => {
      const mockMovers = [createMockMover()];
      const mockResponse = {
        items: mockMovers,
        nextCursor: null,
        hasNext: false,
      };

      mockMoverService.fetchMoverList.mockResolvedValue(mockResponse);

      await getMoverListController(mockReq, mockRes, mockNext);

      expect(mockMoverService.fetchMoverList).toHaveBeenCalledWith({
        region: undefined,
        serviceType: undefined,
        search: undefined,
        sort: "review",
        cursor: undefined,
        take: undefined,
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "기사님 목록을 성공적으로 조회했습니다.",
        data: mockResponse,
      });
    });

    it("잘못된 정렬 옵션을 기본값으로 처리한다", async () => {
      const mockMovers = [createMockMover()];
      const mockResponse = {
        items: mockMovers,
        nextCursor: null,
        hasNext: false,
      };

      mockReq.query = { sort: "invalid-sort" };
      mockMoverService.fetchMoverList.mockResolvedValue(mockResponse);

      await getMoverListController(mockReq, mockRes, mockNext);

      expect(mockMoverService.fetchMoverList).toHaveBeenCalledWith({
        region: undefined,
        serviceType: undefined,
        search: undefined,
        sort: "review", // 기본값으로 변경됨
        cursor: undefined,
        take: undefined,
      });
    });

    it("서비스 에러를 next로 전달한다", async () => {
      const error = new Error("서비스 에러");
      mockMoverService.fetchMoverList.mockRejectedValue(error);

      await getMoverListController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getFavoriteMoversController", () => {
    it("찜한 기사님 목록을 성공적으로 조회한다", async () => {
      const mockMovers = [createMockMover()];

      mockMoverService.fetchFavoriteMovers.mockResolvedValue(mockMovers);

      await getFavoriteMoversController(mockReq, mockRes, mockNext);

      expect(mockMoverService.fetchFavoriteMovers).toHaveBeenCalledWith(
        "test-user-id"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "찜한 기사님 목록을 성공적으로 조회했습니다.",
        data: mockMovers,
      });
    });

    it("빈 찜 목록을 반환한다", async () => {
      mockMoverService.fetchFavoriteMovers.mockResolvedValue([]);

      await getFavoriteMoversController(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "찜한 기사님 목록을 성공적으로 조회했습니다.",
        data: [],
      });
    });

    it("서비스 에러를 next로 전달한다", async () => {
      const error = new Error("서비스 에러");
      mockMoverService.fetchFavoriteMovers.mockRejectedValue(error);

      await getFavoriteMoversController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getMoverDetailController", () => {
    it("기사님 상세 정보를 성공적으로 조회한다", async () => {
      const mockMover = createMockMover({
        isFavorited: true,
        activeEstimateRequest: {
          id: 42,
          status: "PENDING",
          moveDate: "2025-08-15T09:00:00.000Z",
        },
      });

      mockReq.params = { moverId: "user_123" };
      mockMoverService.fetchMoverDetail.mockResolvedValue(mockMover);

      await getMoverDetailController(mockReq, mockRes, mockNext);

      expect(mockMoverService.fetchMoverDetail).toHaveBeenCalledWith(
        "user_123",
        "test-user-id"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "기사님 상세 조회 성공",
        data: mockMover,
      });
    });

    it("moverId가 없을 때 400 에러를 반환한다", async () => {
      mockReq.params = { moverId: "" };

      await getMoverDetailController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "id가 필요합니다.",
        data: null,
      });
    });

    it("존재하지 않는 기사님일 때 404 에러를 반환한다", async () => {
      mockReq.params = { moverId: "invalid-id" };
      mockMoverService.fetchMoverDetail.mockResolvedValue(null);

      await getMoverDetailController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "존재하지 않는 기사님",
        data: null,
      });
    });

    it("서비스 에러를 next로 전달한다", async () => {
      const error = new Error("서비스 에러");
      mockReq.params = { moverId: "user_123" };
      mockMoverService.fetchMoverDetail.mockRejectedValue(error);

      await getMoverDetailController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("postDesignatedQuoteRequestController", () => {
    it("지정 견적 요청을 성공적으로 생성한다", async () => {
      const mockRequest = {
        id: "request-1",
        quoteId: "quote-1",
        moverId: "mover-1",
        message: "지정 견적 요청합니다.",
        status: "PENDING",
        createdAt: new Date(),
      };

      mockReq.params = { moverId: "mover-1" };
      mockReq.body = {
        quoteId: "quote-1",
        message: "지정 견적 요청합니다.",
        expiresAt: "2024-12-31T23:59:59.999Z",
      };

      mockMoverService.requestDesignatedQuote.mockResolvedValue(mockRequest);

      await postDesignatedQuoteRequestController(mockReq, mockRes, mockNext);

      expect(mockMoverService.requestDesignatedQuote).toHaveBeenCalledWith({
        quoteId: "quote-1",
        moverId: "mover-1",
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "지정 견적 요청이 성공적으로 생성되었습니다.",
        data: mockRequest,
      });
    });

    it("필수 필드가 없을 때 400 에러를 반환한다", async () => {
      mockReq.params = { moverId: "mover-1" };
      mockReq.body = {};

      await postDesignatedQuoteRequestController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "필수값 누락",
      });
    });

    it("서비스 에러를 처리한다", async () => {
      const error = new Error("서비스 에러");
      mockReq.params = { moverId: "mover-1" };
      mockReq.body = {
        quoteId: "quote-1",
        message: "지정 견적 요청합니다.",
        expiresAt: "2024-12-31T23:59:59.999Z",
      };

      mockMoverService.requestDesignatedQuote.mockRejectedValue(error);

      await postDesignatedQuoteRequestController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "서비스 에러",
      });
    });
  });

  describe("getDesignatedQuoteRequestCheckController", () => {
    it("지정 견적 요청 상태를 성공적으로 조회한다", async () => {
      const mockRequest = {
        id: "request-1",
        createdAt: new Date(),
      };

      mockReq.params = { moverId: "mover-1" };
      mockReq.query = { quoteId: "quote-1" };

      mockMoverService.checkDesignatedQuoteRequest.mockResolvedValue(
        mockRequest
      );

      await getDesignatedQuoteRequestCheckController(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockMoverService.checkDesignatedQuoteRequest).toHaveBeenCalledWith(
        {
          quoteId: "quote-1",
          moverId: "mover-1",
        }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "지정 견적 요청 여부 조회 성공",
        data: {
          hasRequested: true,
          status: null,
          requestId: "request-1",
        },
      });
    });

    it("존재하지 않는 요청을 조회한다", async () => {
      mockReq.params = { moverId: "mover-1" };
      mockReq.query = { quoteId: "quote-1" };

      mockMoverService.checkDesignatedQuoteRequest.mockResolvedValue(null);

      await getDesignatedQuoteRequestCheckController(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "지정 견적 요청 여부 조회 성공",
        data: {
          hasRequested: false,
          status: null,
          requestId: null,
        },
      });
    });

    it("서비스 에러를 처리한다", async () => {
      const error = new Error("서비스 에러");
      mockReq.params = { moverId: "mover-1" };
      mockReq.query = { quoteId: "quote-1" };

      mockMoverService.checkDesignatedQuoteRequest.mockRejectedValue(error);

      await getDesignatedQuoteRequestCheckController(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("checkActiveEstimateRequestController", () => {
    let mockEstimateRequestService: any;

    beforeEach(() => {
      // 동적 import된 서비스 모킹
      jest.doMock("../services/estimateRequest.service", () => {
        mockEstimateRequestService = {
          hasActiveRequestBeforeMoveDate: jest.fn(),
        };
        return jest.fn().mockImplementation(() => mockEstimateRequestService);
      });
    });

    it("활성 견적 요청이 있을 때 성공적으로 조회한다", async () => {
      mockReq.user = {
        userId: "customer-1",
        name: "고객1",
        userType: "CUSTOMER",
      };

      mockEstimateRequestService = {
        hasActiveRequestBeforeMoveDate: jest.fn().mockResolvedValue(true),
      };

      // 동적 import 모킹
      jest.doMock("../services/estimateRequest.service", () => {
        return jest.fn().mockImplementation(() => mockEstimateRequestService);
      });

      await checkActiveEstimateRequestController(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "이사일이 지나지 않은 견적 확인 성공",
        data: {
          hasActiveRequest: true,
        },
      });
    });

    it("활성 견적 요청이 없을 때 성공적으로 조회한다", async () => {
      mockReq.user = {
        userId: "customer-1",
        name: "고객1",
        userType: "CUSTOMER",
      };

      mockEstimateRequestService = {
        hasActiveRequestBeforeMoveDate: jest.fn().mockResolvedValue(false),
      };

      // 동적 import 모킹
      jest.doMock("../services/estimateRequest.service", () => {
        return jest.fn().mockImplementation(() => mockEstimateRequestService);
      });

      await checkActiveEstimateRequestController(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "이사일이 지나지 않은 견적 확인 성공",
        data: {
          hasActiveRequest: false,
        },
      });
    });

    it("고객이 아닌 사용자가 요청할 때 401 에러를 반환한다", async () => {
      mockReq.user = {
        userId: "mover-1",
        name: "기사1",
        userType: "MOVER",
      };

      await checkActiveEstimateRequestController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "회원만 확인이 가능합니다.",
      });
    });

    it("userType이 배열일 때 CUSTOMER 포함 여부를 확인한다", async () => {
      mockReq.user = {
        userId: "user-1",
        name: "사용자1",
        userType: ["CUSTOMER", "MOVER"],
      };

      mockEstimateRequestService = {
        hasActiveRequestBeforeMoveDate: jest.fn().mockResolvedValue(true),
      };

      // 동적 import 모킹
      jest.doMock("../services/estimateRequest.service", () => {
        return jest.fn().mockImplementation(() => mockEstimateRequestService);
      });

      await checkActiveEstimateRequestController(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "이사일이 지나지 않은 견적 확인 성공",
        data: {
          hasActiveRequest: true,
        },
      });
    });

    it("서비스 에러를 next로 전달한다", async () => {
      const error = new Error("서비스 에러");
      mockReq.user = {
        userId: "customer-1",
        name: "고객1",
        userType: "CUSTOMER",
      };

      mockEstimateRequestService = {
        hasActiveRequestBeforeMoveDate: jest.fn().mockRejectedValue(error),
      };

      // 동적 import 모킹
      jest.doMock("../services/estimateRequest.service", () => {
        return jest.fn().mockImplementation(() => mockEstimateRequestService);
      });

      await checkActiveEstimateRequestController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
