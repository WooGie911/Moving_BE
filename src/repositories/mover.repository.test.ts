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
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
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
          id: "mover-1",
          nickname: "김기사",
          name: "김기사",
          career: 5,
          shortIntro: "안녕하세요",
          detailIntro: "상세 소개입니다",
          workedCount: 100,
          averageRating: 4.5,
          totalReviewCount: 10,
          serviceAreas: [],
          serviceTypes: ["SMALL"],
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
          serviceAreas: {
            some: { region: "서울" },
          },
          serviceTypes: { has: "SMALL" },
        },
        orderBy: { totalReviewCount: "desc" },
        skip: 0,
        take: 11,
        select: {
          id: true,
          nickname: true,
          name: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          serviceAreas: true,
          serviceTypes: true,
          Favorite: true,
          moverImage: true,
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
          serviceAreas: [],
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
        orderBy: { totalReviewCount: "desc" },
        skip: 0,
        take: 11,
        select: {
          id: true,
          nickname: true,
          name: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          serviceAreas: true,
          serviceTypes: true,
          Favorite: true,
          moverImage: true,
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
        orderBy: { career: "desc" },
        skip: 0,
        take: 11,
        select: {
          id: true,
          nickname: true,
          name: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          serviceAreas: true,
          serviceTypes: true,
          Favorite: true,
          moverImage: true,
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
          serviceAreas: [],
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
        orderBy: { workedCount: "desc" },
        skip: 0,
        take: 11,
        select: {
          id: true,
          nickname: true,
          name: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          serviceAreas: true,
          serviceTypes: true,
          Favorite: true,
          moverImage: true,
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
        orderBy: { totalReviewCount: "desc" },
        skip: 0,
        take: 11,
        select: {
          id: true,
          nickname: true,
          name: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          serviceAreas: true,
          serviceTypes: true,
          Favorite: true,
          moverImage: true,
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
            serviceAreas: [],
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
            select: {
              id: true,
              nickname: true,
              name: true,
              career: true,
              shortIntro: true,
              detailIntro: true,
              workedCount: true,
              averageRating: true,
              totalReviewCount: true,
              serviceAreas: true,
              serviceTypes: true,
              moverImage: true,
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
        serviceAreas: [],
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
        select: {
          id: true,
          nickname: true,
          name: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          serviceAreas: true,
          serviceTypes: true,
          moverImage: true,
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
        serviceAreas: [],
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
        serviceAreas: [],
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
        select: {
          id: true,
          nickname: true,
          name: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          serviceAreas: true,
          serviceTypes: true,
          moverImage: true,
          Favorite: true,
        },
      });
      expect(mockPrisma.favorite.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockMover,
        favoriteCount: 2,
        isFavorited: false,
      });
    });
  });

  describe("createDesignatedEstimateRequest", () => {
    it("지정 견적 요청을 성공적으로 생성한다", async () => {
      const dto = {
        quoteId: "quote-1",
        moverId: "mover-1",
        message: undefined,
        expiresAt: new Date(),
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
          message: dto.message,
          expiresAt: dto.expiresAt,
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
        message: "테스트 메시지",
        expiresAt: new Date(),
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
          message: true,
          expiresAt: true,
          createdAt: true,
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
});
