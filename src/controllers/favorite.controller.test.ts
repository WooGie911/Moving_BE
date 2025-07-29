// @ts-nocheck
// @jest-environment node

import favoriteController from "./favorite.controller";

// Service 완전 모킹
jest.mock("../services/favorite.service", () => ({
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

// Repository 모킹
jest.mock("../repositories/favorite.repository", () => ({
  getFavoriteStatus: jest.fn(),
}));

import favoriteService from "../services/favorite.service";
import favoriteRepository from "../repositories/favorite.repository";

const mockFavoriteService = favoriteService as jest.Mocked<
  typeof favoriteService
>;
const mockFavoriteRepository = favoriteRepository as jest.Mocked<
  typeof favoriteRepository
>;

describe("FavoriteController - 유닛 테스트", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      user: { userId: "test-user-id", userType: "CUSTOMER" },
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("addFavorite", () => {
    it("찜하기를 성공적으로 등록한다", async () => {
      const requestData = {
        moverId: "mover-1",
      };

      const mockResponse = {
        success: true,
        message: "찜하기가 추가되었습니다.",
        data: {
          isFavorited: true,
          favoriteCount: 5,
        },
      };

      mockReq.body = requestData;
      mockFavoriteService.addFavorite.mockResolvedValue(mockResponse);

      await favoriteController.addFavorite(mockReq, mockRes);

      expect(mockFavoriteService.addFavorite).toHaveBeenCalledWith(
        "test-user-id",
        "mover-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    });

    it("moverId가 없을 때 400 에러를 반환한다", async () => {
      mockReq.body = {};

      await favoriteController.addFavorite(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 기사님 ID입니다.",
      });
    });

    it("일반 유저가 아닐 때 403 에러를 반환한다", async () => {
      mockReq.user.userType = "MOVER";
      mockReq.body = { moverId: "mover-1" };

      await favoriteController.addFavorite(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("자기 자신을 찜하려고 할 때 400 에러를 반환한다", async () => {
      mockReq.body = { moverId: "test-user-id" };

      await favoriteController.addFavorite(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "자기 자신은 찜할 수 없습니다.",
      });
    });

    it("서비스 에러 시 500 에러를 반환한다", async () => {
      mockReq.body = { moverId: "mover-1" };
      mockFavoriteService.addFavorite.mockRejectedValue(
        new Error("Service error")
      );

      await favoriteController.addFavorite(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    });
  });

  describe("removeFavorite", () => {
    it("찜하기를 성공적으로 해제한다", async () => {
      const mockResponse = {
        success: true,
        message: "찜하기가 제거되었습니다.",
        data: {
          isFavorited: false,
          favoriteCount: 4,
        },
      };

      mockReq.params = { moverId: "mover-1" };
      mockFavoriteService.removeFavorite.mockResolvedValue(mockResponse);

      await favoriteController.removeFavorite(mockReq, mockRes);

      expect(mockFavoriteService.removeFavorite).toHaveBeenCalledWith(
        "test-user-id",
        "mover-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    });

    it("moverId가 없을 때 400 에러를 반환한다", async () => {
      mockReq.params = {};

      await favoriteController.removeFavorite(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 기사님 ID입니다.",
      });
    });

    it("일반 유저가 아닐 때 403 에러를 반환한다", async () => {
      mockReq.user.userType = "MOVER";
      mockReq.params = { moverId: "mover-1" };

      await favoriteController.removeFavorite(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("자기 자신을 찜 해제하려고 할 때 400 에러를 반환한다", async () => {
      mockReq.params = { moverId: "test-user-id" };

      await favoriteController.removeFavorite(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "자기 자신은 찜할 수 없습니다.",
      });
    });

    it("서비스 에러 시 500 에러를 반환한다", async () => {
      mockReq.params = { moverId: "mover-1" };
      mockFavoriteService.removeFavorite.mockRejectedValue(
        new Error("Service error")
      );

      await favoriteController.removeFavorite(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    });
  });

  describe("getFavoriteStatus", () => {
    it("찜하기 상태를 성공적으로 조회한다", async () => {
      const mockStatus = {
        isFavorited: true,
        favoriteCount: 5,
      };

      mockReq.params = { moverId: "mover-1" };
      mockFavoriteRepository.getFavoriteStatus.mockResolvedValue(mockStatus);

      await favoriteController.getFavoriteStatus(mockReq, mockRes);

      expect(mockFavoriteRepository.getFavoriteStatus).toHaveBeenCalledWith(
        "test-user-id",
        "mover-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "찜하기 상태를 성공적으로 조회했습니다.",
        data: mockStatus,
      });
    });

    it("moverId가 없을 때 400 에러를 반환한다", async () => {
      mockReq.params = {};

      await favoriteController.getFavoriteStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 기사님 ID입니다.",
      });
    });

    it("일반 유저가 아닐 때 403 에러를 반환한다", async () => {
      mockReq.user.userType = "MOVER";
      mockReq.params = { moverId: "mover-1" };

      await favoriteController.getFavoriteStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("서비스 에러 시 500 에러를 반환한다", async () => {
      mockReq.params = { moverId: "mover-1" };
      mockFavoriteRepository.getFavoriteStatus.mockRejectedValue(
        new Error("Service error")
      );

      await favoriteController.getFavoriteStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    });
  });
});
