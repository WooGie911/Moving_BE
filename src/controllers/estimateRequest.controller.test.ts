// @ts-nocheck
// @jest-environment node

import EstimateRequestController from "./estimateRequest.controller";

// Service 완전 모킹
jest.mock("../services/estimateRequest.service", () => ({
  createEstimateRequest: jest.fn(),
  getActiveEstimateRequestByUserId: jest.fn(),
  updateActiveEstimateRequest: jest.fn(),
  cancelActiveEstimateRequest: jest.fn(),
  hasPendingRequest: jest.fn(),
}));

import EstimateRequestService from "../services/estimateRequest.service";

const mockService = EstimateRequestService as jest.Mocked<typeof EstimateRequestService>;

describe("EstimateRequestController - 유닛 테스트", () => {
  let controller: EstimateRequestController;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    controller = new EstimateRequestController();
    mockReq = {
      user: { userId: "test-user-id" },
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("createEstimateRequest", () => {
    it("should create estimate request successfully", async () => {
      // Mock 데이터 설정
      const requestData = {
        moveType: "HOME",
        fromCity: "서울",
        fromDistrict: "강남구",
        fromDetail: "테헤란로 123",
        fromRegion: "SEOUL",
        toCity: "부산",
        toDistrict: "해운대구",
        toDetail: "해운대로 456",
        toRegion: "BUSAN",
        moveDate: "2024-08-15",
        description: "테스트 이사",
      };

      const mockCreatedRequest = { id: "test-id", userId: "test-user-id" };

      mockReq.body = requestData;
      mockService.createEstimateRequest.mockResolvedValue(mockCreatedRequest);

      await controller.createEstimateRequest(mockReq, mockRes);

      // 검증
      expect(mockService.createEstimateRequest).toHaveBeenCalledWith({
        userId: "test-user-id",
        ...requestData,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 요청이 성공적으로 생성되었습니다.",
        data: mockCreatedRequest,
      });
    });

    it("should return error for same from/to address", async () => {
      const requestData = {
        moveType: "HOME",
        fromCity: "서울",
        fromDistrict: "강남구",
        fromDetail: "테헤란로 123",
        fromRegion: "SEOUL",
        toCity: "서울",
        toDistrict: "강남구",
        toDetail: "테헤란로 123",
        toRegion: "SEOUL",
        moveDate: "2024-08-15",
        description: "동일 주소 테스트",
      };

      mockReq.body = requestData;

      await controller.createEstimateRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "출발지와 도착지는 달라야 합니다.",
      });
    });

    it("should handle service error", async () => {
      const requestData = {
        moveType: "HOME",
        fromCity: "서울",
        fromDistrict: "강남구",
        fromDetail: "테헤란로 123",
        fromRegion: "SEOUL",
        toCity: "부산",
        toDistrict: "해운대구",
        toDetail: "해운대로 456",
        toRegion: "BUSAN",
        moveDate: "2024-08-15",
        description: "테스트 이사",
      };

      mockReq.body = requestData;
      mockService.createEstimateRequest.mockRejectedValue(new Error("Service error"));

      await controller.createEstimateRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "견적 요청 생성 중 오류가 발생했습니다.",
      });
    });
  });

  describe("getActiveEstimateRequest", () => {
    it("should get active estimate request successfully", async () => {
      const mockData = {
        id: "test-id",
        moveType: "HOME",
        status: "PENDING",
        fromAddress: { city: "서울", district: "강남구" },
        toAddress: { city: "부산", district: "해운대구" },
      };

      mockService.getActiveEstimateRequestByUserId.mockResolvedValue(mockData);

      await controller.getActiveEstimateRequest(mockReq, mockRes);

      expect(mockService.getActiveEstimateRequestByUserId).toHaveBeenCalledWith("test-user-id");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    it("should return null when no active request exists", async () => {
      mockService.getActiveEstimateRequestByUserId.mockResolvedValue(null);

      await controller.getActiveEstimateRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });

    it("should handle service error", async () => {
      mockService.getActiveEstimateRequestByUserId.mockRejectedValue(new Error("Service error"));

      await controller.getActiveEstimateRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "견적 요청 조회 중 오류가 발생했습니다.",
      });
    });
  });

  describe("updateEstimateRequest", () => {
    it("should update estimate request successfully", async () => {
      const updateData = {
        description: "업데이트된 설명",
      };

      const mockUpdatedRequest = {
        id: "test-id",
        description: "업데이트된 설명",
        status: "PENDING",
      };

      mockReq.params = { id: "test-id" };
      mockReq.body = updateData;
      mockService.updateActiveEstimateRequest.mockResolvedValue(mockUpdatedRequest);

      await controller.updateEstimateRequest(mockReq, mockRes);

      expect(mockService.updateActiveEstimateRequest).toHaveBeenCalledWith("test-id", updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 요청이 성공적으로 업데이트되었습니다.",
        data: mockUpdatedRequest,
      });
    });

    it("should handle service error", async () => {
      const updateData = { description: "업데이트된 설명" };
      mockReq.params = { id: "test-id" };
      mockReq.body = updateData;
      mockService.updateActiveEstimateRequest.mockRejectedValue(new Error("Service error"));

      await controller.updateEstimateRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "견적 요청 업데이트 중 오류가 발생했습니다.",
      });
    });
  });

  describe("cancelEstimateRequest", () => {
    it("should cancel estimate request successfully", async () => {
      const mockCancelledRequest = {
        id: "test-id",
        status: "CANCELLED",
      };

      mockReq.params = { id: "test-id" };
      mockService.cancelActiveEstimateRequest.mockResolvedValue(mockCancelledRequest);

      await controller.cancelEstimateRequest(mockReq, mockRes);

      expect(mockService.cancelActiveEstimateRequest).toHaveBeenCalledWith("test-id");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 요청이 성공적으로 취소되었습니다.",
        data: mockCancelledRequest,
      });
    });

    it("should handle service error", async () => {
      mockReq.params = { id: "test-id" };
      mockService.cancelActiveEstimateRequest.mockRejectedValue(new Error("Service error"));

      await controller.cancelEstimateRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "견적 요청 취소 중 오류가 발생했습니다.",
      });
    });
  });
});
