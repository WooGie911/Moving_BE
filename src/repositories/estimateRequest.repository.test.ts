import estimateRequestRepository from "./estimateRequest.repository";
import { PrismaClient, RequestStatus, UserType, MoveType, RegionType } from "@prisma/client";

// Mock the prisma module
jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    estimateRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
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
  },
}));

// Mock dateUtils
jest.mock("../utils/dateUtils", () => ({
  getCurrentDateString: jest.fn().mockReturnValue("2024-12-25"),
}));

// Get the mocked prisma instance
const mockPrisma = require("../db/prisma/prisma").default;

describe("EstimateRequest Repository 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. 레포지토리 함수들이 존재하는지 확인
  it("1. 견적 요청 생성 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.createEstimateRequest).toBe("function");
  });

  it("2. 활성 견적 요청 조회 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.getActiveEstimateRequestByUserId).toBe("function");
  });

  it("3. 견적 요청 수정 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.updateEstimateRequest).toBe("function");
  });

  it("4. 견적 요청 취소 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.cancelEstimateRequest).toBe("function");
  });

  it("5. 진행중인 요청 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.hasPendingRequest).toBe("function");
  });

  it("6. 기사님 견적 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.hasEstimateFromMover).toBe("function");
  });

  it("7. 사용자 타입 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.checkUserType).toBe("function");
  });

  it("8. 주소 생성 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.findOrCreateAddress).toBe("function");
  });

  it("9. 견적 요청 ID로 조회 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.getEstimateRequestById).toBe("function");
  });

  it("10. 이사일 이전 활성 요청 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.hasActiveRequestBeforeMoveDate).toBe("function");
  });

  it("11. 고객 프로필 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.checkCustomerProfile).toBe("function");
  });

  it("12. 주소 소프트 삭제 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.softDeleteAddress).toBe("function");
  });

  it("13. 견적 요청 완료 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.completeEstimateRequest).toBe("function");
  });

  it("14. 액션용 견적 요청 상세 조회 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.getEstimateRequestDetailForAction).toBe("function");
  });

  it("15. 완료용 견적 요청 상세 조회 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.getEstimateRequestDetailForCompletion).toBe("function");
  });

  it("16. 견적 요청 주소 정보 조회 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.getEstimateRequestAddressInfo).toBe("function");
  });

  it("17. 이사일 알림용 견적 요청 조회 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.getEstimateRequestsForMoveDayReminders).toBe("function");
  });

  it("18. 리뷰 요청용 견적 요청 조회 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.getEstimateRequestsForReviewRequests).toBe("function");
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

      mockPrisma.estimateRequest.create.mockResolvedValue(mockCreatedRequest as any);

      const result = await estimateRequestRepository.createEstimateRequest(mockData, userId);

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

    it("getEstimateRequestById 테스트", async () => {
      const requestId = "request-id";
      const mockRequest = {
        id: requestId,
        customerId: "user-id",
        moveType: "HOME",
        moveDate: new Date("2024-12-25"),
        status: "PENDING",
      };

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(mockRequest as any);

      const result = await estimateRequestRepository.getEstimateRequestById(requestId);

      expect(mockPrisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: {
          id: requestId,
          deletedAt: null,
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockRequest);
    });

    it("updateEstimateRequest 모든 필드 업데이트 테스트", async () => {
      const requestId = "request-id";
      const updateData = {
        moveType: "OFFICE" as MoveType,
        moveDate: new Date("2024-12-26"),
        fromAddressId: "new-from-address-id",
        toAddressId: "new-to-address-id",
        description: "수정된 이사",
      };
      const mockUpdatedRequest = {
        id: requestId,
        ...updateData,
      };

      mockPrisma.estimateRequest.update.mockResolvedValue(mockUpdatedRequest as any);

      const result = await estimateRequestRepository.updateEstimateRequest(requestId, updateData);

      expect(mockPrisma.estimateRequest.update).toHaveBeenCalledWith({
        where: { id: requestId },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedRequest);
    });

    it("updateEstimateRequest 부분 업데이트 테스트", async () => {
      const requestId = "request-id";
      const updateData = {
        description: "부분 수정",
      };
      const mockUpdatedRequest = {
        id: requestId,
        description: "부분 수정",
      };

      mockPrisma.estimateRequest.update.mockResolvedValue(mockUpdatedRequest as any);

      const result = await estimateRequestRepository.updateEstimateRequest(requestId, updateData);

      expect(mockPrisma.estimateRequest.update).toHaveBeenCalledWith({
        where: { id: requestId },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedRequest);
    });

    it("hasActiveRequestBeforeMoveDate 테스트", async () => {
      const userId = "user-id";
      const mockRequest = {
        id: "request-id",
        customerId: userId,
        status: "PENDING",
      };

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest as any);

      const result = await estimateRequestRepository.hasActiveRequestBeforeMoveDate(userId);

      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          moveDate: {
            gte: expect.any(Date),
          },
          status: {
            in: ["PENDING", "APPROVED"],
          },
          deletedAt: null,
        },
      });
      expect(result).toBe(true);
    });

    it("checkCustomerProfile 테스트", async () => {
      const userId = "user-id";
      const mockUser = {
        isCustomer: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await estimateRequestRepository.checkCustomerProfile(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { isCustomer: true },
      });
      expect(result).toBe(true);
    });

    it("softDeleteAddress 테스트", async () => {
      const addressId = "address-id";

      mockPrisma.address.update.mockResolvedValue({} as any);

      await estimateRequestRepository.softDeleteAddress(addressId);

      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: { deletedAt: new Date("2024-12-25") },
      });
    });

    it("completeEstimateRequest 테스트", async () => {
      const requestId = "request-id";
      const mockCompletedRequest = {
        id: requestId,
        status: "COMPLETED",
      };

      mockPrisma.estimateRequest.update.mockResolvedValue(mockCompletedRequest as any);

      const result = await estimateRequestRepository.completeEstimateRequest(requestId);

      expect(mockPrisma.estimateRequest.update).toHaveBeenCalledWith({
        where: { id: requestId },
        data: { status: "COMPLETED" },
      });
      expect(result).toEqual(mockCompletedRequest);
    });

    it("getEstimateRequestDetailForAction 테스트", async () => {
      const requestId = "request-id";
      const mockRequest = {
        id: requestId,
        customerId: "user-id",
        moveType: "HOME",
        moveDate: new Date("2024-12-25"),
        customer: {
          id: "user-id",
          name: "테스트 고객",
        },
      };

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(mockRequest as any);

      const result = await estimateRequestRepository.getEstimateRequestDetailForAction(requestId);

      expect(mockPrisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: { id: requestId },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          customer: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      });
      expect(result).toEqual(mockRequest);
    });

    it("getEstimateRequestDetailForCompletion 테스트", async () => {
      const requestId = "request-id";
      const mockRequest = {
        id: requestId,
        customerId: "user-id",
        moveType: "HOME",
        moveDate: new Date("2024-12-25"),
        customer: {
          id: "user-id",
          name: "테스트 고객",
        },
        estimates: [
          {
            id: "estimate-id",
            moverId: "mover-id",
            mover: {
              id: "mover-id",
              name: "테스트 기사",
            },
          },
        ],
      };

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(mockRequest as any);

      const result = await estimateRequestRepository.getEstimateRequestDetailForCompletion(requestId);

      expect(mockPrisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: { id: requestId },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          customer: {
            select: {
              id: true,
              name: true,
              nickname: true,
            },
          },
          estimates: {
            where: {
              status: "ACCEPTED",
              isDesignated: true,
            },
            select: {
              id: true,
              moverId: true,
              mover: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockRequest);
    });

    it("getEstimateRequestAddressInfo 테스트", async () => {
      const requestId = "request-id";
      const mockAddress = {
        region: "SEOUL",
        district: "강남구",
      };

      mockPrisma.estimateRequest.findUnique.mockResolvedValue({
        fromAddress: mockAddress,
      } as any);

      const result = await estimateRequestRepository.getEstimateRequestAddressInfo(requestId);

      expect(mockPrisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: { id: requestId },
        select: {
          fromAddress: {
            select: {
              region: true,
              district: true,
            },
          },
        },
      });
      expect(result).toEqual(mockAddress);
    });

    it("getEstimateRequestsForMoveDayReminders 테스트", async () => {
      const moveDate = new Date("2024-12-25");
      const mockRequests = [
        {
          id: "request-id-1",
          customerId: "user-id-1",
          moveType: "HOME",
          moveDate: moveDate,
          estimates: [
            {
              id: "estimate-id-1",
              moverId: "mover-id-1",
              mover: {
                id: "mover-id-1",
                name: "기사1",
              },
            },
          ],
        },
      ];

      mockPrisma.estimateRequest.findMany.mockResolvedValue(mockRequests as any);

      const result = await estimateRequestRepository.getEstimateRequestsForMoveDayReminders(moveDate);

      expect(mockPrisma.estimateRequest.findMany).toHaveBeenCalledWith({
        where: {
          moveDate: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
          status: "COMPLETED",
          estimates: {
            some: {
              status: "ACCEPTED",
              isDesignated: true,
            },
          },
        },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          estimates: {
            where: {
              status: "ACCEPTED",
              isDesignated: true,
            },
            select: {
              id: true,
              moverId: true,
              mover: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockRequests);
    });

    it("getEstimateRequestsForReviewRequests 테스트", async () => {
      const mockRequests = [
        {
          id: "request-id-1",
          customerId: "user-id-1",
          moveType: "HOME",
          moveDate: new Date("2024-12-20"),
          estimates: [
            {
              id: "estimate-id-1",
              moverId: "mover-id-1",
              mover: {
                id: "mover-id-1",
                name: "기사1",
                nickname: "별명1",
              },
            },
          ],
        },
      ];

      mockPrisma.estimateRequest.findMany.mockResolvedValue(mockRequests as any);

      const result = await estimateRequestRepository.getEstimateRequestsForReviewRequests();

      expect(mockPrisma.estimateRequest.findMany).toHaveBeenCalledWith({
        where: {
          moveDate: {
            lt: expect.any(Date),
          },
          status: "COMPLETED",
          review: null,
          estimates: {
            some: {
              status: "ACCEPTED",
              isDesignated: true,
            },
          },
        },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          estimates: {
            where: {
              status: "ACCEPTED",
              isDesignated: true,
            },
            select: {
              id: true,
              moverId: true,
              mover: {
                select: {
                  id: true,
                  name: true,
                  nickname: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockRequests);
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

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest as any);

      const result = await estimateRequestRepository.getActiveEstimateRequestByUserId(userId);

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

      mockPrisma.estimateRequest.update.mockResolvedValue(mockUpdatedRequest as any);

      const result = await estimateRequestRepository.updateEstimateRequest(requestId, updateData);

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

      const result = await estimateRequestRepository.cancelEstimateRequest(requestId);

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

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest as any);

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

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest as any);
      mockPrisma.estimate.findFirst.mockResolvedValue(mockEstimate as any);

      const result = await estimateRequestRepository.hasEstimateFromMover(userId);

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
          status: "PROPOSED",
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

      const result = await estimateRequestRepository.findOrCreateAddress(addressData);

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

      await expect(estimateRequestRepository.cancelEstimateRequest(requestId)).rejects.toThrow(
        "견적 요청을 찾을 수 없습니다.",
      );
    });

    it("사용자 타입 확인 시 사용자를 찾을 수 없는 경우", async () => {
      const userId = "non-existent-user";

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(estimateRequestRepository.checkUserType(userId)).rejects.toThrow("사용자를 찾을 수 없습니다.");
    });

    it("기사님 견적 확인 시 요청이 없는 경우", async () => {
      const userId = "user-id";

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.hasEstimateFromMover(userId);

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

      const result = await estimateRequestRepository.getActiveEstimateRequestByUserId(userId);

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

      const result = await estimateRequestRepository.findOrCreateAddress(addressData);

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

      const result = await estimateRequestRepository.findOrCreateAddress(addressData);

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

    it("checkCustomerProfile 에러 케이스", async () => {
      const userId = "non-existent-user";

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(estimateRequestRepository.checkCustomerProfile(userId)).rejects.toThrow(
        "사용자를 찾을 수 없습니다.",
      );
    });

    it("hasActiveRequestBeforeMoveDate false 케이스", async () => {
      const userId = "user-id";

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      const result = await estimateRequestRepository.hasActiveRequestBeforeMoveDate(userId);

      expect(result).toBe(false);
    });

    it("getEstimateRequestById null 케이스", async () => {
      const requestId = "non-existent-id";

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(null);

      const result = await estimateRequestRepository.getEstimateRequestById(requestId);

      expect(result).toBe(null);
    });

    it("활성 견적 요청 조회 시 주소가 삭제된 경우", async () => {
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
          deletedAt: new Date(), // 삭제된 주소
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

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockRequest as any);

      const result = await estimateRequestRepository.getActiveEstimateRequestByUserId(userId);

      expect(result).toBeDefined();
      expect((result as any).fromAddress).toBeUndefined();
      expect((result as any).toAddress).toBeDefined();
    });

    it("getEstimateRequestDetailForAction null 케이스", async () => {
      const requestId = "non-existent-id";

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(null);

      const result = await estimateRequestRepository.getEstimateRequestDetailForAction(requestId);

      expect(result).toBeNull();
    });

    it("getEstimateRequestDetailForCompletion null 케이스", async () => {
      const requestId = "non-existent-id";

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(null);

      const result = await estimateRequestRepository.getEstimateRequestDetailForCompletion(requestId);

      expect(result).toBeNull();
    });

    it("getEstimateRequestAddressInfo null 케이스", async () => {
      const requestId = "non-existent-id";

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(null);

      const result = await estimateRequestRepository.getEstimateRequestAddressInfo(requestId);

      expect(result).toBeUndefined();
    });

    it("getEstimateRequestsForMoveDayReminders 빈 배열 케이스", async () => {
      const moveDate = new Date("2024-12-25");

      mockPrisma.estimateRequest.findMany.mockResolvedValue([]);

      const result = await estimateRequestRepository.getEstimateRequestsForMoveDayReminders(moveDate);

      expect(result).toEqual([]);
    });

    it("getEstimateRequestsForReviewRequests 빈 배열 케이스", async () => {
      mockPrisma.estimateRequest.findMany.mockResolvedValue([]);

      const result = await estimateRequestRepository.getEstimateRequestsForReviewRequests();

      expect(result).toEqual([]);
    });

    it("updateEstimateRequest 에러 케이스", async () => {
      const requestId = "non-existent-id";
      const updateData = { description: "수정" };

      mockPrisma.estimateRequest.update.mockRejectedValue(new Error("업데이트 실패"));

      await expect(estimateRequestRepository.updateEstimateRequest(requestId, updateData)).rejects.toThrow(
        "업데이트 실패",
      );
    });

    it("completeEstimateRequest 에러 케이스", async () => {
      const requestId = "non-existent-id";

      mockPrisma.estimateRequest.update.mockRejectedValue(new Error("완료 처리 실패"));

      await expect(estimateRequestRepository.completeEstimateRequest(requestId)).rejects.toThrow("완료 처리 실패");
    });

    it("softDeleteAddress 에러 케이스", async () => {
      const addressId = "non-existent-id";

      mockPrisma.address.update.mockRejectedValue(new Error("주소 삭제 실패"));

      await expect(estimateRequestRepository.softDeleteAddress(addressId)).rejects.toThrow("주소 삭제 실패");
    });
  });
});
