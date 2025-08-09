const mockDatabase = {
  favorite: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  $use: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockDatabase),
  NotificationType: {
    WELCOME: "WELCOME",
    ESTIMATE_REQUEST_ARRIVED: "ESTIMATE_REQUEST_ARRIVED",
    ESTIMATE_ARRIVED: "ESTIMATE_ARRIVED",
    ESTIMATE_STATUS_UPDATED: "ESTIMATE_STATUS_UPDATED",
    DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED: "DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED",
    DESIGNATED_ESTIMATE_STATUS_UPDATED: "DESIGNATED_ESTIMATE_STATUS_UPDATED",
    REVIEW_EVENT: "REVIEW_EVENT",
    FAVORITE_EVENT: "FAVORITE_EVENT",
    MOVE_DAY_REMINDER: "MOVE_DAY_REMINDER",
  },
  ActionType: {
    WELCOME: "WELCOME",
    ESTIMATE_REQUEST_CREATE: "ESTIMATE_REQUEST_CREATE",
    ESTIMATE_SUBMITTED: "ESTIMATE_SUBMITTED",
    ESTIMATE_ACCEPTED: "ESTIMATE_ACCEPTED",
    ESTIMATE_REJECTED: "ESTIMATE_REJECTED",
    DESIGNATED_ESTIMATE_REQUEST_SUBMITTED: "DESIGNATED_ESTIMATE_REQUEST_SUBMITTED",
    DESIGNATED_ESTIMATE_REQUEST_REJECTED: "DESIGNATED_ESTIMATE_REQUEST_REJECTED",
    FAVORITE_ADDED: "FAVORITE_ADDED",
    FAVORITE_REMOVED: "FAVORITE_REMOVED",
  },
}));

import favoriteRepository from "./favorite.repository";

