// @ts-nocheck
// @jest-environment node

import EstimateRequestService from "./estimateRequest.service";

// Repository 완전 모킹
jest.mock("../repositories/estimateRequest.repository", () => ({
  findOrCreateAddress: jest.fn(),
  createEstimateRequest: jest.fn(),
  getActiveEstimateRequestByUserId: jest.fn(),
  hasPendingRequest: jest.fn(),
  updateEstimateRequest: jest.fn(),
  cancelEstimateRequest: jest.fn(),
}));

import estimateRequestRepository from "../repositories/estimateRequest.repository";

const mockRepo = estimateRequestRepository as jest.Mocked<typeof estimateRequestRepository>;

describe("EstimateRequestService - 유닛 테스트", () => {
  let service: EstimateRequestService;

  beforeEach(() => {
    service = new EstimateRequestService();
    jest.clearAllMocks();
  });

  describe("createEstimateRequest", () => {
    it("should create estimate request successfully", async () => {
      // Mock 데이터 설정
      const mockFromAddress = { id: "from-address-id", city: "서울", district: "강남구" };
      const mockToAddress = { id: "to-address-id", city: "부산", district: "해운대구" };
      const mockEstimateRequest = {
        id: "estimate-id",
        userId: "user1",
        moveType: "HOME",
        fromAddressId: "from-address-id",
        toAddressId: "to-address-id",
      };

      // Repository 메서드들 모킹
      mockRepo.findOrCreateAddress.mockResolvedValueOnce(mockFromAddress).mockResolvedValueOnce(mockToAddress);
      mockRepo.createEstimateRequest.mockResolvedValue(mockEstimateRequest);

      const params = {
        userId: "user1",
        moveType: "HOME",
        fromCity: "서울",
        fromDistrict: "강남구",
        fromDetail: "테헤란로 123",
        fromRegion: "SEOUL",
        toCity: "부산",
        toDistrict: "해운대구",
        toDetail: "해운대로 456",
        toRegion: "BUSAN",
        moveDate: "2024-08-20",
        description: "테스트 이사",
      };

      const result = await service.createEstimateRequest(params);

      // 검증
      expect(mockRepo.findOrCreateAddress).toHaveBeenCalledTimes(2);
      expect(mockRepo.findOrCreateAddress).toHaveBeenNthCalledWith(1, {
        city: "서울",
        district: "강남구",
        detail: "테헤란로 123",
        region: "SEOUL",
      });
      expect(mockRepo.findOrCreateAddress).toHaveBeenNthCalledWith(2, {
        city: "부산",
        district: "해운대구",
        detail: "해운대로 456",
        region: "BUSAN",
      });
      expect(mockRepo.createEstimateRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          moveType: "HOME",
          fromAddressId: "from-address-id",
          toAddressId: "to-address-id",
          moveDate: new Date("2024-08-20"),
          description: "테스트 이사",
        }),
        "user1",
      );
      expect(result).toEqual(mockEstimateRequest);
    });

    it("should throw error for same from/to address", async () => {
      const params = {
        userId: "user1",
        moveType: "HOME",
        fromCity: "서울",
        fromDistrict: "강남구",
        fromDetail: "테헤란로 123",
        fromRegion: "SEOUL",
        toCity: "서울",
        toDistrict: "강남구",
        toDetail: "테헤란로 123",
        toRegion: "SEOUL",
        moveDate: "2024-08-20",
        description: "동일 주소 테스트",
      };

      await expect(service.createEstimateRequest(params)).rejects.toThrow("출발지와 도착지는 달라야 합니다.");
    });
  });

  describe("getActiveEstimateRequestByUserId", () => {
    it("should return active estimate request", async () => {
      const mockEstimateRequest = {
        id: "estimate-id",
        userId: "user1",
        moveType: "HOME",
        status: "PENDING",
        fromAddress: { city: "서울", district: "강남구" },
        toAddress: { city: "부산", district: "해운대구" },
      };

      mockRepo.getActiveEstimateRequestByUserId.mockResolvedValue(mockEstimateRequest);

      const result = await service.getActiveEstimateRequestByUserId("user1");

      expect(mockRepo.getActiveEstimateRequestByUserId).toHaveBeenCalledWith("user1");
      expect(result).toEqual(mockEstimateRequest);
    });

    it("should return null when no active request exists", async () => {
      mockRepo.getActiveEstimateRequestByUserId.mockResolvedValue(null);

      const result = await service.getActiveEstimateRequestByUserId("user1");

      expect(result).toBeNull();
    });
  });

  describe("hasPendingRequest", () => {
    it("should return true when pending request exists", async () => {
      mockRepo.hasPendingRequest.mockResolvedValue(true);

      const result = await service.hasPendingRequest("user1");

      expect(mockRepo.hasPendingRequest).toHaveBeenCalledWith("user1");
      expect(result).toBe(true);
    });

    it("should return false when no pending request", async () => {
      mockRepo.hasPendingRequest.mockResolvedValue(false);

      const result = await service.hasPendingRequest("user1");

      expect(result).toBe(false);
    });
  });

  describe("updateActiveEstimateRequest", () => {
    it("should update estimate request successfully", async () => {
      const mockUpdatedRequest = {
        id: "estimate-id",
        description: "업데이트된 설명",
        status: "PENDING",
      };

      mockRepo.updateEstimateRequest.mockResolvedValue(mockUpdatedRequest);

      const result = await service.updateActiveEstimateRequest("estimate-id", {
        description: "업데이트된 설명",
      });

      expect(mockRepo.updateEstimateRequest).toHaveBeenCalledWith("estimate-id", {
        description: "업데이트된 설명",
      });
      expect(result).toEqual(mockUpdatedRequest);
    });

    it("should throw error when update fails", async () => {
      mockRepo.updateEstimateRequest.mockRejectedValue(new Error("Not found"));

      await expect(service.updateActiveEstimateRequest("invalid-id", { description: "fail" })).rejects.toThrow(
        "Not found",
      );
    });
  });

  describe("cancelActiveEstimateRequest", () => {
    it("should cancel estimate request successfully", async () => {
      const mockCancelledRequest = {
        id: "estimate-id",
        status: "CANCELLED",
      };

      mockRepo.cancelEstimateRequest.mockResolvedValue(mockCancelledRequest);

      const result = await service.cancelActiveEstimateRequest("estimate-id");

      expect(mockRepo.cancelEstimateRequest).toHaveBeenCalledWith("estimate-id");
      expect(result).toEqual(mockCancelledRequest);
    });

    it("should throw error when cancel fails", async () => {
      mockRepo.cancelEstimateRequest.mockRejectedValue(new Error("Not found"));

      await expect(service.cancelActiveEstimateRequest("invalid-id")).rejects.toThrow("Not found");
    });
  });
});
