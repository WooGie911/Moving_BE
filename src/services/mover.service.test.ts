import {
  fetchMoverList,
  fetchFavoriteMovers,
  fetchMoverDetail,
  requestDesignatedQuote,
  checkDesignatedQuoteRequest,
} from "./mover.service";

jest.mock("../repositories/mover.repository", () => ({
  getMoverList: jest.fn(),
  getFavoriteMovers: jest.fn(),
  getMoverDetail: jest.fn(),
  createDesignatedEstimateRequest: jest.fn(),
  checkDesignatedEstimateRequest: jest.fn(),
  checkEstimateRequestStatus: jest.fn(),
}));

import {
  getMoverList,
  getFavoriteMovers,
  getMoverDetail,
  createDesignatedEstimateRequest,
  checkDesignatedEstimateRequest,
  checkEstimateRequestStatus,
} from "../repositories/mover.repository";

const mockGetMoverList = getMoverList as jest.MockedFunction<
  typeof getMoverList
>;
const mockGetFavoriteMovers = getFavoriteMovers as jest.MockedFunction<
  typeof getFavoriteMovers
>;
const mockGetMoverDetail = getMoverDetail as jest.MockedFunction<
  typeof getMoverDetail
>;
const mockCreateDesignatedEstimateRequest =
  createDesignatedEstimateRequest as jest.MockedFunction<
    typeof createDesignatedEstimateRequest
  >;
const mockCheckDesignatedEstimateRequest =
  checkDesignatedEstimateRequest as jest.MockedFunction<
    typeof checkDesignatedEstimateRequest
  >;
const mockCheckEstimateRequestStatus =
  checkEstimateRequestStatus as jest.MockedFunction<
    typeof checkEstimateRequestStatus
  >;

// Repository에서 반환하는 구조
const createMockRepositoryMover = (overrides = {}) => ({
  id: "user_123",
  nickname: "김기사",
  name: "김***",
  career: 10,
  shortIntro: "안전한 이사 서비스",
  detailIntro: "안전하고 신뢰할 수 있는 이사 서비스",
  workedCount: 150,
  averageRating: 4.5,
  totalReviewCount: 45,
  serviceTypes: ["HOME"],
  favoriteCount: 23,
  moverImage: "profile.jpg",
  currentAreas: ["SEOUL"],
  Favorite: [
    ...Array(23)
      .fill(null)
      .map((_, i) => ({
        id: `fav_${i}`,
        deletedAt: null,
      })),
  ],
  ...overrides,
});

// Service에서 변환 후 반환하는 구조 (기사님 목록용)
const createMockTransformedMover = (overrides = {}) => ({
  id: "user_123",
  userId: 0,
  nickname: "김기사",
  profileImage: "profile.jpg",
  experience: 10,
  introduction: "안전한 이사 서비스",
  description: "안전하고 신뢰할 수 있는 이사 서비스",
  completedCount: 150,
  averageRating: 4.5,
  totalReviewCount: 45,
  favoriteCount: 23,
  lastActivityAt: null,
  user: {
    id: 0,
    name: "김***",
    email: "",
  },
  serviceRegions: [
    {
      region: "SEOUL",
      district: null,
    },
  ],
  serviceTypes: [
    {
      service: {
        name: "가정이사",
      },
    },
  ],
  ...overrides,
});

// 찜한 기사님용 (serviceAreas 있는 Repository 구조)
const createMockRepositoryFavoriteMover = (overrides = {}) => ({
  ...createMockRepositoryMover(),
  serviceAreas: ["SEOUL"],
  ...overrides,
});

// 기사님 상세용 (isFavorited, activeEstimateRequest 추가)
const createMockTransformedMoverDetail = (overrides = {}) => ({
  ...createMockTransformedMover(),
  isFavorited: false,
  activeEstimateRequest: null,
  ...overrides,
});

