// @ts-nocheck
// @jest-environment node

import EstimateRequestService from "./estimateRequest.service";
import estimateRequestRepository from "../repositories/estimateRequest.repository";

// Mock the repository
jest.mock("../repositories/estimateRequest.repository");

const mockEstimateRequestRepository = estimateRequestRepository as jest.Mocked<typeof estimateRequestRepository>;

describe("EstimateRequestService", () => {
  let service: EstimateRequestService;

  beforeEach(() => {
    service = new EstimateRequestService();
    jest.clearAllMocks();
  });

  describe("checkUserType", () => {
    it("should return customer type for customer user", async () => {
      const mockUser = {
        userType: ["CUSTOMER"],
        isCustomer: true,
        isMover: false,
      };

      mockEstimateRequestRepository.checkUserType = jest.fn().mockResolvedValue({
        isCustomer: true,
        isMover: false,
      });

      const result = await service.checkUserType("customer123");

      expect(result.isCustomer).toBe(true);
      expect(result.isMover).toBe(false);
      expect(mockEstimateRequestRepository.checkUserType).toHaveBeenCalledWith("customer123");
    });

    it("should return mover type for mover user", async () => {
      mockEstimateRequestRepository.checkUserType = jest.fn().mockResolvedValue({
        isCustomer: false,
        isMover: true,
      });

      const result = await service.checkUserType("mover123");

      expect(result.isCustomer).toBe(false);
      expect(result.isMover).toBe(true);
      expect(mockEstimateRequestRepository.checkUserType).toHaveBeenCalledWith("mover123");
    });

    it("should throw error when user not found", async () => {
      mockEstimateRequestRepository.checkUserType = jest
        .fn()
        .mockRejectedValue(new Error("사용자를 찾을 수 없습니다."));

      await expect(service.checkUserType("invalid123")).rejects.toThrow("사용자를 찾을 수 없습니다.");
    });
  });

  describe("hasPendingRequest", () => {
    it("should return true when user has pending request", async () => {
      mockEstimateRequestRepository.hasPendingRequest = jest.fn().mockResolvedValue(true);

      const result = await service.hasPendingRequest("user123");

      expect(result).toBe(true);
      expect(mockEstimateRequestRepository.hasPendingRequest).toHaveBeenCalledWith("user123");
    });

    it("should return false when user has no pending request", async () => {
      mockEstimateRequestRepository.hasPendingRequest = jest.fn().mockResolvedValue(false);

      const result = await service.hasPendingRequest("user123");

      expect(result).toBe(false);
      expect(mockEstimateRequestRepository.hasPendingRequest).toHaveBeenCalledWith("user123");
    });
  });

  describe("hasEstimateFromMover", () => {
    it("should return true when movers have submitted estimates", async () => {
      mockEstimateRequestRepository.hasEstimateFromMover = jest.fn().mockResolvedValue(true);

      const result = await service.hasEstimateFromMover("user123");

      expect(result).toBe(true);
      expect(mockEstimateRequestRepository.hasEstimateFromMover).toHaveBeenCalledWith("user123");
    });

    it("should return false when no movers have submitted estimates", async () => {
      mockEstimateRequestRepository.hasEstimateFromMover = jest.fn().mockResolvedValue(false);

      const result = await service.hasEstimateFromMover("user123");

      expect(result).toBe(false);
      expect(mockEstimateRequestRepository.hasEstimateFromMover).toHaveBeenCalledWith("user123");
    });
  });

  describe("getActiveEstimateRequestByUserId", () => {
    it("should return active estimate request when exists", async () => {
      const mockRequest = {
        id: "request123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date("2025-12-31"),
        fromAddressId: "address1",
        toAddressId: "address2",
        status: "PENDING",
        description: "Test request",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        fromAddress: {
          zoneCode: "06123",
          city: "강남구",
          district: "역삼동",
          detail: "테헤란로 123",
          region: "SEOUL",
          deletedAt: null,
        },
        toAddress: {
          zoneCode: "13561",
          city: "분당구",
          district: "정자동",
          detail: "판교로 456",
          region: "GYEONGGI",
          deletedAt: null,
        },
      };

      mockEstimateRequestRepository.getActiveEstimateRequestByUserId = jest.fn().mockResolvedValue(mockRequest);

      const result = await service.getActiveEstimateRequestByUserId("user123");

      expect(result).toEqual(mockRequest);
      expect(mockEstimateRequestRepository.getActiveEstimateRequestByUserId).toHaveBeenCalledWith("user123");
    });

    it("should return null when no active estimate request exists", async () => {
      mockEstimateRequestRepository.getActiveEstimateRequestByUserId = jest.fn().mockResolvedValue(null);

      const result = await service.getActiveEstimateRequestByUserId("user123");

      expect(result).toBeNull();
      expect(mockEstimateRequestRepository.getActiveEstimateRequestByUserId).toHaveBeenCalledWith("user123");
    });
  });

  describe("createEstimateRequest", () => {
    it("should create estimate request successfully", async () => {
      const mockParams = {
        userId: "user123",
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
          zoneCode: "13561",
        },
        description: "Test request",
      };

      const mockFromAddress = { id: "address1" };
      const mockToAddress = { id: "address2" };
      const mockCreatedRequest = {
        id: "request123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date("2025-12-31"),
        fromAddressId: "address1",
        toAddressId: "address2",
        status: "PENDING",
        description: "Test request",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the private method
      const processAddressSpy = jest.spyOn(service as any, "processAddress");
      processAddressSpy.mockResolvedValueOnce(mockFromAddress).mockResolvedValueOnce(mockToAddress);

      mockEstimateRequestRepository.createEstimateRequest = jest.fn().mockResolvedValue(mockCreatedRequest);

      const result = await service.createEstimateRequest(mockParams);

      expect(result).toEqual(mockCreatedRequest);
      expect(processAddressSpy).toHaveBeenCalledTimes(2);
      expect(mockEstimateRequestRepository.createEstimateRequest).toHaveBeenCalledWith(
        {
          moveType: "HOME",
          moveDate: "2025-12-31",
          fromAddressId: "address1",
          toAddressId: "address2",
          description: "Test request",
        },
        "user123",
      );
    });

    it("should throw error when address processing fails", async () => {
      const mockParams = {
        userId: "user123",
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
          zoneCode: "13561",
        },
        description: "Test request",
      };

      const processAddressSpy = jest.spyOn(service as any, "processAddress");
      processAddressSpy.mockRejectedValue(new Error("주소 처리 실패"));

      await expect(service.createEstimateRequest(mockParams)).rejects.toThrow("주소 처리 실패");
    });
  });

  describe("updateActiveEstimateRequest", () => {
    it("should update estimate request successfully", async () => {
      const mockRequestId = "request123";
      const mockUpdateData = {
        movingType: "office",
        movingDate: "2025-12-31",
        description: "Updated request",
      };

      const mockUpdatedRequest = {
        id: "request123",
        customerId: "user123",
        moveType: "OFFICE",
        moveDate: new Date("2025-12-31"),
        fromAddressId: "address1",
        toAddressId: "address2",
        status: "PENDING",
        description: "Updated request",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstimateRequestRepository.getEstimateRequestById = jest.fn().mockResolvedValue({
        id: "request123",
        fromAddressId: "address1",
        toAddressId: "address2",
      });

      const processAddressSpy = jest.spyOn(service as any, "processAddress");
      processAddressSpy.mockResolvedValue({ id: "address3" });

      mockEstimateRequestRepository.updateEstimateRequest = jest.fn().mockResolvedValue(mockUpdatedRequest);
      mockEstimateRequestRepository.softDeleteAddress = jest.fn().mockResolvedValue();

      const result = await service.updateActiveEstimateRequest(mockRequestId, mockUpdateData);

      expect(result).toEqual(mockUpdatedRequest);
      expect(mockEstimateRequestRepository.updateEstimateRequest).toHaveBeenCalled();
    });

    it("should throw error when estimate request not found", async () => {
      const mockRequestId = "request123";
      const mockUpdateData = {
        movingType: "office",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
      };

      mockEstimateRequestRepository.getEstimateRequestById = jest.fn().mockResolvedValue(null);

      await expect(service.updateActiveEstimateRequest(mockRequestId, mockUpdateData)).rejects.toThrow(
        "견적 요청을 찾을 수 없습니다.",
      );
    });
  });

  describe("cancelActiveEstimateRequest", () => {
    it("should cancel estimate request successfully", async () => {
      const mockRequestId = "request123";
      const mockCancelledRequest = {
        id: "request123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date("2025-12-31"),
        fromAddressId: "address1",
        toAddressId: "address2",
        status: "CANCELLED",
        description: "Cancelled request",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstimateRequestRepository.cancelEstimateRequest = jest.fn().mockResolvedValue(mockCancelledRequest);

      const result = await service.cancelActiveEstimateRequest(mockRequestId);

      expect(result).toEqual(mockCancelledRequest);
      expect(mockEstimateRequestRepository.cancelEstimateRequest).toHaveBeenCalledWith(mockRequestId);
    });
  });
});
