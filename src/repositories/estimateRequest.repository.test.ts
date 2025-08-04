import estimateRequestRepository from "./estimateRequest.repository";
import {
  PrismaClient,
  RequestStatus,
  UserType,
  MoveType,
  RegionType,
} from "@prisma/client";

// Mock the module to return our mock
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    estimateRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
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
    $transaction: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    RequestStatus: {
      PENDING: "PENDING",
      CANCELLED: "CANCELLED",
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
      BUSAN: "BUSAN",
    },
  };
});

// Get the mocked PrismaClient instance
const { PrismaClient: MockedPrismaClient } = require("@prisma/client");
const mockPrisma = new MockedPrismaClient();

describe("EstimateRequest Repository 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. 레포지토리 함수들이 존재하는지 확인
  it("1. 견적 요청 생성 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.createEstimateRequest).toBe(
      "function"
    );
  });

  it("2. 활성 견적 요청 조회 함수가 존재한다", () => {
    expect(
      typeof estimateRequestRepository.getActiveEstimateRequestByUserId
    ).toBe("function");
  });

  it("3. 견적 요청 수정 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.updateEstimateRequest).toBe(
      "function"
    );
  });

  it("4. 견적 요청 취소 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.cancelEstimateRequest).toBe(
      "function"
    );
  });

  it("5. 진행중인 요청 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.hasPendingRequest).toBe("function");
  });

  it("6. 기사님 견적 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.hasEstimateFromMover).toBe(
      "function"
    );
  });

  it("7. 사용자 타입 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.checkUserType).toBe("function");
  });

  it("8. 주소 생성 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.findOrCreateAddress).toBe(
      "function"
    );
  });

  // 실제 함수 호출 테스트
  describe("실제 함수 호출 테스트", () => {
    it("견적 요청 생성 테스트", async () => {
      const mockData = {
        moveType: "HOME" as MoveType,
        moveDate: "2024-12-25",
        fromAddressId: "from-address-id",
        toAddressId: "to-address-id",
        description: "이사 요청",
      };
      const userId = "user-id";
      const mockCreatedRequest = {
        id: "request-id",
        customerId: userId,
        moveType: "HOME",
        moveDate: new Date("2024-12-25"),
        status: "PENDING",
        description: "이사 요청",
      };

      mockPrisma.estimateRequest.create.mockResolvedValue(
        mockCreatedRequest as any
      );

      const result = await estimateRequestRepository.createEstimateRequest(
        mockData,
        userId
      );

      expect(mockPrisma.estimateRequest.create).toHaveBeenCalledWith({
        data: {
          customerId: userId,
          moveType: "HOME",
          moveDate: new Date("2024-12-25"),
          fromAddressId: "from-address-id",
          toAddressId: "to-address-id",
          status: "PENDING",
          description: "이사 요청",
        },
      });
      expect(result).toEqual(mockCreatedRequest);
    });

    it("활성 견적 요청 조회 테스트", async () => {
      const userId = "user-id";
      const mockRequest = {
        id: "request-id",
        customerId: userId,
        moveType: "HOME",
        moveDate: new Date("2024-12-25"),
        status: "PENDING",
        fromAddress: {
          zoneCode: "06123",
          city: "강남구",
          district: "테헤란로",
          detail: "123",
          region: "SEOUL",
          deletedAt: null,
        },
        toAddress: {
          zoneCode: "06124",
          city: "서초구",
          district: "서초동",
          detail: "456",
          region: "SEOUL",
          deletedAt: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(
        mockRequest as any
      );

      const result =
        await estimateRequestRepository.getActiveEstimateRequestByUserId(
          userId
        );

      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          status: "PENDING",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          fromAddressId: true,
          toAddressId: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          fromAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
              deletedAt: true,
            },
          },
          toAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
              deletedAt: true,
            },
          },
        },
      });
      expect(result).toEqual(mockRequest);
    });

    it("견적 요청 수정 테스트", async () => {
      const requestId = "request-id";
      const updateData = {
        moveType: "OFFICE" as MoveType,
        moveDate: new Date("2024-12-26"),
        description: "수정된 이사",
      };
      const mockUpdatedRequest = {
        id: requestId,
        moveType: "OFFICE",
        moveDate: new Date("2024-12-26"),
        description: "수정된 이사",
      };

      mockPrisma.estimateRequest.update.mockResolvedValue(
        mockUpdatedRequest as any
      );

      const result = await estimateRequestRepository.updateEstimateRequest(
        requestId,
        updateData
      );

      expect(mockPrisma.estimateRequest.update).toHaveBeenCalledWith({
        where: { id: requestId },
        data: {
          moveType: "OFFICE",
          moveDate: new Date("2024-12-26"),
          description: "수정된 이사",
        },
      });
      expect(result).toEqual(mockUpdatedRequest);
    });

    it("견적 요청 취소 테스트", async () => {
      const requestId = "request-id";
      const mockRequest = {
        fromAddressId: "from-address-id",
        toAddressId: "to-address-id",
      };
      const mockCancelledRequest = {
        id: requestId,
        status: "CANCELLED",
        deletedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          estimateRequest: {
            findUnique: jest.fn().mockResolvedValue(mockRequest),
            update: jest.fn().mockResolvedValue(mockCancelledRequest),
          },
          address: {
            update: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result =
        await estimateRequestRepository.cancelEstimateRequest(requestId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockCancelledRequest);
    });

    it("진행중인 요청 확인 테스트", async () => {
      const userId = "user-id";
      const mockRequest = {
        id: "request-id",
        customerId: userId,
        status: "PENDING",
      };

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(
        mockRequest as any
      );

      const result = await estimateRequestRepository.hasPendingRequest(userId);

      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          status: "PENDING",
          deletedAt: null,
        },
      });
      expect(result).toBe(true);
    });

    it("기사님 견적 확인 테스트", async () => {
      const userId = "user-id";
      const mockRequest = {
        id: "request-id",
      };
      const mockEstimate = {
        id: "estimate-id",
        estimateRequestId: "request-id",
      };

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(
        mockRequest as any
      );
      mockPrisma.estimate.findFirst.mockResolvedValue(mockEstimate as any);

      const result =
        await estimateRequestRepository.hasEstimateFromMover(userId);

      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          status: "PENDING",
          deletedAt: null,
        },
        select: { id: true },
      });
      expect(mockPrisma.estimate.findFirst).toHaveBeenCalledWith({
        where: {
          estimateRequestId: "request-id",
          deletedAt: null,
        },
      });
      expect(result).toBe(true);
    });

    it("사용자 타입 확인 테스트", async () => {
      const userId = "user-id";
      const mockUser = {
        userType: ["CUSTOMER"],
        isCustomer: true,
        isMover: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await estimateRequestRepository.checkUserType(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { userType: true, isCustomer: true, isMover: true },
      });
      expect(result).toEqual({ isCustomer: true, isMover: false });
    });

    it("주소 생성 테스트", async () => {
      const addressData = {
        zoneCode: "06123",
        city: "강남구",
        district: "테헤란로",
        region: "SEOUL",
        detail: "123",
      };
      const mockAddress = {
        id: "address-id",
      };

      mockPrisma.address.create.mockResolvedValue(mockAddress as any);

      const result =
        await estimateRequestRepository.findOrCreateAddress(addressData);

      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: {
          zoneCode: "06123",
          city: "강남구",
          district: "테헤란로",
          region: "SEOUL",
          detail: "123",
        },
      });
      expect(result).toEqual({ id: "address-id" });
    });
  });

  // 에러 케이스 테스트
  describe("에러 케이스 테스트", () => {
    it("견적 요청 취소 시 요청을 찾을 수 없는 경우", async () => {
      const requestId = "non-existent-id";

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          estimateRequest: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(
        estimateRequestRepository.cancelEstimateRequest(requestId)
      ).rejects.toThrow("견적 요청을 찾을 수 없습니다.");
    });

    it("사용자 타입 확인 시 사용자를 찾을 수 없는 경우", async () => {
      const userId = "non-existent-user";

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        estimateRequestRepository.checkUserType(userId)
      ).rejects.toThrow("사용자를 찾을 수 없습니다.");
    });

    it("기사님 견적 확인 시 요청이 없는 경우", async () => {
      const userId = "user-id";

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result =
        await estimateRequestRepository.hasEstimateFromMover(userId);

      expect(result).toBe(false);
    });

    it("진행중인 요청 확인 시 요청이 없는 경우", async () => {
      const userId = "user-id";

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.hasPendingRequest(userId);

      expect(result).toBe(false);
    });

    it("활성 견적 요청 조회 시 요청이 없는 경우", async () => {
      const userId = "user-id";

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result =
        await estimateRequestRepository.getActiveEstimateRequestByUserId(
          userId
        );

      expect(result).toBe(null);
    });

    it("주소 생성 시 detail이 null인 경우", async () => {
      const addressData = {
        zoneCode: "06123",
        city: "강남구",
        district: "테헤란로",
        region: "SEOUL",
        detail: null,
      };
      const mockAddress = {
        id: "address-id",
      };

      mockPrisma.address.create.mockResolvedValue(mockAddress as any);

      const result =
        await estimateRequestRepository.findOrCreateAddress(addressData);

      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: {
          zoneCode: "06123",
          city: "강남구",
          district: "테헤란로",
          region: "SEOUL",
          detail: null,
        },
      });
      expect(result).toEqual({ id: "address-id" });
    });

    it("주소 생성 시 detail이 빈 문자열인 경우", async () => {
      const addressData = {
        zoneCode: "06123",
        city: "강남구",
        district: "테헤란로",
        region: "SEOUL",
        detail: "",
      };
      const mockAddress = {
        id: "address-id",
      };

      mockPrisma.address.create.mockResolvedValue(mockAddress as any);

      const result =
        await estimateRequestRepository.findOrCreateAddress(addressData);

      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: {
          zoneCode: "06123",
          city: "강남구",
          district: "테헤란로",
          region: "SEOUL",
          detail: null,
        },
      });
      expect(result).toEqual({ id: "address-id" });
    });
  });
});
