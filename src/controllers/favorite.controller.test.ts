// @ts-nocheck

import favoriteController from "./favorite.controller";

jest.mock("../services/favorite.service", () => ({
  __esModule: true,
  default: {
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
  },
}));

jest.mock("../repositories/favorite.repository", () => ({
  __esModule: true,
  default: {
    getFavoriteMovers: jest.fn(),
    getFavoriteStatus: jest.fn(),
  },
}));

jest.mock("@sentry/node", () => ({
  captureException: jest.fn(),
}));

// 다른 레이어 구현은 import하지 않고 모듈 경계 모킹만 사용
const mockService = jest.requireMock("../services/favorite.service").default;
const mockRepo = jest.requireMock("../repositories/favorite.repository").default;
const mockSentry = jest.requireMock("@sentry/node");

const createReq = (overrides: any = {}) => ({
  user: { userId: "customer-1", name: "고객", userType: "CUSTOMER" },
  body: {},
  params: {},
  query: {},
  method: "POST",
  url: "/favorites",
  ...overrides,
});

const createRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("FavoriteController - 유닛 테스트", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createReq();
    res = createRes();
  });

  describe("addFavorite", () => {
    it("moverId가 누락되면 400을 반환한다", async () => {
      req.body = {};

      await favoriteController.addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 기사님 ID입니다.",
      });
    });

    it("moverId가 유효하지 않으면 400을 반환한다", async () => {
      req.body = { moverId: 123 }; // invalid type

      await favoriteController.addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 기사님 ID입니다.",
      });
    });

    it("CUSTOMER가 아니면 403을 반환한다", async () => {
      req = createReq({ user: { userId: "u1", name: "n", userType: "MOVER" }, body: { moverId: "m1" } });

      await favoriteController.addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("로그인 정보가 없으면 403을 반환한다", async () => {
      req = createReq({ user: undefined, body: { moverId: "m1" } });

      await favoriteController.addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("자기 자신을 찜하려 하면 400을 반환한다", async () => {
      req = createReq({ body: { moverId: "customer-1" } });

      await favoriteController.addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "자기 자신은 찜할 수 없습니다.",
      });
    });

    it("서비스 성공/실패 여부와 무관하게 200으로 결과를 반환한다", async () => {
      req = createReq({ body: { moverId: "m1" } });
      mockService.addFavorite.mockResolvedValue({
        success: true,
        message: "찜하기가 추가되었습니다.",
        data: { isFavorited: true, favoriteCount: 3 },
      });

      await favoriteController.addFavorite(req, res);

      expect(mockService.addFavorite).toHaveBeenCalledWith("customer-1", "m1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "찜하기가 추가되었습니다.",
        data: { isFavorited: true, favoriteCount: 3 },
      });
    });

    it("서비스가 실패(success=false)여도 200으로 결과를 반환한다", async () => {
      req = createReq({ body: { moverId: "m1" } });
      const svcResult = {
        success: false,
        message: "이미 찜한 기사님입니다.",
        data: { isFavorited: true, favoriteCount: 5 },
      };
      mockService.addFavorite.mockResolvedValue(svcResult);

      await favoriteController.addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(svcResult);
    });

    it("서비스 에러 시 500을 반환한다", async () => {
      req = createReq({ body: { moverId: "m1" } });
      mockService.addFavorite.mockRejectedValue(new Error("svc error"));

      await favoriteController.addFavorite(req, res);

      expect(mockSentry.captureException).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    });
  });

  describe("removeFavorite", () => {
    it("moverId 파라미터가 유효하지 않으면 400을 반환한다", async () => {
      req = createReq({ params: { moverId: 123 } });

      await favoriteController.removeFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 기사님 ID입니다.",
      });
    });

    it("CUSTOMER가 아니면 403을 반환한다", async () => {
      req = createReq({ user: { userId: "u1", name: "n", userType: "MOVER" }, params: { moverId: "m1" } });

      await favoriteController.removeFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("로그인 정보가 없으면 403을 반환한다", async () => {
      req = createReq({ user: undefined, params: { moverId: "m1" } });

      await favoriteController.removeFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("자기 자신을 해제하려 하면 400을 반환한다", async () => {
      req = createReq({ params: { moverId: "customer-1" } });

      await favoriteController.removeFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "자기 자신은 찜할 수 없습니다.",
      });
    });

    it("서비스 결과를 200으로 반환한다", async () => {
      req = createReq({ params: { moverId: "m1" } });
      mockService.removeFavorite.mockResolvedValue({
        success: true,
        message: "찜하기가 제거되었습니다.",
        data: { isFavorited: false, favoriteCount: 2 },
      });

      await favoriteController.removeFavorite(req, res);

      expect(mockService.removeFavorite).toHaveBeenCalledWith("customer-1", "m1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "찜하기가 제거되었습니다.",
        data: { isFavorited: false, favoriteCount: 2 },
      });
    });

    it("서비스가 실패(success=false)여도 200으로 결과를 반환한다", async () => {
      req = createReq({ params: { moverId: "m1" } });
      const svcResult = {
        success: false,
        message: "찜하지 않은 기사님입니다.",
        data: { isFavorited: false, favoriteCount: 4 },
      };
      mockService.removeFavorite.mockResolvedValue(svcResult);

      await favoriteController.removeFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(svcResult);
    });

    it("서비스 에러 시 500을 반환한다", async () => {
      req = createReq({ params: { moverId: "m1" } });
      mockService.removeFavorite.mockRejectedValue(new Error("svc error"));

      await favoriteController.removeFavorite(req, res);

      expect(mockSentry.captureException).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    });
  });

  describe("getFavoriteMovers", () => {
    it("limit이 범위를 벗어나면 400을 반환한다", async () => {
      req = createReq({ query: { limit: "0" } });

      await favoriteController.getFavoriteMovers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "limit은 1-50 사이의 값이어야 합니다.",
      });
    });

    it("CUSTOMER가 아니면 403을 반환한다", async () => {
      req = createReq({ user: { userId: "u1", name: "n", userType: "MOVER" }, query: { limit: "3" } });

      await favoriteController.getFavoriteMovers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("로그인 정보가 없으면 403을 반환한다", async () => {
      req = createReq({ user: undefined, query: { limit: "3" } });

      await favoriteController.getFavoriteMovers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("정상 조회 시 200으로 목록을 반환한다", async () => {
      req = createReq({ query: { limit: "3", cursor: "cursor-1" } });
      const mockResult = { items: [{ id: "m1" }], nextCursor: undefined, hasNext: false } as any;
      mockRepo.getFavoriteMovers.mockResolvedValue(mockResult);

      await favoriteController.getFavoriteMovers(req, res);

      expect(mockRepo.getFavoriteMovers).toHaveBeenCalledWith("customer-1", 3, "cursor-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "찜한 기사님 목록을 성공적으로 조회했습니다.",
        data: mockResult,
      });
    });

    it("에러 시 500을 반환한다", async () => {
      req = createReq({ query: { limit: "3" } });
      mockRepo.getFavoriteMovers.mockRejectedValue(new Error("repo error"));

      await favoriteController.getFavoriteMovers(req, res);

      expect(mockSentry.captureException).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    });

    it("limit이 숫자가 아니면 400을 반환한다", async () => {
      req = createReq({ query: { limit: "abc" } });

      await favoriteController.getFavoriteMovers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "limit은 1-50 사이의 값이어야 합니다.",
      });
    });

    it("limit이 51 이상이면 400을 반환한다", async () => {
      req = createReq({ query: { limit: "51" } });

      await favoriteController.getFavoriteMovers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "limit은 1-50 사이의 값이어야 합니다.",
      });
    });

    it("limit이 없으면 기본값 3으로 조회한다", async () => {
      req = createReq({ query: {} });
      const mockResult = { items: [], nextCursor: undefined, hasNext: false } as any;
      mockRepo.getFavoriteMovers.mockResolvedValue(mockResult);

      await favoriteController.getFavoriteMovers(req, res);

      expect(mockRepo.getFavoriteMovers).toHaveBeenCalledWith("customer-1", 3, undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "찜한 기사님 목록을 성공적으로 조회했습니다.",
        data: mockResult,
      });
    });
  });

  describe("getFavoriteStatus", () => {
    it("moverId가 누락되면 400을 반환한다", async () => {
      req = createReq({ params: {} });

      await favoriteController.getFavoriteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 기사님 ID입니다.",
      });
    });
    it("moverId 파라미터가 유효하지 않으면 400을 반환한다", async () => {
      req = createReq({ params: { moverId: 123 } });

      await favoriteController.getFavoriteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 기사님 ID입니다.",
      });
    });

    it("CUSTOMER가 아니면 403을 반환한다", async () => {
      req = createReq({ user: { userId: "u1", name: "n", userType: "MOVER" }, params: { moverId: "m1" } });

      await favoriteController.getFavoriteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("로그인 정보가 없으면 403을 반환한다", async () => {
      req = createReq({ user: undefined, params: { moverId: "m1" } });

      await favoriteController.getFavoriteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "일반 유저만 찜하기를 사용할 수 있습니다.",
      });
    });

    it("정상 조회 시 200으로 상태를 반환한다", async () => {
      req = createReq({ params: { moverId: "m1" } });
      const mockStatus = { isFavorited: true, favoriteCount: 10 };
      mockRepo.getFavoriteStatus.mockResolvedValue(mockStatus as any);

      await favoriteController.getFavoriteStatus(req, res);

      expect(mockRepo.getFavoriteStatus).toHaveBeenCalledWith("customer-1", "m1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "찜하기 상태를 성공적으로 조회했습니다.",
        data: mockStatus,
      });
    });

    it("에러 시 500을 반환한다", async () => {
      req = createReq({ params: { moverId: "m1" } });
      mockRepo.getFavoriteStatus.mockRejectedValue(new Error("repo error"));

      await favoriteController.getFavoriteStatus(req, res);

      expect(mockSentry.captureException).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    });
  });
});
