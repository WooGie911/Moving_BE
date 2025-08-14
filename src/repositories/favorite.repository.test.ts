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
      expect(result).toEqual({
        isFavorited: true,
        favoriteCount: undefined,
      });
    });

    it("찜하지 않은 상태를 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockDatabase.favorite.findUnique.mockResolvedValue(null);

      const result = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      expect(result).toEqual({
        isFavorited: false,
        favoriteCount: undefined,
      });
    });

    it("삭제된 찜은 제외하고 카운트한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockDatabase.favorite.findUnique.mockResolvedValue(null);

      mockDatabase.favorite.count.mockResolvedValue(7);

      const result = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      expect(mockDatabase.favorite.count).toHaveBeenCalledWith({ where: { moverId, deletedAt: null } });
      expect(result).toEqual({
        isFavorited: false,
        favoriteCount: 7,
      });
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

      mockDatabase.favorite.findUnique.mockResolvedValue(mockFavorite);
      mockDatabase.favorite.delete.mockResolvedValue(mockFavorite);

      const result = await favoriteRepository.removeFavorite(customerId, moverId);

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

    it("삭제할 찜이 없으면 null을 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockDatabase.favorite.findUnique.mockResolvedValue(null);

      const result = await favoriteRepository.removeFavorite(customerId, moverId);

      expect(result).toBeNull();
      expect(mockDatabase.favorite.delete).not.toHaveBeenCalled();
    });
  });

  describe("getFavoriteMovers", () => {
    it("cursor 없이 limit 초과 시 hasNext/nextCursor를 설정한다", async () => {
      const customerId = "customer-1";
      const limit = 2;
      const moverBase = {
        id: "mX",
        name: "name",
        nickname: "nick",
        moverImage: null,
        shortIntro: "short",
        detailIntro: "detail",
        career: 3,
        workedCount: 10,
        averageRating: 4.5,
        totalReviewCount: 2,
        totalFavoriteCount: 5,
        currentAreas: [],
        serviceTypes: ["SMALL"],
        Favorite: [{ deletedAt: null }],
      } as any;
      const items = [
        { id: "fav-1", createdAt: new Date(), mover: { ...moverBase, id: "m1" } },
        { id: "fav-2", createdAt: new Date(), mover: { ...moverBase, id: "m2" } },
        { id: "fav-3", createdAt: new Date(), mover: { ...moverBase, id: "m3" } },
      ];
      mockDatabase.favorite.findMany.mockResolvedValue(items);

      const result = await favoriteRepository.getFavoriteMovers(customerId, limit);

      expect(result.hasNext).toBe(true);
      expect(result.nextCursor).toBe("fav-3");
      expect(mockDatabase.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId, deletedAt: null }),
          take: limit + 1,
          orderBy: { createdAt: "desc" },
        }),
      );
    });

    it("cursor가 있으면 cursor/skip 옵션이 포함된다", async () => {
      const customerId = "customer-1";
      const limit = 2;
      const cursor = "fav-10";
      const moverBase = {
        id: "mX",
        name: "name",
        nickname: "nick",
        moverImage: null,
        shortIntro: "short",
        detailIntro: "detail",
        career: 3,
        workedCount: 10,
        averageRating: 4.5,
        totalReviewCount: 2,
        totalFavoriteCount: 5,
        currentAreas: [],
        serviceTypes: [],
        Favorite: [],
      } as any;
      const items = [
        { id: "fav-11", mover: { ...moverBase, id: "m1" } },
        { id: "fav-12", mover: { ...moverBase, id: "m2" } },
      ];
      mockDatabase.favorite.findMany.mockResolvedValue(items);

      await favoriteRepository.getFavoriteMovers(customerId, limit, cursor);

      expect(mockDatabase.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: cursor },
          skip: 1,
        }),
      );
    });

    it("limit 이하일 때 hasNext가 false이고 nextCursor가 undefined이다", async () => {
      const customerId = "customer-1";
      const limit = 3;
      const mover = {
        id: "m1",
        name: "name",
        nickname: "nick",
        moverImage: null,
        shortIntro: "short",
        detailIntro: "detail",
        career: 3,
        workedCount: 10,
        averageRating: 4.5,
        totalReviewCount: 2,
        totalFavoriteCount: 5,
        currentAreas: [],
        serviceTypes: ["HOME"],
        Favorite: [],
      } as any;
      mockDatabase.favorite.findMany.mockResolvedValue([{ id: "fav-1", mover }]);

      const result = await favoriteRepository.getFavoriteMovers(customerId, limit);
      expect(result.hasNext).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it("serviceTypes 매핑과 Favorite undefined 처리를 검증한다", async () => {
      const customerId = "customer-1";
      const limit = 3;
      const mover = {
        id: "m9",
        name: "name",
        nickname: "nick",
        moverImage: null,
        shortIntro: "short",
        detailIntro: "detail",
        career: 3,
        workedCount: 10,
        averageRating: 4.5,
        totalReviewCount: 2,
        totalFavoriteCount: 5,
        currentAreas: [],
        serviceTypes: ["OTHER"],
        Favorite: undefined,
      } as any;
      mockDatabase.favorite.findMany.mockResolvedValue([{ id: "fav-9", mover }]);

      const result = await favoriteRepository.getFavoriteMovers(customerId, limit);

      expect(result.items[0].serviceTypes).toEqual([{ service: { name: "기타" } }]);
      expect(result.items[0].favoriteCount).toBe(0);
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
});
