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
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockDatabase),
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

      const result = await favoriteRepository.getFavoriteStatus(
        customerId,
        moverId
      );

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

      const result = await favoriteRepository.getFavoriteStatus(
        customerId,
        moverId
      );

      expect(result).toEqual({
        isFavorited: false,
        favoriteCount: undefined,
      });
    });

    it("삭제된 찜은 제외하고 카운트한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockDatabase.favorite.findUnique.mockResolvedValue(null);

      const result = await favoriteRepository.getFavoriteStatus(
        customerId,
        moverId
      );

      expect(result).toEqual({
        isFavorited: false,
        favoriteCount: undefined,
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

      mockDatabase.favorite.delete.mockResolvedValue(mockFavorite);

      const result = await favoriteRepository.removeFavorite(
        customerId,
        moverId
      );

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
});
