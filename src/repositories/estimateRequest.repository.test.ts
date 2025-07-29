// @ts-nocheck
// @jest-environment node

import { PrismaClient, RequestStatus, UserType, MoveType, RegionType } from "@prisma/client";

// Mock Prisma
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    estimateRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      $transaction: jest.fn(),
    },
    address: {
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    estimate: {
      findFirst: jest.fn(),
    },
  })),
  RequestStatus: {
    PENDING: "PENDING",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
  },
  UserType: {
    CUSTOMER: "CUSTOMER",
    MOVER: "MOVER",
  },
  MoveType: {
    SMALL: "SMALL",
    HOME: "HOME",
    OFFICE: "OFFICE",
  },
  RegionType: {
    SEOUL: "SEOUL",
    GYEONGGI: "GYEONGGI",
  },
}));

// Import after mocking
import estimateRequestRepository from "./estimateRequest.repository";

describe("EstimateRequestRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEstimateRequest", () => {
    it("should create estimate request successfully", async () => {
      const mockData = {
        moveType: "HOME",
        moveDate: "2025-12-31",
        fromAddressId: "address1",
        toAddressId: "address2",
        description: "Test request",
      };
      const mockUserId = "user123";
      const mockCreatedRequest = {
        id: "request123",
        customerId: mockUserId,
        moveType: "HOME",
        moveDate: new Date("2025-12-31"),
        fromAddressId: "address1",
        toAddressId: "address2",
        status: "PENDING",
        description: "Test request",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the prisma instance
      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.create.mockResolvedValue(mockCreatedRequest);

      const result = await estimateRequestRepository.createEstimateRequest(mockData, mockUserId);

      expect(result).toEqual(mockCreatedRequest);
      expect(mockPrisma.estimateRequest.create).toHaveBeenCalledWith({
        data: {
          customerId: mockUserId,
          moveType: "HOME",
          moveDate: new Date("2025-12-31"),
          fromAddressId: "address1",
          toAddressId: "address2",
          status: "PENDING",
          description: "Test request",
        },
      });
    });
  });

  describe("getActiveEstimateRequestByUserId", () => {
    it("should return active estimate request when exists", async () => {
      const mockUserId = "user123";
      const mockRequest = {
        id: "request123",
        customerId: mockUserId,
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

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest);

      const result = await estimateRequestRepository.getActiveEstimateRequestByUserId(mockUserId);

      expect(result).toEqual(mockRequest);
      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: mockUserId,
          status: "PENDING",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: expect.any(Object),
      });
    });

    it("should return null when no active estimate request exists", async () => {
      const mockUserId = "user123";

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.getActiveEstimateRequestByUserId(mockUserId);

      expect(result).toBeNull();
      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: mockUserId,
          status: "PENDING",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: expect.any(Object),
      });
    });
  });

  describe("hasPendingRequest", () => {
    it("should return true when user has pending request", async () => {
      const mockUserId = "user123";
      const mockRequest = {
        id: "request123",
        customerId: mockUserId,
        status: "PENDING",
      };

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest);

      const result = await estimateRequestRepository.hasPendingRequest(mockUserId);

      expect(result).toBe(true);
      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: mockUserId,
          status: "PENDING",
          deletedAt: null,
        },
      });
    });

    it("should return false when user has no pending request", async () => {
      const mockUserId = "user123";

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.hasPendingRequest(mockUserId);

      expect(result).toBe(false);
      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: mockUserId,
          status: "PENDING",
          deletedAt: null,
        },
      });
    });
  });

  describe("hasEstimateFromMover", () => {
    it("should return true when movers have submitted estimates", async () => {
      const mockUserId = "user123";
      const mockRequest = { id: "request123" };
      const mockEstimate = { id: "estimate123" };

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest);
      mockPrisma.estimate.findFirst.mockResolvedValue(mockEstimate);

      const result = await estimateRequestRepository.hasEstimateFromMover(mockUserId);

      expect(result).toBe(true);
      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: mockUserId,
          status: "PENDING",
          deletedAt: null,
        },
        select: { id: true },
      });
      expect(mockPrisma.estimate.findFirst).toHaveBeenCalledWith({
        where: {
          estimateRequestId: "request123",
          deletedAt: null,
        },
      });
    });

    it("should return false when no movers have submitted estimates", async () => {
      const mockUserId = "user123";
      const mockRequest = { id: "request123" };

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest);
      mockPrisma.estimate.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.hasEstimateFromMover(mockUserId);

      expect(result).toBe(false);
    });

    it("should return false when no pending request exists", async () => {
      const mockUserId = "user123";

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.hasEstimateFromMover(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe("findOrCreateAddress", () => {
    it("should create new address successfully", async () => {
      const mockAddressData = {
        zoneCode: "06123",
        region: "SEOUL",
        city: "강남구",
        district: "역삼동",
        detail: "테헤란로 123",
      };
      const mockCreatedAddress = {
        id: "address123",
        zoneCode: "06123",
        region: "SEOUL",
        city: "강남구",
        district: "역삼동",
        detail: "테헤란로 123",
      };

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.address.create.mockResolvedValue(mockCreatedAddress);

      const result = await estimateRequestRepository.findOrCreateAddress(mockAddressData);

      expect(result).toEqual({ id: "address123" });
      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: {
          zoneCode: "06123",
          city: "강남구",
          district: "역삼동",
          region: "SEOUL",
          detail: "테헤란로 123",
        },
      });
    });

    it("should handle null detail address", async () => {
      const mockAddressData = {
        zoneCode: "06123",
        region: "SEOUL",
        city: "강남구",
        district: "역삼동",
        detail: null,
      };
      const mockCreatedAddress = {
        id: "address123",
        zoneCode: "06123",
        region: "SEOUL",
        city: "강남구",
        district: "역삼동",
        detail: null,
      };

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.address.create.mockResolvedValue(mockCreatedAddress);

      const result = await estimateRequestRepository.findOrCreateAddress(mockAddressData);

      expect(result).toEqual({ id: "address123" });
      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: {
          zoneCode: "06123",
          city: "강남구",
          district: "역삼동",
          region: "SEOUL",
          detail: null,
        },
      });
    });
  });

  describe("softDeleteAddress", () => {
    it("should soft delete address successfully", async () => {
      const mockAddressId = "address123";

      // Mock the date to be consistent
      const mockDate = new Date("2025-07-29");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate);

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.address.update.mockResolvedValue({ id: mockAddressId });

      await estimateRequestRepository.softDeleteAddress(mockAddressId);

      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: mockAddressId },
        data: { deletedAt: mockDate },
      });

      // Restore Date
      jest.restoreAllMocks();
    });
  });

  describe("checkUserType", () => {
    it("should return customer type for customer user", async () => {
      const mockUserId = "user123";
      const mockUser = {
        userType: ["CUSTOMER"],
        isCustomer: true,
        isMover: false,
      };

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await estimateRequestRepository.checkUserType(mockUserId);

      expect(result).toEqual({
        isCustomer: true,
        isMover: false,
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { userType: true, isCustomer: true, isMover: true },
      });
    });

    it("should return mover type for mover user", async () => {
      const mockUserId = "user123";
      const mockUser = {
        userType: ["MOVER"],
        isCustomer: false,
        isMover: true,
      };

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await estimateRequestRepository.checkUserType(mockUserId);

      expect(result).toEqual({
        isCustomer: false,
        isMover: true,
      });
    });

    it("should throw error when user not found", async () => {
      const mockUserId = "user123";

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(estimateRequestRepository.checkUserType(mockUserId)).rejects.toThrow("사용자를 찾을 수 없습니다.");
    });
  });

  describe("cancelEstimateRequest", () => {
    it("should cancel estimate request successfully", async () => {
      const mockRequestId = "request123";
      const mockRequest = {
        fromAddressId: "address1",
        toAddressId: "address2",
      };
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

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.estimateRequest.update.mockResolvedValue(mockCancelledRequest);
      mockPrisma.address.update.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const result = await estimateRequestRepository.cancelEstimateRequest(mockRequestId);

      expect(result).toEqual(mockCancelledRequest);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should throw error when estimate request not found", async () => {
      const mockRequestId = "request123";

      const mockPrisma = (estimateRequestRepository as any).prisma;
      mockPrisma.estimateRequest.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      await expect(estimateRequestRepository.cancelEstimateRequest(mockRequestId)).rejects.toThrow(
        "견적 요청을 찾을 수 없습니다.",
      );
    });
  });
});