describe("MoverService - 유닛 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchMoverList", () => {
    it("기사님 목록을 성공적으로 조회한다", async () => {
      const mockRepositoryResponse = {
        items: [createMockRepositoryMover()],
        nextCursor: "next-cursor",
        hasNext: true,
      };

      const filter = {
        region: "서울특별시",
        serviceType: "2",
        search: "김기사",
        sort: "rating",
        cursor: "cursor",
        take: 10,
      };

      mockGetMoverList.mockResolvedValue(mockRepositoryResponse as any);

      const result = await fetchMoverList(filter);

      expect(mockGetMoverList).toHaveBeenCalledWith(filter);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(createMockTransformedMover());
      expect(result.nextCursor).toBe("next-cursor");
      expect(result.hasNext).toBe(true);
    });

    it("빈 목록을 반환한다", async () => {
      const mockRepositoryResponse = {
        items: [],
        nextCursor: null,
        hasNext: false,
      };

      const filter = {
        region: "존재하지않는지역",
        serviceType: undefined,
        search: undefined,
        sort: "review",
        cursor: undefined,
        take: undefined,
      };

      mockGetMoverList.mockResolvedValue(mockRepositoryResponse as any);

      const result = await fetchMoverList(filter);

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
      expect(result.hasNext).toBe(false);
    });

    it("서비스 타입이 정확히 반환된다", async () => {
      const mockRepositoryResponse = {
        items: [
          createMockRepositoryMover({
            id: "user_456",
            career: 5,
            shortIntro: "소형이사 전문",
            detailIntro: "소형이사 전문 서비스",
            workedCount: 80,
            averageRating: 4.8,
            totalReviewCount: 30,
            serviceTypes: ["SMALL"],
            moverImage: null,
          }),
        ],
        nextCursor: null,
        hasNext: false,
      };

      const filter = { region: "서울특별시" };

      mockGetMoverList.mockResolvedValue(mockRepositoryResponse as any);

      const result = await fetchMoverList(filter);

      expect(result.items[0].serviceTypes).toEqual([
        {
          service: {
            name: "소형이사",
          },
        },
      ]);
    });
  });

  describe("fetchFavoriteMovers", () => {
    it("찜한 기사님 목록을 성공적으로 조회한다", async () => {
      const customerId = "customer-1";
      const mockRepositoryResponse = [
        createMockRepositoryFavoriteMover({ favoriteCount: 5 }),
      ];

      mockGetFavoriteMovers.mockResolvedValue(mockRepositoryResponse as any);

      const result = await fetchFavoriteMovers(customerId);

      expect(mockGetFavoriteMovers).toHaveBeenCalledWith(customerId);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        createMockTransformedMover({ favoriteCount: 5 })
      );
    });

    it("빈 찜 목록을 반환한다", async () => {
      const customerId = "customer-1";

      mockGetFavoriteMovers.mockResolvedValue(null as any);

      const result = await fetchFavoriteMovers(customerId);

      expect(result).toEqual([]);
    });
  });

  describe("fetchMoverDetail", () => {
    it("기사님 상세 정보를 성공적으로 조회한다", async () => {
      const moverId = "user_123";
      const userId = "customer-1";
      const mockRepositoryResponse = createMockRepositoryMover({
        favoriteCount: 5,
        isFavorited: true,
        activeEstimateRequest: {
          id: 42,
          status: "PENDING",
          moveDate: "2025-08-15T09:00:00.000Z",
        },
      });

      mockGetMoverDetail.mockResolvedValue(mockRepositoryResponse as any);

      const result = await fetchMoverDetail(moverId, userId);

      expect(mockGetMoverDetail).toHaveBeenCalledWith(moverId, userId);
      expect(result).toEqual(
        createMockTransformedMoverDetail({
          favoriteCount: 5,
          isFavorited: true,
          activeEstimateRequest: {
            id: 42,
            status: "PENDING",
            moveDate: "2025-08-15T09:00:00.000Z",
          },
        })
      );
    });

    it("존재하지 않는 기사님을 조회한다", async () => {
      const moverId = "invalid-id";
      const userId = "customer-1";

      mockGetMoverDetail.mockResolvedValue(null);

      const result = await fetchMoverDetail(moverId, userId);

      expect(result).toBeNull();
    });

    it("로그인하지 않은 사용자가 조회한다", async () => {
      const moverId = "user_123";
      const userId = undefined;
      const mockRepositoryResponse = createMockRepositoryMover({
        favoriteCount: 5,
        isFavorited: false,
        activeEstimateRequest: null,
      });

      mockGetMoverDetail.mockResolvedValue(mockRepositoryResponse as any);

      const result = await fetchMoverDetail(moverId, userId);

      expect(result?.isFavorited).toBe(false);
      expect(result?.activeEstimateRequest).toBeNull();
    });
  });

  describe("requestDesignatedQuote", () => {
    beforeEach(() => {
      // estimateRequestRepository와 actionService Mock 추가
      jest.doMock("../repositories/estimateRequest.repository", () => ({
        getEstimateRequestDetailForAction: jest.fn().mockResolvedValue({
          id: "quote-1",
          customerId: "customer-1",
          moveType: "HOME",
        }),
      }));
      jest.doMock("./action.service", () => ({
        default: {
          createAction: jest.fn().mockResolvedValue({ id: "action-1" }),
        },
      }));
    });

    it("지정 견적 요청을 성공적으로 생성한다", async () => {
      const dto = {
        quoteId: "quote-1",
        moverId: "mover-1",
        message: "지정 견적 요청합니다.",
        expiresAt: new Date(),
      };

      const mockRepositoryResponse = {
        id: "request-1",
        quoteId: "quote-1",
        moverId: "mover-1",
        message: "지정 견적 요청합니다.",
        status: "PENDING",
        createdAt: new Date(),
      };

      // 견적 상태 확인 Mock
      mockCheckEstimateRequestStatus.mockResolvedValue({
        isValid: true,
      });

      mockCreateDesignatedEstimateRequest.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await requestDesignatedQuote(dto);

      expect(mockCheckEstimateRequestStatus).toHaveBeenCalledWith(dto.quoteId);
      expect(mockCreateDesignatedEstimateRequest).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockRepositoryResponse);
    });

    it("견적 상태가 유효하지 않을 때 에러를 발생시킨다", async () => {
      const dto = {
        quoteId: "quote-1",
        moverId: "mover-1",
        message: "지정 견적 요청합니다.",
        expiresAt: new Date(),
      };

      // 견적 상태 확인 Mock - 유효하지 않음
      mockCheckEstimateRequestStatus.mockResolvedValue({
        isValid: false,
        reason: "확정되거나 완료된 견적에는 지정 견적을 요청할 수 없습니다.",
      });

      await expect(requestDesignatedQuote(dto)).rejects.toThrow(
        "확정되거나 완료된 견적에는 지정 견적을 요청할 수 없습니다."
      );

      expect(mockCheckEstimateRequestStatus).toHaveBeenCalledWith(dto.quoteId);
      expect(mockCreateDesignatedEstimateRequest).not.toHaveBeenCalled();
    });
  });

  describe("checkDesignatedQuoteRequest", () => {
    it("지정 견적 요청 상태를 성공적으로 조회한다", async () => {
      const params = {
        quoteId: "quote-1",
        moverId: "mover-1",
      };

      const mockRepositoryResponse = {
        id: "request-1",
        message: "테스트 메시지",
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockCheckDesignatedEstimateRequest.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await checkDesignatedQuoteRequest(params);

      expect(mockCheckDesignatedEstimateRequest).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockRepositoryResponse);
    });

    it("존재하지 않는 요청을 조회한다", async () => {
      const params = {
        quoteId: "quote-1",
        moverId: "mover-1",
      };

      mockCheckDesignatedEstimateRequest.mockResolvedValue(null);

      const result = await checkDesignatedQuoteRequest(params);

      expect(result).toBeNull();
    });
  });
});
