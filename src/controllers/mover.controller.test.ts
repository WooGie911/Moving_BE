// @ts-nocheck

import {
  getMoverListController,
  getFavoriteMoversController,
  getMoverDetailController,
  postDesignatedQuoteRequestController,
  getDesignatedQuoteRequestCheckController,
} from "./mover.controller";

jest.mock("../services/mover.service", () => ({
  fetchMoverList: jest.fn(),
  fetchFavoriteMovers: jest.fn(),
  fetchMoverDetail: jest.fn(),
  requestDesignatedQuote: jest.fn(),
  checkDesignatedQuoteRequest: jest.fn(),
}));

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
  id: "mover-1",
  nickname: "김기사",
  experience: 10,
  avgRating: 4.5,
  completedCount: 150,
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
          id: "mover-2",
          nickname: "이기사",
          experience: 8,
          avgRating: 4.8,
          completedCount: 120,
        }),
      ];

      const mockResponse = {
        items: mockMovers,
        nextCursor: "next-cursor",
        hasNext: true,
      };

      mockReq.query = {
        region: "서울특별시",
        serviceTypeId: "HOME",
        search: "김기사",
        sort: "rating",
        take: "10",
      };

      mockMoverService.fetchMoverList.mockResolvedValue(mockResponse);

      await getMoverListController(mockReq, mockRes, mockNext);

      expect(mockMoverService.fetchMoverList).toHaveBeenCalledWith({
        region: "서울특별시",
        serviceType: "HOME",
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
      const mockMover = createMockMover({ isFavorited: true });

      mockReq.params = { moverId: "mover-1" };
      mockMoverService.fetchMoverDetail.mockResolvedValue(mockMover);

      await getMoverDetailController(mockReq, mockRes, mockNext);

      expect(mockMoverService.fetchMoverDetail).toHaveBeenCalledWith(
        "mover-1",
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
      mockReq.params = { moverId: "mover-1" };
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
        message: "지정 견적 요청합니다.",
        expiresAt: new Date("2024-12-31T23:59:59.999Z"),
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "지정 견적 요청이 성공적으로 생성되었습니다.",
        data: mockRequest,
      });
    });

    it("필수 필드가 없을 때 400 에러를 반환한다", async () => {
      mockReq.params = { moverId: "mover-1" };
      mockReq.body = { message: "지정 견적 요청합니다." };

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
        message: "테스트 메시지",
        expiresAt: new Date(),
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
          requestId: "request-1",
          message: "테스트 메시지",
          expiresAt: mockRequest.expiresAt,
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
          requestId: null,
          message: null,
          expiresAt: null,
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
});
