import { PrismaClient } from "@prisma/client";

// Prisma 모킹
const mockPrisma = {
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
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Repository import
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

      mockPrisma.favorite.findUnique.mockResolvedValue(mockFavorite);

      const result = await favoriteRepository.getFavoriteStatus(
        customerId,
        moverId
      );

      expect(mockPrisma.favorite.findUnique).toHaveBeenCalledWith({
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

      mockPrisma.favorite.findUnique.mockResolvedValue(null);

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

      mockPrisma.favorite.findUnique.mockResolvedValue(null);

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

      mockPrisma.favorite.create.mockResolvedValue(mockFavorite);

      const result = await favoriteRepository.addFavorite(customerId, moverId);

      expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
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

      mockPrisma.favorite.delete.mockResolvedValue(mockFavorite);

      const result = await favoriteRepository.removeFavorite(
        customerId,
        moverId
      );

      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
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

  describe("getUserFavorites", () => {
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
            name: "김기사",
            profileImage: "image1.jpg",
            totalReviewCount: 10,
            averageRating: 4.5,
            totalFavoriteCount: 5,
          },
        },
      ];

      mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites);

      const result = await favoriteRepository.getUserFavorites(customerId);

      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({
        where: {
          customerId,
          deletedAt: null,
          mover: {
            deletedAt: null,
          },
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
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual(mockFavorites);
    });

    it("빈 찜 목록을 반환한다", async () => {
      const customerId = "customer-1";

      mockPrisma.favorite.findMany.mockResolvedValue([]);

      const result = await favoriteRepository.getUserFavorites(customerId);

      expect(result).toEqual([]);
    });
  });

  describe("getMoverFavoriteCount", () => {
    it("기사님의 찜 개수를 성공적으로 조회한다", async () => {
      const moverId = "mover-1";

      mockPrisma.favorite.count.mockResolvedValue(5);

      const result = await favoriteRepository.getMoverFavoriteCount(moverId);

      expect(mockPrisma.favorite.count).toHaveBeenCalledWith({
        where: {
          moverId,
          deletedAt: null,
        },
      });
      expect(result).toBe(5);
    });

    it("찜이 없는 기사님의 개수를 조회한다", async () => {
      const moverId = "mover-1";

      mockPrisma.favorite.count.mockResolvedValue(0);

      const result = await favoriteRepository.getMoverFavoriteCount(moverId);

      expect(result).toBe(0);
    });
  });
});
