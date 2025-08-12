const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  favorite: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  designatedMover: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  estimateRequest: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  NotificationType: {
    WELCOME: "WELCOME",
    ESTIMATE_REQUEST_ARRIVED: "ESTIMATE_REQUEST_ARRIVED",
    ESTIMATE_ARRIVED: "ESTIMATE_ARRIVED",
  },
  ActionType: {
    WELCOME: "WELCOME",
    ESTIMATE_REQUEST_CREATE: "ESTIMATE_REQUEST_CREATE",
    ESTIMATE_SUBMITTED: "ESTIMATE_SUBMITTED",
  },
}));

import moverRepository from "./mover.repository";

describe("MoverRepository - 유닛 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMoverList", () => {
    it("기사님 목록을 성공적으로 조회한다", async () => {
      const filter = {
        region: "서울",
        serviceType: "1",
        search: "김기사",
        sort: "review",
        take: 10,
      };

      const mockMovers = [
        {
          id: "user_123",
          nickname: "김기사",
          name: "김***",
          career: 5,
          shortIntro: "안녕하세요",
          detailIntro: "상세 소개입니다",
          workedCount: 100,
          averageRating: 4.5,
          totalReviewCount: 10,
          serviceTypes: ["SMALL"],
          currentAreas: ["SEOUL"],
          Favorite: [
            { id: "favorite-1", deletedAt: null },
            { id: "favorite-2", deletedAt: null },
            { id: "favorite-3", deletedAt: new Date() },
          ],
          moverImage: "image1.jpg",
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockMovers);

      const result = await moverRepository.getMoverList(filter);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          userType: { has: "MOVER" },
          OR: [
            { nickname: { contains: "김기사" } },
            { name: { contains: "김기사" } },
          ],
          currentAreas: { has: "서울" },
          serviceTypes: { has: "SMALL" },
        },
        orderBy: [{ totalReviewCount: "desc" }, { id: "asc" }],
        skip: 0,
        take: 11,
        include: {
          Favorite: true,
        },
      });
      expect(result).toEqual({
        items: mockMovers,
        nextCursor: null,
        hasNext: false,
      });
    });

    it("기본 필터로 기사님 목록을 조회한다", async () => {
      const filter = {
        region: undefined,
        serviceType: undefined,
        search: undefined,
        sort: "review",
        take: 10,
      };

      const mockMovers = [
        {
          id: "mover-1",
          nickname: "김기사",
          name: "김기사",
          career: 5,
          shortIntro: "안녕하세요",
          detailIntro: "상세 소개입니다",
          workedCount: 100,
          averageRating: 4.5,
          totalReviewCount: 10,
          serviceAreas: ["SEOUL"],
          currentAreas: ["SEOUL"],
          serviceTypes: ["SMALL"],
          Favorite: [
            { id: "favorite-1", deletedAt: null },
            { id: "favorite-2", deletedAt: null },
            { id: "favorite-3", deletedAt: new Date() }, // 삭제된 찜
          ],
          moverImage: "image1.jpg",
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockMovers);

      const result = await moverRepository.getMoverList(filter);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          userType: { has: "MOVER" },
        },
        orderBy: [{ totalReviewCount: "desc" }, { id: "asc" }],
        skip: 0,
        take: 11,
        include: {
          Favorite: true,
        },
      });
      expect(result).toEqual({
        items: mockMovers,
        nextCursor: null,
        hasNext: false,
      });
    });

    it("경력순으로 정렬하여 조회한다", async () => {
      const filter = {
        region: undefined,
        serviceTypeId: undefined,
        search: undefined,
        sort: "career",
        take: 10,
        skip: 0,
      };

      await moverRepository.getMoverList(filter);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          userType: { has: "MOVER" },
        },
        orderBy: [{ career: "desc" }, { id: "asc" }],
        skip: 0,
        take: 11,
        include: {
          Favorite: true,
        },
      });
    });

    it("확정건수순으로 정렬하여 조회한다", async () => {
      const filter = {
        region: undefined,
        serviceType: undefined,
        search: undefined,
        sort: "confirmed",
        take: 10,
      };

      const mockMovers = [
        {
          id: "mover-1",
          nickname: "김기사",
          name: "김기사",
          career: 5,
          shortIntro: "안녕하세요",
          detailIntro: "상세 소개입니다",
          workedCount: 100,
          averageRating: 4.5,
          totalReviewCount: 10,
          serviceAreas: ["SEOUL"],
          currentAreas: ["SEOUL"],
          serviceTypes: ["SMALL"],
          Favorite: [
            { id: "favorite-1", deletedAt: null },
            { id: "favorite-2", deletedAt: null },
            { id: "favorite-3", deletedAt: new Date() }, // 삭제된 찜
          ],
          moverImage: "image1.jpg",
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockMovers);

      await moverRepository.getMoverList(filter);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          userType: { has: "MOVER" },
        },
        orderBy: [{ workedCount: "desc" }, { id: "asc" }],
        skip: 0,
        take: 11,
        include: {
          Favorite: true,
        },
      });
    });

    it("검색어가 있을 때 OR 조건을 추가한다", async () => {
      const filter = {
        region: undefined,
        serviceTypeId: undefined,
        search: "이사",
        sort: "totalReviewCount",
        take: 10,
        skip: 0,
      };

      await moverRepository.getMoverList(filter);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          userType: { has: "MOVER" },
          OR: [
            { nickname: { contains: "이사" } },
            { name: { contains: "이사" } },
          ],
        },
        orderBy: [{ totalReviewCount: "desc" }, { id: "asc" }],
        skip: 0,
        take: 11,
        include: {
          Favorite: true,
        },
      });
    });
  });

  describe("getFavoriteMovers", () => {
    it("찜한 기사님 목록을 성공적으로 조회한다", async () => {
      const customerId = "customer-1";
      const mockFavorites = [
        {
          id: "favorite-1",
          customerId,
          moverId: "mover-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          mover: {
            id: "mover-1",
            nickname: "김기사",
            name: "김기사",
            career: 5,
            shortIntro: "안녕하세요",
            detailIntro: "상세 소개입니다",
            workedCount: 100,
            averageRating: 4.5,
            totalReviewCount: 10,
            serviceAreas: ["SEOUL"],
            currentAreas: ["SEOUL"],
            serviceTypes: ["SMALL"],
            moverImage: "image1.jpg",
            Favorite: [
              { id: "favorite-1", deletedAt: null },
              { id: "favorite-2", deletedAt: null },
              { id: "favorite-3", deletedAt: new Date() },
            ],
          },
        },
      ];

      mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites);

      const result = await moverRepository.getFavoriteMovers(customerId);

      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({
        where: {
          customerId,
          deletedAt: null,
        },
        include: {
          mover: {
            include: {
              Favorite: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
      });
      expect(result).toEqual([
        {
          ...mockFavorites[0].mover,
          favoriteCount: 2,
        },
      ]);
    });

    it("빈 찜 목록을 반환한다", async () => {
      const customerId = "customer-1";

      mockPrisma.favorite.findMany.mockResolvedValue([]);

      const result = await moverRepository.getFavoriteMovers(customerId);

      expect(result).toEqual([]);
    });
  });

  describe("getMoverDetail", () => {
    it("기사님 상세 정보를 성공적으로 조회한다", async () => {
      const moverId = "mover-1";
      const userId = "user-1";
      const mockMover = {
        id: "mover-1",
        nickname: "김기사",
        name: "김기사",
        career: 5,
        shortIntro: "안녕하세요",
        detailIntro: "상세 소개입니다",
        workedCount: 100,
        averageRating: 4.5,
        totalReviewCount: 10,
        serviceAreas: ["SEOUL"],
        currentAreas: ["SEOUL"],
        serviceTypes: ["SMALL"],
        moverImage: "image1.jpg",
        Favorite: [
          { id: "favorite-1", deletedAt: null },
          { id: "favorite-2", deletedAt: null },
          { id: "favorite-3", deletedAt: new Date() },
        ],
      };

      const mockFavorite = {
        id: "favorite-1",
        customerId: userId,
        moverId,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockMover);
      mockPrisma.favorite.findFirst.mockResolvedValue(mockFavorite);

      const result = await moverRepository.getMoverDetail(moverId, userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: moverId, deletedAt: null },
        include: {
          Favorite: true,
        },
      });
      expect(mockPrisma.favorite.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          moverId,
          deletedAt: null,
        },
      });
      expect(result).toEqual({
        ...mockMover,
        favoriteCount: 2,
        isFavorited: true,
      });
    });

    it("찜하지 않은 기사님을 조회한다", async () => {
      const moverId = "mover-1";
      const userId = "user-1";
      const mockMover = {
        id: "mover-1",
        nickname: "김기사",
        name: "김기사",
        career: 5,
        shortIntro: "안녕하세요",
        detailIntro: "상세 소개입니다",
        workedCount: 100,
        averageRating: 4.5,
        totalReviewCount: 10,
        serviceAreas: ["SEOUL"],
        currentAreas: ["SEOUL"],
        serviceTypes: ["SMALL"],
        moverImage: "image1.jpg",
        Favorite: [
          { id: "favorite-1", deletedAt: null },
          { id: "favorite-2", deletedAt: null },
          { id: "favorite-3", deletedAt: new Date() },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockMover);
      mockPrisma.favorite.findFirst.mockResolvedValue(null);

      const result = await moverRepository.getMoverDetail(moverId, userId);

      expect(result).toEqual({
        ...mockMover,
        favoriteCount: 2,
        isFavorited: false,
      });
    });

    it("존재하지 않는 기사님을 조회한다", async () => {
      const moverId = "mover-1";
      const userId = "user-1";

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await moverRepository.getMoverDetail(moverId, userId);

      expect(result).toBeNull();
    });

    it("로그인하지 않은 사용자가 조회한다", async () => {
      const moverId = "mover-1";
      const userId = undefined;
      const mockMover = {
        id: "mover-1",
        nickname: "김기사",
        name: "김기사",
        career: 5,
        shortIntro: "안녕하세요",
        detailIntro: "상세 소개입니다",
        workedCount: 100,
        averageRating: 4.5,
        totalReviewCount: 10,
        serviceAreas: ["SEOUL"],
        currentAreas: ["SEOUL"],
        serviceTypes: ["SMALL"],
        moverImage: "image1.jpg",
        Favorite: [
          { id: "favorite-1", deletedAt: null },
          { id: "favorite-2", deletedAt: null },
          { id: "favorite-3", deletedAt: new Date() },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockMover);

      const result = await moverRepository.getMoverDetail(moverId, userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: moverId, deletedAt: null },
        include: {
          Favorite: true,
        },
      });
      expect(mockPrisma.favorite.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockMover,
        favoriteCount: 2,
        isFavorited: false,
        activeEstimateRequest: null,
      });
    });
  });

  describe("createDesignatedEstimateRequest", () => {
    it("지정 견적 요청을 성공적으로 생성한다", async () => {
      const dto = {
        quoteId: "quote-1",
        moverId: "mover-1",
      };

      const mockRequest = {
        id: "request-1",
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.designatedMover.create.mockResolvedValue(mockRequest);

      const result = await moverRepository.createDesignatedEstimateRequest(dto);

      expect(mockPrisma.designatedMover.create).toHaveBeenCalledWith({
        data: {
          estimateRequestId: dto.quoteId,
          moverId: dto.moverId,
        },
      });
      expect(result).toEqual(mockRequest);
    });
  });

  describe("checkDesignatedEstimateRequest", () => {
    it("지정 견적 요청 상태를 성공적으로 조회한다", async () => {
      const params = {
        quoteId: "quote-1",
        moverId: "mover-1",
      };

      const mockRequest = {
        id: "request-1",
        createdAt: new Date(),
      };

      mockPrisma.designatedMover.findFirst.mockResolvedValue(mockRequest);

      const result =
        await moverRepository.checkDesignatedEstimateRequest(params);

      expect(mockPrisma.designatedMover.findFirst).toHaveBeenCalledWith({
        where: {
          estimateRequestId: params.quoteId,
          moverId: params.moverId,
          deletedAt: null,
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
        },
      });
      expect(result).toEqual(mockRequest);
    });

    it("존재하지 않는 요청을 조회한다", async () => {
      const params = {
        quoteId: "quote-1",
        moverId: "mover-1",
      };

      mockPrisma.designatedMover.findFirst.mockResolvedValue(null);

      const result =
        await moverRepository.checkDesignatedEstimateRequest(params);

      expect(result).toBeNull();
    });
  });

  describe("checkEstimateRequestStatus", () => {
    it("유효한 견적 요청 상태를 성공적으로 확인한다", async () => {
      const quoteId = "quote-1";
      const mockEstimateRequest = {
        id: quoteId,
        status: "PENDING",
        moveDate: new Date("2025-12-31"),
      };

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(
        mockEstimateRequest
      );

      const result = await moverRepository.checkEstimateRequestStatus(quoteId);

      expect(mockPrisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: { id: quoteId },
        select: {
          id: true,
          status: true,
          moveDate: true,
        },
      });
      expect(result).toEqual({ isValid: true });
    });

    it("확정된 견적 요청에 대해 유효하지 않음을 반환한다", async () => {
      const quoteId = "quote-1";
      const mockEstimateRequest = {
        id: quoteId,
        status: "APPROVED",
        moveDate: new Date("2025-12-31"),
      };

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(
        mockEstimateRequest
      );

      const result = await moverRepository.checkEstimateRequestStatus(quoteId);

      expect(result).toEqual({
        isValid: false,
        reason: "확정되거나 완료된 견적에는 지정 견적을 요청할 수 없습니다.",
      });
    });

    it("완료된 견적 요청에 대해 유효하지 않음을 반환한다", async () => {
      const quoteId = "quote-1";
      const mockEstimateRequest = {
        id: quoteId,
        status: "COMPLETED",
        moveDate: new Date("2025-12-31"),
      };

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(
        mockEstimateRequest
      );

      const result = await moverRepository.checkEstimateRequestStatus(quoteId);

      expect(result).toEqual({
        isValid: false,
        reason: "확정되거나 완료된 견적에는 지정 견적을 요청할 수 없습니다.",
      });
    });

    it("존재하지 않는 견적 요청을 확인한다", async () => {
      const quoteId = "invalid-quote";

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(null);

      const result = await moverRepository.checkEstimateRequestStatus(quoteId);

      expect(result).toEqual({
        isValid: false,
        reason: "견적을 찾을 수 없습니다.",
      });
    });
  });
});
