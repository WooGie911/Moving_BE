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
}));

import * as moverRepository from "../repositories/mover.repository";

const mockMoverRepository = moverRepository as jest.Mocked<
  typeof moverRepository
>;

const createMockMover = (overrides = {}) => ({
  id: "mover-1",
  nickname: "김기사",
  name: "김기사",
  career: 10,
  shortIntro: "안전한 이사 서비스",
  detailIntro: "안전하고 신뢰할 수 있는 이사 서비스",
  workedCount: 150,
  averageRating: 4.5,
  totalReviewCount: 45,
  Favorite: [],
  serviceAreas: ["서울특별시"],
  serviceTypes: ["HOME"],
  moverImage: "profile.jpg",
  ...overrides,
});

const createTransformedMover = (overrides = {}) => ({
  id: "mover-1",
  userId: 0,
  nickname: "김기사",
  profileImage: "profile.jpg",
  experience: 10,
  introduction: "안전한 이사 서비스",
  description: "안전하고 신뢰할 수 있는 이사 서비스",
  completedCount: 150,
  avgRating: 4.5,
  reviewCount: 45,
  favoriteCount: 0,
  lastActivityAt: null,
  user: {
    id: 0,
    name: "김기사",
    email: "",
  },
  serviceRegions: ["서울특별시"],
  serviceTypes: [
    {
      service: {
        name: "가정이사",
      },
    },
  ],
  ...overrides,
});

describe("MoverService - 유닛 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchMoverList", () => {
    it("기사님 목록을 성공적으로 조회한다", async () => {
      const mockRepositoryResponse = {
        items: [createMockMover()],
        nextCursor: "next-cursor",
        hasNext: true,
      };

      const filter = {
        region: "서울특별시",
        serviceType: "HOME",
        search: "김기사",
        sort: "rating",
        cursor: "cursor",
        take: 10,
      };

      mockMoverRepository.getMoverList.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await fetchMoverList(filter);

      expect(mockMoverRepository.getMoverList).toHaveBeenCalledWith(filter);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(createTransformedMover());
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

      mockMoverRepository.getMoverList.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await fetchMoverList(filter);

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
      expect(result.hasNext).toBe(false);
    });

    it("서비스 타입 변환을 올바르게 처리한다", async () => {
      const mockRepositoryResponse = {
        items: [
          createMockMover({
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

      mockMoverRepository.getMoverList.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await fetchMoverList(filter);

      expect(result.items[0].serviceTypes[0].service.name).toBe("소형이사");
    });

    it("찜 개수를 올바르게 계산한다", async () => {
      const mockRepositoryResponse = {
        items: [
          createMockMover({
            Favorite: [
              { deletedAt: null },
              { deletedAt: null },
              { deletedAt: new Date() },
            ],
            serviceAreas: [],
            serviceTypes: [],
            moverImage: null,
          }),
        ],
        nextCursor: null,
        hasNext: false,
      };

      const filter = {};

      mockMoverRepository.getMoverList.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await fetchMoverList(filter);

      expect(result.items[0].favoriteCount).toBe(2);
    });
  });

  describe("fetchFavoriteMovers", () => {
    it("찜한 기사님 목록을 성공적으로 조회한다", async () => {
      const customerId = "customer-1";
      const mockRepositoryResponse = [createMockMover({ favoriteCount: 5 })];

      mockMoverRepository.getFavoriteMovers.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await fetchFavoriteMovers(customerId);

      expect(mockMoverRepository.getFavoriteMovers).toHaveBeenCalledWith(
        customerId
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(createTransformedMover({ favoriteCount: 5 }));
    });

    it("빈 찜 목록을 반환한다", async () => {
      const customerId = "customer-1";

      mockMoverRepository.getFavoriteMovers.mockResolvedValue(null as any);

      const result = await fetchFavoriteMovers(customerId);

      expect(result).toEqual([]);
    });
  });

  describe("fetchMoverDetail", () => {
    it("기사님 상세 정보를 성공적으로 조회한다", async () => {
      const moverId = "mover-1";
      const userId = "customer-1";
      const mockRepositoryResponse = createMockMover({
        favoriteCount: 5,
        isFavorited: true,
      });

      mockMoverRepository.getMoverDetail.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await fetchMoverDetail(moverId, userId);

      expect(mockMoverRepository.getMoverDetail).toHaveBeenCalledWith(
        moverId,
        userId
      );
      expect(result).toEqual(
        createTransformedMover({
          favoriteCount: 5,
          isFavorited: true,
        })
      );
    });

    it("존재하지 않는 기사님을 조회한다", async () => {
      const moverId = "invalid-id";
      const userId = "customer-1";

      mockMoverRepository.getMoverDetail.mockResolvedValue(null);

      const result = await fetchMoverDetail(moverId, userId);

      expect(result).toBeNull();
    });

    it("로그인하지 않은 사용자가 조회한다", async () => {
      const moverId = "mover-1";
      const userId = undefined;
      const mockRepositoryResponse = createMockMover({
        favoriteCount: 5,
        isFavorited: false,
      });

      mockMoverRepository.getMoverDetail.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await fetchMoverDetail(moverId, userId);

      expect(result?.isFavorited).toBe(false);
    });
  });

  describe("requestDesignatedQuote", () => {
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

      mockMoverRepository.createDesignatedEstimateRequest.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await requestDesignatedQuote(dto);

      expect(
        mockMoverRepository.createDesignatedEstimateRequest
      ).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockRepositoryResponse);
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

      mockMoverRepository.checkDesignatedEstimateRequest.mockResolvedValue(
        mockRepositoryResponse as any
      );

      const result = await checkDesignatedQuoteRequest(params);

      expect(
        mockMoverRepository.checkDesignatedEstimateRequest
      ).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockRepositoryResponse);
    });

    it("존재하지 않는 요청을 조회한다", async () => {
      const params = {
        quoteId: "quote-1",
        moverId: "mover-1",
      };

      mockMoverRepository.checkDesignatedEstimateRequest.mockResolvedValue(
        null
      );

      const result = await checkDesignatedQuoteRequest(params);

      expect(result).toBeNull();
    });
  });
});
