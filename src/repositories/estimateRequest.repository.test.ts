// @ts-nocheck
// @jest-environment node

// Prisma 완전 모킹
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    estimateRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    address: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  })),
}));

import estimateRequestRepository from "./estimateRequest.repository";
import { PrismaClient } from "@prisma/client";

describe("EstimateRequestRepository - 유닛 테스트", () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe("findOrCreateAddress", () => {
    it("should find existing address", async () => {
      // Mock 데이터 설정
      const mockAddress = {
        id: "address-id",
        city: "서울",
        district: "강남구",
        detail: "테헤란로 123",
        region: "SEOUL",
      };

      mockPrisma.address.findFirst.mockResolvedValue(mockAddress);

      const result = await estimateRequestRepository.findOrCreateAddress({
        city: "서울",
        district: "강남구",
        detail: "테헤란로 123",
        region: "SEOUL",
      });

      // 검증
      expect(mockPrisma.address.findFirst).toHaveBeenCalledWith({
        where: {
          city: "서울",
          district: "강남구",
          detail: "테헤란로 123",
          region: "SEOUL",
        },
      });
      expect(result).toEqual(mockAddress);
    });

    it("should create new address if not exists", async () => {
      const mockAddress = {
        id: "new-address-id",
        city: "부산",
        district: "해운대구",
        detail: "해운대로 456",
        region: "BUSAN",
      };

      mockPrisma.address.findFirst.mockResolvedValue(null);
      mockPrisma.address.create.mockResolvedValue(mockAddress);

      const result = await estimateRequestRepository.findOrCreateAddress({
        city: "부산",
        district: "해운대구",
        detail: "해운대로 456",
        region: "BUSAN",
      });

      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: {
          city: "부산",
          district: "해운대구",
          detail: "해운대로 456",
          region: "BUSAN",
        },
      });
      expect(result).toEqual(mockAddress);
    });
  });

  describe("createEstimateRequest", () => {
    it("should create estimate request successfully", async () => {
      const mockEstimateRequest = {
        id: "estimate-id",
        userId: "user-id",
        moveType: "HOME",
        fromAddressId: "from-address-id",
        toAddressId: "to-address-id",
        moveDate: new Date("2024-08-15"),
        description: "테스트 이사",
        status: "PENDING",
      };

      mockPrisma.estimateRequest.create.mockResolvedValue(mockEstimateRequest);

      const result = await estimateRequestRepository.createEstimateRequest(
        {
          moveType: "HOME",
          fromAddressId: "from-address-id",
          toAddressId: "to-address-id",
          moveDate: new Date("2024-08-15"),
          description: "테스트 이사",
        },
        "user-id",
      );

      expect(mockPrisma.estimateRequest.create).toHaveBeenCalledWith({
        data: {
          userId: "user-id",
          moveType: "HOME",
          fromAddressId: "from-address-id",
          toAddressId: "to-address-id",
          moveDate: new Date("2024-08-15"),
          description: "테스트 이사",
          status: "PENDING",
        },
      });
      expect(result).toEqual(mockEstimateRequest);
    });
  });

  describe("getActiveEstimateRequestByUserId", () => {
    it("should get active estimate request", async () => {
      const mockEstimateRequest = {
        id: "estimate-id",
        userId: "user-id",
        moveType: "HOME",
        status: "PENDING",
        fromAddress: { city: "서울", district: "강남구" },
        toAddress: { city: "부산", district: "해운대구" },
      };

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockEstimateRequest);

      const result = await estimateRequestRepository.getActiveEstimateRequestByUserId("user-id");

      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-id",
          status: {
            in: ["PENDING", "IN_PROGRESS"],
          },
        },
        include: {
          fromAddress: true,
          toAddress: true,
        },
      });
      expect(result).toEqual(mockEstimateRequest);
    });

    it("should return null if no active request", async () => {
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.getActiveEstimateRequestByUserId("user-id");

      expect(result).toBeNull();
    });
  });

  describe("hasPendingRequest", () => {
    it("should return true if pending request exists", async () => {
      const mockEstimateRequest = {
        id: "estimate-id",
        status: "PENDING",
      };

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockEstimateRequest);

      const result = await estimateRequestRepository.hasPendingRequest("user-id");

      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-id",
          status: "PENDING",
        },
      });
      expect(result).toBe(true);
    });

    it("should return false if no pending request", async () => {
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.hasPendingRequest("user-id");

      expect(result).toBe(false);
    });
  });

  describe("updateEstimateRequest", () => {
    it("should update estimate request successfully", async () => {
      const mockUpdatedRequest = {
        id: "estimate-id",
        description: "업데이트된 설명",
        status: "PENDING",
      };

      mockPrisma.estimateRequest.update.mockResolvedValue(mockUpdatedRequest);

      const result = await estimateRequestRepository.updateEstimateRequest("estimate-id", {
        description: "업데이트된 설명",
      });

      expect(mockPrisma.estimateRequest.update).toHaveBeenCalledWith({
        where: { id: "estimate-id" },
        data: { description: "업데이트된 설명" },
      });
      expect(result).toEqual(mockUpdatedRequest);
    });
  });

  describe("cancelEstimateRequest", () => {
    it("should cancel estimate request successfully", async () => {
      const mockCancelledRequest = {
        id: "estimate-id",
        status: "CANCELLED",
      };

      mockPrisma.estimateRequest.update.mockResolvedValue(mockCancelledRequest);

      const result = await estimateRequestRepository.cancelEstimateRequest("estimate-id");

      expect(mockPrisma.estimateRequest.update).toHaveBeenCalledWith({
        where: { id: "estimate-id" },
        data: { status: "CANCELLED" },
      });
      expect(result).toEqual(mockCancelledRequest);
    });
  });
});
