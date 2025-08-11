// @ts-nocheck

import favoriteService from "./favorite.service";
import favoriteRepository from "../repositories/favorite.repository";
import actionService from "./action.service";

// Repository 모킹
jest.mock("../repositories/favorite.repository");
const mockFavoriteRepository = favoriteRepository as jest.Mocked<
  typeof favoriteRepository
>;

// Action Service 모킹
jest.mock("./action.service");
const mockActionService = actionService as jest.Mocked<typeof actionService>;

describe("FavoriteService - 유닛 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addFavorite", () => {
    it("찜하기를 성공적으로 등록한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus
        .mockResolvedValueOnce({
          isFavorited: false,
          favoriteCount: 4,
        })
        .mockResolvedValueOnce({
          isFavorited: true,
          favoriteCount: 5,
        });

      mockFavoriteRepository.addFavorite.mockResolvedValue({
        id: "favorite-1",
        customerId: "customer-1",
        moverId: "mover-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockFavoriteRepository.getFavoriteDetailForAction.mockResolvedValue({
        id: "favorite-1",
        customerId: "customer-1",
        moverId: "mover-1",
        customer: { id: "customer-1", name: "고객" },
        mover: { id: "mover-1", name: "기사" },
      });

      mockActionService.createAction.mockResolvedValue({
        id: "action-1",
        userId: "customer-1",
        type: "FAVORITE_ADDED",
        entityId: "favorite-1",
        entityType: "FAVORITE",
        createdAt: new Date(),
      });

      const result = await favoriteService.addFavorite(customerId, moverId);

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(
        customerId,
        moverId
      );
      expect(mockFavoriteRepository.addFavorite).toHaveBeenCalledWith(
        customerId,
        moverId
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe("찜하기가 추가되었습니다.");
      expect(result.data).toEqual({
        isFavorited: true,
        favoriteCount: 5,
      });
    });

    it("이미 찜한 기사님을 다시 찜하려고 시도할 때 성공을 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      const currentStatus = {
        isFavorited: true,
        favoriteCount: 5,
      };

      mockFavoriteRepository.getFavoriteStatus.mockResolvedValue(currentStatus);

      const result = await favoriteService.addFavorite(customerId, moverId);

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(
        customerId,
        moverId
      );
      expect(mockFavoriteRepository.addFavorite).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe("이미 찜한 기사님입니다.");
      expect(result.data).toEqual(currentStatus);
    });

    it("에러 발생 시 실패를 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus.mockRejectedValue(
        new Error("Database error")
      );

      const result = await favoriteService.addFavorite(customerId, moverId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("찜하기 추가 중 오류가 발생했습니다.");
      expect(result.data).toEqual({
        isFavorited: false,
        favoriteCount: 0,
      });
    });
  });

  describe("removeFavorite", () => {
    it("찜하기를 성공적으로 해제한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus
        .mockResolvedValueOnce({
          isFavorited: true,
          favoriteCount: 5,
        })
        .mockResolvedValueOnce({
          isFavorited: false,
          favoriteCount: 4,
        });

      mockFavoriteRepository.removeFavorite.mockResolvedValue({
        id: "favorite-1",
        customerId: "customer-1",
        moverId: "mover-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockFavoriteRepository.getFavoriteDetailForAction.mockResolvedValue({
        id: "favorite-1",
        customerId: "customer-1",
        moverId: "mover-1",
        customer: { id: "customer-1", name: "고객" },
        mover: { id: "mover-1", name: "기사" },
      });

      mockActionService.createAction.mockResolvedValue({
        id: "action-1",
        userId: "customer-1",
        type: "FAVORITE_REMOVED",
        entityId: "favorite-1",
        entityType: "FAVORITE",
        createdAt: new Date(),
      });

      const result = await favoriteService.removeFavorite(customerId, moverId);

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(
        customerId,
        moverId
      );
      expect(mockFavoriteRepository.removeFavorite).toHaveBeenCalledWith(
        customerId,
        moverId
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe("찜하기가 제거되었습니다.");
      expect(result.data).toEqual({
        isFavorited: false,
        favoriteCount: 4,
      });
    });

    it("찜하지 않은 기사님을 해제하려고 시도할 때 성공을 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      const currentStatus = {
        isFavorited: false,
        favoriteCount: 4,
      };

      mockFavoriteRepository.getFavoriteStatus.mockResolvedValue(currentStatus);

      const result = await favoriteService.removeFavorite(customerId, moverId);

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(
        customerId,
        moverId
      );
      expect(mockFavoriteRepository.removeFavorite).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe("찜하지 않은 기사님입니다.");
      expect(result.data).toEqual(currentStatus);
    });

    it("에러 발생 시 실패를 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus.mockRejectedValue(
        new Error("Database error")
      );

      const result = await favoriteService.removeFavorite(customerId, moverId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("찜하기 제거 중 오류가 발생했습니다.");
      expect(result.data).toEqual({
        isFavorited: false,
        favoriteCount: 0,
      });
    });
  });
});