describe("FavoriteRepository - 유닛 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFavoriteStatus", () => {
    it("찜하기 상태를 성공적으로 조회한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";
      const mockFavorite = {
        id: "favorite-1",
        customerId,
        moverId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabase.favorite.findUnique.mockResolvedValue(mockFavorite);

      const result = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      expect(mockDatabase.favorite.findUnique).toHaveBeenCalledWith({
        where: {
          customerId_moverId: {
            customerId,
            moverId,
          },
        },
      });
      // count가 호출되어 최종 결과에 반영되는지 확인
      mockDatabase.favorite.count.mockResolvedValue(7);
      const resultWithCount = await favoriteRepository.getFavoriteStatus(customerId, moverId);
      expect(mockDatabase.favorite.count).toHaveBeenCalledWith({
        where: { moverId, deletedAt: null },
      });
      expect(resultWithCount).toEqual({ isFavorited: !!mockFavorite, favoriteCount: 7 });
    });

    it("찜하지 않은 상태를 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockDatabase.favorite.findUnique.mockResolvedValue(null);

      const result = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      mockDatabase.favorite.count.mockResolvedValue(0);
      const resultWithCount = await favoriteRepository.getFavoriteStatus(customerId, moverId);
      expect(resultWithCount).toEqual({ isFavorited: false, favoriteCount: 0 });
    });

    it("삭제된 찜은 제외하고 카운트한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockDatabase.favorite.findUnique.mockResolvedValue(null);

      const result = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      mockDatabase.favorite.count.mockResolvedValue(3);
      const resultWithCount = await favoriteRepository.getFavoriteStatus(customerId, moverId);
      expect(resultWithCount).toEqual({ isFavorited: false, favoriteCount: 3 });
    });
  });

  describe("addFavorite", () => {
    it("찜하기를 성공적으로 등록한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";
      const mockFavorite = {
        id: "favorite-1",
        customerId,
        moverId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabase.favorite.create.mockResolvedValue(mockFavorite);

      const result = await favoriteRepository.addFavorite(customerId, moverId);

      expect(mockDatabase.favorite.create).toHaveBeenCalledWith({
        data: {
          customerId,
          moverId,
        },
      });
      expect(result).toEqual(mockFavorite);
    });
  });

  describe("removeFavorite", () => {
    it("찜하기를 성공적으로 해제한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";
      const mockFavorite = {
        id: "favorite-1",
        customerId,
        moverId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 구현은 findUnique로 먼저 조회 후 delete 수행하므로, findUnique와 delete 모두 모킹
      mockDatabase.favorite.findUnique.mockResolvedValue(mockFavorite);
      mockDatabase.favorite.delete.mockResolvedValue(mockFavorite);

      const result = await favoriteRepository.removeFavorite(customerId, moverId);

      expect(mockDatabase.favorite.findUnique).toHaveBeenCalledWith({
        where: {
          customerId_moverId: {
            customerId,
            moverId,
          },
        },
      });
      expect(mockDatabase.favorite.delete).toHaveBeenCalledWith({
        where: {
          customerId_moverId: {
            customerId,
            moverId,
          },
        },
      });
      expect(result).toEqual(mockFavorite);
    });

    it("찜 정보가 없으면 에러를 던진다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockDatabase.favorite.findUnique.mockResolvedValue(null);

      await expect(favoriteRepository.removeFavorite(customerId, moverId)).rejects.toThrow(
        "찜하기 정보를 찾을 수 없습니다.",
      );
    });
  });

  describe("getMoverFavoriteCount", () => {
    it("기사님의 찜 개수를 성공적으로 조회한다", async () => {
      const moverId = "mover-1";

      mockDatabase.favorite.count.mockResolvedValue(5);

      const result = await favoriteRepository.getMoverFavoriteCount(moverId);

      expect(mockDatabase.favorite.count).toHaveBeenCalledWith({
        where: {
          moverId,
          deletedAt: null,
        },
      });
      expect(result).toBe(5);
    });

    it("찜이 없는 기사님의 개수를 조회한다", async () => {
      const moverId = "mover-1";

      mockDatabase.favorite.count.mockResolvedValue(0);

      const result = await favoriteRepository.getMoverFavoriteCount(moverId);

      expect(result).toBe(0);
    });
  });

  describe("getFavoriteDetailForAction", () => {
    it("찜하기 상세 정보를 성공적으로 조회한다", async () => {
      const favoriteId = "favorite-1";
      const mockFavoriteDetail = {
        id: "favorite-1",
        customerId: "customer-1",
        moverId: "mover-1",
        customer: {
          id: "customer-1",
          name: "김고객",
        },
        mover: {
          id: "mover-1",
          name: "김이사",
        },
      };

      mockDatabase.favorite.findUnique.mockResolvedValue(mockFavoriteDetail);

      const result = await favoriteRepository.getFavoriteDetailForAction(favoriteId);

      expect(mockDatabase.favorite.findUnique).toHaveBeenCalledWith({
        where: { id: favoriteId },
        select: {
          id: true,
          customerId: true,
          moverId: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          mover: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(mockFavoriteDetail);
    });

    it("찜하기가 존재하지 않을 때 null을 반환한다", async () => {
      const favoriteId = "favorite-1";

      mockDatabase.favorite.findUnique.mockResolvedValue(null);

      const result = await favoriteRepository.getFavoriteDetailForAction(favoriteId);

      expect(mockDatabase.favorite.findUnique).toHaveBeenCalledWith({
        where: { id: favoriteId },
        select: {
          id: true,
          customerId: true,
          moverId: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          mover: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toBeNull();
    });
  });

  describe("getFavoriteMovers", () => {
    it("페이징 없는 기본 조회에서 hasNext=false와 nextCursor=undefined를 반환한다", async () => {
      const customerId = "customer-1";
      const favoriteRows = [
        {
          id: "fav-1",
          moverId: "m1",
          createdAt: new Date(),
          mover: {
            id: "m1",
            name: "기사1",
            nickname: "별명1",
            moverImage: "img1.jpg",
            shortIntro: "short",
            detailIntro: "detail",
            career: 3,
            workedCount: 10,
            averageRating: 4.5,
            totalReviewCount: 12,
            totalFavoriteCount: 20,
            currentAreas: ["서울"],
            serviceTypes: ["HOME", "SMALL"],
            isVeteran: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            Favorite: [{ deletedAt: null }, { deletedAt: new Date() }],
          },
        },
      ];

      mockDatabase.favorite.findMany.mockResolvedValue(favoriteRows);

      const result = await favoriteRepository.getFavoriteMovers(customerId, 3);

      expect(mockDatabase.favorite.findMany).toHaveBeenCalled();
      expect(result.hasNext).toBe(false);
      expect(result.nextCursor).toBeUndefined();
      expect(result.items[0]).toMatchObject({
        id: "m1",
        isFavorited: true,
        serviceTypes: [{ service: { name: "가정이사" } }, { service: { name: "소형이사" } }],
        favoriteCount: 1,
      });
    });

    it("limit+1을 반환하면 hasNext=true와 nextCursor를 설정한다", async () => {
      const customerId = "customer-1";
      const favoritesPlusOne = [
        {
          id: "fav-1",
          mover: {
            id: "m1",
            name: "n",
            nickname: "nn",
            moverImage: "i",
            shortIntro: "s",
            detailIntro: "d",
            career: 1,
            workedCount: 2,
            averageRating: 3,
            totalReviewCount: 4,
            totalFavoriteCount: 5,
            currentAreas: [],
            serviceTypes: [],
            isVeteran: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            Favorite: [],
          },
        },
        {
          id: "fav-2",
          mover: {
            id: "m2",
            name: "n",
            nickname: "nn",
            moverImage: "i",
            shortIntro: "s",
            detailIntro: "d",
            career: 1,
            workedCount: 2,
            averageRating: 3,
            totalReviewCount: 4,
            totalFavoriteCount: 5,
            currentAreas: [],
            serviceTypes: [],
            isVeteran: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            Favorite: [],
          },
        },
        {
          id: "fav-3",
          mover: {
            id: "m3",
            name: "n",
            nickname: "nn",
            moverImage: "i",
            shortIntro: "s",
            detailIntro: "d",
            career: 1,
            workedCount: 2,
            averageRating: 3,
            totalReviewCount: 4,
            totalFavoriteCount: 5,
            currentAreas: [],
            serviceTypes: [],
            isVeteran: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            Favorite: [],
          },
        },
        {
          id: "fav-4",
          mover: {
            id: "m4",
            name: "n",
            nickname: "nn",
            moverImage: "i",
            shortIntro: "s",
            detailIntro: "d",
            career: 1,
            workedCount: 2,
            averageRating: 3,
            totalReviewCount: 4,
            totalFavoriteCount: 5,
            currentAreas: [],
            serviceTypes: [],
            isVeteran: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            Favorite: [],
          },
        },
      ];
      mockDatabase.favorite.findMany.mockResolvedValue([...favoritesPlusOne]);

      const result = await favoriteRepository.getFavoriteMovers(customerId, 3);

      expect(result.hasNext).toBe(true);
      expect(result.nextCursor).toBe("fav-4");
      expect(result.items).toHaveLength(3);
    });

    it("cursor가 있으면 cursor/skip 옵션으로 조회한다", async () => {
      const customerId = "customer-1";
      const cursor = "fav-10";
      const favoriteRows = [
        {
          id: "fav-11",
          moverId: "m11",
          createdAt: new Date(),
          mover: {
            id: "m11",
            name: "기사11",
            nickname: "별명11",
            moverImage: "img11.jpg",
            shortIntro: "s",
            detailIntro: "d",
            career: 1,
            workedCount: 2,
            averageRating: 3,
            totalReviewCount: 4,
            totalFavoriteCount: 5,
            currentAreas: [],
            serviceTypes: ["OFFICE", "ETC"],
            isVeteran: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            Favorite: [],
          },
        },
      ];

      mockDatabase.favorite.findMany.mockResolvedValue(favoriteRows);

      const result = await favoriteRepository.getFavoriteMovers(customerId, 3, cursor);

      expect(mockDatabase.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: cursor }, skip: 1 }),
      );
      expect(result.hasNext).toBe(false);
      expect(result.nextCursor).toBeUndefined();
      expect(result.items[0].serviceTypes).toEqual([
        { service: { name: "사무실이사" } },
        { service: { name: "기타" } },
      ]);
      expect(result.items[0].favoriteCount).toBe(0);
    });
  });
});
