// @ts-nocheck

// 의존성 모듈을 파일 경계에서 모킹하고, 테스트에서는 모킹 객체만 참조한다
jest.mock("../repositories/favorite.repository", () => ({
  __esModule: true,
  default: {
    getFavoriteStatus: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    getFavoriteDetailForAction: jest.fn(),
  },
}));

jest.mock("./action.service", () => ({
  __esModule: true,
  default: {
    createAction: jest.fn(),
  },
}));

import favoriteService from "./favorite.service";

// 모킹 객체 참조 (구현 import 없이 사용)
const mockFavoriteRepository = jest.requireMock("../repositories/favorite.repository").default;
const mockActionService = jest.requireMock("./action.service").default;

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

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(customerId, moverId);
      expect(mockFavoriteRepository.addFavorite).toHaveBeenCalledWith(customerId, moverId);
      expect(result.success).toBe(true);
      expect(result.message).toBe("찜하기가 추가되었습니다.");
      expect(result.data).toEqual({
        isFavorited: true,
        favoriteCount: 5,
      });
    });

    it("이미 찜한 기사님을 다시 찜하려고 시도할 때 성공 false와 안내 메시지를 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      const currentStatus = {
        isFavorited: true,
        favoriteCount: 5,
      };

      mockFavoriteRepository.getFavoriteStatus.mockResolvedValue(currentStatus);

      const result = await favoriteService.addFavorite(customerId, moverId);

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(customerId, moverId);
      expect(mockFavoriteRepository.addFavorite).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toBe("이미 찜한 기사님입니다.");
      expect(result.data).toEqual(currentStatus);
    });

    it("에러 발생 시 실패를 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus.mockRejectedValue(new Error("Database error"));

      const result = await favoriteService.addFavorite(customerId, moverId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("찜하기 추가 중 오류가 발생했습니다.");
      expect(result.data).toEqual({
        isFavorited: false,
        favoriteCount: 0,
      });
    });

    it("액션 상세가 없으면 액션을 생성하지 않는다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus
        .mockResolvedValueOnce({ isFavorited: false, favoriteCount: 4 })
        .mockResolvedValueOnce({ isFavorited: true, favoriteCount: 5 });

      mockFavoriteRepository.addFavorite.mockResolvedValue({ id: "favorite-1" });
      mockFavoriteRepository.getFavoriteDetailForAction.mockResolvedValue(null);

      const result = await favoriteService.addFavorite(customerId, moverId);

      expect(mockActionService.createAction).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isFavorited: true, favoriteCount: 5 });
    });

    it("액션 생성 실패는 무시되고 성공을 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus
        .mockResolvedValueOnce({ isFavorited: false, favoriteCount: 4 })
        .mockResolvedValueOnce({ isFavorited: true, favoriteCount: 5 });

      mockFavoriteRepository.addFavorite.mockResolvedValue({ id: "favorite-1" });
      mockFavoriteRepository.getFavoriteDetailForAction.mockResolvedValue({ id: "favorite-1" });
      mockActionService.createAction.mockRejectedValue(new Error("action fail"));

      const result = await favoriteService.addFavorite(customerId, moverId);

      expect(mockActionService.createAction).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isFavorited: true, favoriteCount: 5 });
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

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(customerId, moverId);
      expect(mockFavoriteRepository.removeFavorite).toHaveBeenCalledWith(customerId, moverId);
      expect(result.success).toBe(true);
      expect(result.message).toBe("찜하기가 제거되었습니다.");
      expect(result.data).toEqual({
        isFavorited: false,
        favoriteCount: 4,
      });
    });

    it("찜하지 않은 기사님을 해제하려고 시도할 때 성공 false와 안내 메시지를 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      const currentStatus = {
        isFavorited: false,
        favoriteCount: 4,
      };

      mockFavoriteRepository.getFavoriteStatus.mockResolvedValue(currentStatus);

      const result = await favoriteService.removeFavorite(customerId, moverId);

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(customerId, moverId);
      expect(mockFavoriteRepository.removeFavorite).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toBe("찜하지 않은 기사님입니다.");
      expect(result.data).toEqual(currentStatus);
    });

    it("에러 발생 시 실패를 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus.mockRejectedValue(new Error("Database error"));

      const result = await favoriteService.removeFavorite(customerId, moverId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("찜하기 제거 중 오류가 발생했습니다.");
      expect(result.data).toEqual({
        isFavorited: false,
        favoriteCount: 0,
      });
    });

    it("액션 상세가 없으면 액션을 생성하지 않는다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus
        .mockResolvedValueOnce({ isFavorited: true, favoriteCount: 5 })
        .mockResolvedValueOnce({ isFavorited: false, favoriteCount: 4 });

      mockFavoriteRepository.removeFavorite.mockResolvedValue({ id: "favorite-1" });
      mockFavoriteRepository.getFavoriteDetailForAction.mockResolvedValue(null);

      const result = await favoriteService.removeFavorite(customerId, moverId);

      expect(mockActionService.createAction).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isFavorited: false, favoriteCount: 4 });
    });

    it("액션 생성 실패는 무시되고 성공을 반환한다", async () => {
      const customerId = "customer-1";
      const moverId = "mover-1";

      mockFavoriteRepository.getFavoriteStatus
        .mockResolvedValueOnce({ isFavorited: true, favoriteCount: 5 })
        .mockResolvedValueOnce({ isFavorited: false, favoriteCount: 4 });

      mockFavoriteRepository.removeFavorite.mockResolvedValue({ id: "favorite-1" });
      mockFavoriteRepository.getFavoriteDetailForAction.mockResolvedValue({ id: "favorite-1" });
      mockActionService.createAction.mockRejectedValue(new Error("action fail"));

      const result = await favoriteService.removeFavorite(customerId, moverId);

      expect(mockActionService.createAction).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isFavorited: false, favoriteCount: 4 });
    });
  });
});
