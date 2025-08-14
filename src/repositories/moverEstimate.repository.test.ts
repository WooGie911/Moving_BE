import moverEstimateRepository from "./moverEstimate.repository";
import { RepositoryQueryError } from "../types/errors.types";
import { EstimateStatus, RequestStatus } from "@prisma/client";

// PrismaClient 모킹 - 타입 안전성 확보
jest.mock("@prisma/client", () => {
  const mockEstimateRequest = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };

  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockEstimate = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };

  const mockDesignatedMover = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      estimateRequest: mockEstimateRequest,
      user: mockUser,
      estimate: mockEstimate,
      designatedMover: mockDesignatedMover,
      $use: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
    NotificationType: {
      WELCOME: "WELCOME",
      ESTIMATE_REQUEST_ARRIVED: "ESTIMATE_REQUEST_ARRIVED",
      ESTIMATE_ARRIVED: "ESTIMATE_ARRIVED",
      ESTIMATE_STATUS_UPDATED: "ESTIMATE_STATUS_UPDATED",
      DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED:
        "DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED",
      DESIGNATED_ESTIMATE_STATUS_UPDATED: "DESIGNATED_ESTIMATE_STATUS_UPDATED",
      REVIEW_EVENT: "REVIEW_EVENT",
      FAVORITE_EVENT: "FAVORITE_EVENT",
      MOVE_DAY_REMINDER: "MOVE_DAY_REMINDER",
    },
    ActionType: {
      WELCOME: "WELCOME",
      ESTIMATE_REQUEST_CREATE: "ESTIMATE_REQUEST_CREATE",
      ESTIMATE_SUBMITTED: "ESTIMATE_SUBMITTED",
      ESTIMATE_ACCEPTED: "ESTIMATE_ACCEPTED",
      ESTIMATE_REJECTED: "ESTIMATE_REJECTED",
      DESIGNATED_ESTIMATE_REQUEST_SUBMITTED:
        "DESIGNATED_ESTIMATE_REQUEST_SUBMITTED",
      DESIGNATED_ESTIMATE_REQUEST_REJECTED:
        "DESIGNATED_ESTIMATE_REQUEST_REJECTED",
    },
    EstimateStatus: {
      PROPOSED: "PROPOSED",
      ACCEPTED: "ACCEPTED",
      REJECTED: "REJECTED",
      AUTO_REJECTED: "AUTO_REJECTED",
    },
    RequestStatus: {
      PENDING: "PENDING",
      APPROVED: "APPROVED",
      COMPLETED: "COMPLETED",
      REJECTED: "REJECTED",
      CANCELLED: "CANCELLED",
      EXPIRED: "EXPIRED",
    },
  };
});

// 모킹된 객체들을 가져오기 - 타입 안전성 확보
const { PrismaClient } = require("@prisma/client");
const mockPrisma = new PrismaClient();

// 타입 안전한 모킹 객체 정의
interface MockEstimateRequest {
  findUnique: jest.Mock;
  findMany: jest.Mock;
}

interface MockUser {
  findUnique: jest.Mock;
}

interface MockEstimate {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  findMany: jest.Mock;
}

interface MockDesignatedMover {
  findFirst: jest.Mock;
  findMany: jest.Mock;
}

const mockEstimateRequest = mockPrisma.estimateRequest as MockEstimateRequest;
const mockUser = mockPrisma.user as MockUser;
const mockEstimate = mockPrisma.estimate as MockEstimate;
const mockDesignatedMover = mockPrisma.designatedMover as MockDesignatedMover;

describe("이사업체 견적 레포지토리", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("견적 요청 ID로 조회", () => {
    it("성공적으로 견적 요청을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockEstimateRequestData = {
        status: "PENDING" as RequestStatus,
        moveDate: new Date("2025-08-10"),
      };

      mockEstimateRequest.findUnique.mockResolvedValue(mockEstimateRequestData);

      // Act
      const result =
        await moverEstimateRepository.findEstimateRequestById(
          estimateRequestId
        );

      // Assert
      expect(result).toEqual(mockEstimateRequestData);
      expect(mockEstimateRequest.findUnique).toHaveBeenCalledWith({
        where: { id: estimateRequestId },
        select: { status: true, moveDate: true },
      });
    });

    it("빈 문자열로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findEstimateRequestById("")
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("null로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findEstimateRequestById(null as any)
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("숫자 타입으로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findEstimateRequestById(123 as any)
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("견적 요청이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "nonexistent";

      mockEstimateRequest.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await moverEstimateRepository.findEstimateRequestById(
          estimateRequestId
        );

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockError = new Error("Database error");

      mockEstimateRequest.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.findEstimateRequestById(estimateRequestId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("기존 견적 조회", () => {
    it("성공적으로 기존 견적을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const mockEstimateData = {
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        price: 500000,
        status: "PROPOSED" as EstimateStatus,
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateData);

      // Act
      const result = await moverEstimateRepository.findExistingEstimate(
        estimateRequestId,
        moverId
      );

      // Assert
      expect(result).toEqual(mockEstimateData);
      expect(mockEstimate.findUnique).toHaveBeenCalledWith({
        where: {
          estimateRequestId_moverId: {
            estimateRequestId: estimateRequestId,
            moverId: moverId,
          },
        },
      });
    });

    it("빈 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findExistingEstimate("", "mover123")
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("빈 기사 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findExistingEstimate("estimateRequest123", "")
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("기존 견적이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";

      mockEstimate.findUnique.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.findExistingEstimate(
        estimateRequestId,
        moverId
      );

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockEstimate.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.findExistingEstimate(estimateRequestId, moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("지정 견적 요청 조회", () => {
    it("성공적으로 지정 견적 요청을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const mockDesignatedRequestData = {
        id: "designated123",
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        deletedAt: null,
      };

      mockDesignatedMover.findFirst.mockResolvedValue(
        mockDesignatedRequestData
      );

      // Act
      const result = await moverEstimateRepository.findDesignatedRequest(
        estimateRequestId,
        moverId
      );

      // Assert
      expect(result).toEqual(mockDesignatedRequestData);
      expect(mockDesignatedMover.findFirst).toHaveBeenCalledWith({
        where: {
          estimateRequestId: estimateRequestId,
          moverId: moverId,
          deletedAt: null,
        },
      });
    });

    it("지정 견적 요청이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";

      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.findDesignatedRequest(
        estimateRequestId,
        moverId
      );

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const mockError = new Error("Database connection failed");

      // Mock to reject with error
      mockDesignatedMover.findFirst.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.findDesignatedRequest(
          estimateRequestId,
          moverId
        )
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockDesignatedMover.findFirst).toHaveBeenCalled();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다 - 직접 에러 시뮬레이션", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";

      // Mock to throw an error directly
      mockDesignatedMover.findFirst.mockImplementation(() => {
        throw new Error("Direct database error");
      });

      // Act & Assert
      await expect(
        moverEstimateRepository.findDesignatedRequest(
          estimateRequestId,
          moverId
        )
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockDesignatedMover.findFirst).toHaveBeenCalled();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다 - Promise.reject", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const mockError = new Error("Database connection failed");

      // Mock to reject with error using Promise.reject
      mockDesignatedMover.findFirst.mockImplementation(() => {
        return Promise.reject(mockError);
      });

      // Act & Assert
      await expect(
        moverEstimateRepository.findDesignatedRequest(
          estimateRequestId,
          moverId
        )
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockDesignatedMover.findFirst).toHaveBeenCalled();
    });
  });

  describe("기존 견적 개수 조회", () => {
    it("성공적으로 기존 견적 개수를 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockEstimates = [
        {
          id: "estimate1",
          isDesignated: false,
        },
        {
          id: "estimate2",
          isDesignated: true,
        },
      ];

      mockEstimate.findMany.mockResolvedValue(mockEstimates);

      // Act
      const result =
        await moverEstimateRepository.countExistingEstimates(estimateRequestId);

      // Assert
      expect(result).toEqual(mockEstimates);
      expect(mockEstimate.findMany).toHaveBeenCalledWith({
        where: {
          estimateRequestId: estimateRequestId,
          status: { in: ["PROPOSED", "ACCEPTED"] },
          deletedAt: null,
        },
        select: {
          id: true,
          isDesignated: true,
        },
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockError = new Error("Database connection failed");

      // Mock to reject with error
      mockEstimate.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.countExistingEstimates(estimateRequestId)
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockEstimate.findMany).toHaveBeenCalled();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다 - 직접 에러 시뮬레이션", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";

      // Mock to throw an error directly
      mockEstimate.findMany.mockImplementation(() => {
        throw new Error("Direct database error");
      });

      // Act & Assert
      await expect(
        moverEstimateRepository.countExistingEstimates(estimateRequestId)
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockEstimate.findMany).toHaveBeenCalled();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다 - Promise.reject", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockError = new Error("Database connection failed");

      // Mock to reject with error using Promise.reject
      mockEstimate.findMany.mockImplementation(() => {
        return Promise.reject(mockError);
      });

      // Act & Assert
      await expect(
        moverEstimateRepository.countExistingEstimates(estimateRequestId)
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockEstimate.findMany).toHaveBeenCalled();
    });
  });

  describe("견적 생성", () => {
    it("성공적으로 견적을 생성한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const price = 500000;
      const comment = "합리적인 가격";
      const status = "PROPOSED";
      const isDesignated = false;

      const mockCreatedEstimate = {
        id: "estimate123",
        estimateRequestId: estimateRequestId,
        moverId: moverId,
        price: price,
        comment: comment,
        status: status,
        isDesignated: isDesignated,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mover: {
          id: "mover123",
          name: "이사업체A",
          moverImage: null,
          nickname: null,
          shortIntro: null,
          detailIntro: null,
          career: null,
          workedCount: null,
          averageRating: null,
          totalReviewCount: null,
          serviceTypes: [],
        },
        estimateRequest: {
          id: estimateRequestId,
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      };

      mockEstimate.create.mockResolvedValue(mockCreatedEstimate);

      // Act
      const result = await moverEstimateRepository.createEstimate(
        estimateRequestId,
        moverId,
        price,
        comment,
        status,
        isDesignated
      );

      // Assert
      expect(result).toEqual(mockCreatedEstimate);
      expect(mockEstimate.create).toHaveBeenCalledWith({
        data: {
          estimateRequestId: estimateRequestId,
          moverId: moverId,
          price: price,
          comment: comment,
          status: status,
          isDesignated: isDesignated,
        },
        select: expect.any(Object), // estimateSelectOptions는 복잡하므로 any로 처리
      });
    });

    it("빈 견적 요청 ID로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "",
          "mover123",
          500000,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("빈 기사 ID로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "",
          500000,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("음수 가격으로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          -1000,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("빈 코멘트로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("공백만 있는 코멘트로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "   ",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("유효하지 않은 상태로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "합리적인 가격",
          "INVALID_STATUS" as any,
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const price = 500000;
      const comment = "합리적인 가격";
      const status = "PROPOSED";
      const isDesignated = false;
      const mockError = new Error("Database connection failed");

      // Mock to reject with error
      mockEstimate.create.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          estimateRequestId,
          moverId,
          price,
          comment,
          status,
          isDesignated
        )
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockEstimate.create).toHaveBeenCalled();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다 - 직접 에러 시뮬레이션", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const price = 500000;
      const comment = "합리적인 가격";
      const status = "PROPOSED";
      const isDesignated = false;

      // Mock to throw an error directly
      mockEstimate.create.mockImplementation(() => {
        throw new Error("Direct database error");
      });

      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          estimateRequestId,
          moverId,
          price,
          comment,
          status,
          isDesignated
        )
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockEstimate.create).toHaveBeenCalled();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다 - Promise.reject", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const price = 500000;
      const comment = "합리적인 가격";
      const status = "PROPOSED";
      const isDesignated = false;
      const mockError = new Error("Database connection failed");

      // Mock to reject with error using Promise.reject
      mockEstimate.create.mockImplementation(() => {
        return Promise.reject(mockError);
      });

      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          estimateRequestId,
          moverId,
          price,
          comment,
          status,
          isDesignated
        )
      ).rejects.toThrow(RepositoryQueryError);

      // Verify that the mock was called
      expect(mockEstimate.create).toHaveBeenCalled();
    });
  });

  describe("사용자 서비스 지역 조회", () => {
    it("성공적으로 사용자 서비스 지역을 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockUserData = {
        currentAreas: ["SEOUL", "GYEONGGI"],
      };

      mockUser.findUnique.mockResolvedValue(mockUserData);

      // Act
      const result =
        await moverEstimateRepository.findUserServiceAreas(moverId);

      // Assert
      expect(result).toEqual(["SEOUL", "GYEONGGI"]);
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { id: moverId },
        select: { currentAreas: true },
      });
    });

    it("사용자가 없을 때 빈 배열을 반환한다", async () => {
      // Arrange
      const moverId = "nonexistent";

      mockUser.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await moverEstimateRepository.findUserServiceAreas(moverId);

      // Assert
      expect(result).toEqual([]);
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockUser.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.findUserServiceAreas(moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("지역 견적 요청 조회", () => {
    it("성공적으로 서비스 가능 지역 견적을 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const sortBy = "moveDate";
      const customerName = "고객A";
      const movingType = "HOME";
      const currentAreas = ["SEOUL", "GYEONGGI"];

      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      ];

      mockEstimateRequest.findMany.mockResolvedValue(mockEstimateRequests);
      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.getRegionEstimateRequest(
        moverId,
        sortBy,
        customerName,
        movingType,
        currentAreas
      );

      // Assert
      expect(result).toEqual(
        mockEstimateRequests.map((request) => ({
          ...request,
          isDesignated: false,
        }))
      );
      expect(mockEstimateRequest.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: "PENDING",
          moveDate: {
            gt: expect.any(Date),
          },
          customerId: {
            not: moverId,
          },
          OR: currentAreas.map((region: string) => ({
            fromAddress: { region },
          })),
          customer: {
            name: {
              contains: customerName,
            },
          },
          moveType: movingType,
        }),
        select: expect.any(Object), // estimateRequestSelectOptions는 복잡하므로 any로 처리
        orderBy: { moveDate: "asc" },
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockEstimateRequest.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.getRegionEstimateRequest(moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("지정 견적 요청 조회", () => {
    it("성공적으로 지정 견적을 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const sortBy = "moveDate";
      const customerName = "고객A";
      const movingType = "HOME";

      const mockDesignatedRequests = [
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockDesignatedMover.findMany.mockResolvedValue(mockDesignatedRequests);

      // Act
      const result = await moverEstimateRepository.getDesignatedEstimateRequest(
        moverId,
        sortBy,
        customerName,
        movingType
      );

      // Assert
      expect(result).toEqual([
        {
          ...mockDesignatedRequests[0].estimateRequest,
          isDesignated: true,
        },
      ]);
      expect(mockDesignatedMover.findMany).toHaveBeenCalledWith({
        where: {
          moverId: moverId,
          deletedAt: null,
          estimateRequest: {
            customer: {
              name: {
                contains: customerName,
              },
            },
            moveType: movingType,
          },
        },
        select: {
          estimateRequest: expect.any(Object), // estimateRequestSelectOptions는 복잡하므로 any로 처리
        },
        orderBy: { estimateRequest: { moveDate: "asc" } },
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockDesignatedMover.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.getDesignatedEstimateRequest(moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 요청 상세 조회", () => {
    it("성공적으로 견적 요청 상세를 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockEstimateRequestData = {
        id: "estimateRequest123",
        customerId: "customer123",
        moveType: "HOME",
        moveDate: new Date("2025-08-10"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: "customer123",
          name: "고객A",
          currentArea: "SEOUL",
          customerImage: null,
          nickname: null,
        },
        fromAddress: {
          id: "addr1",
          zoneCode: "12345",
          city: "서울시",
          district: "강남구",
          detail: "123-456",
          region: "SEOUL",
        },
        toAddress: {
          id: "addr2",
          zoneCode: "12346",
          city: "경기도",
          district: "성남시",
          detail: "789-012",
          region: "GYEONGGI",
        },
        estimates: [],
      };

      mockEstimateRequest.findUnique.mockResolvedValue(mockEstimateRequestData);

      // Act
      const result =
        await moverEstimateRepository.getEstimateRequestById(estimateRequestId);

      // Assert
      expect(result).toEqual(mockEstimateRequestData);
      expect(mockEstimateRequest.findUnique).toHaveBeenCalledWith({
        where: {
          id: estimateRequestId,
        },
        select: expect.any(Object), // estimateRequestSelectOptions는 복잡하므로 any로 처리
      });
    });

    it("견적 요청이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "nonexistent";

      mockEstimateRequest.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await moverEstimateRepository.getEstimateRequestById(estimateRequestId);

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockError = new Error("Database error");

      mockEstimateRequest.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateRequestById(estimateRequestId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("내 견적서 조회", () => {
    it("성공적으로 내가 보낸 견적서들을 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockEstimates = [
        {
          id: "estimate1",
          moverId: "mover123",
          estimateRequestId: "estimateRequest1",
          price: 500000,
          comment: "합리적인 가격",
          status: "PROPOSED" as EstimateStatus,
          rejectReason: null,
          isDesignated: false,
          workingHours: null,
          includesPackaging: false,
          insuranceAmount: null,
          validUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          mover: {
            id: "mover123",
            name: "이사업체A",
            moverImage: null,
            nickname: null,
            shortIntro: null,
            detailIntro: null,
            career: null,
            workedCount: null,
            averageRating: null,
            totalReviewCount: null,
            serviceTypes: [],
          },
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockEstimate.findMany.mockResolvedValue(mockEstimates);
      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.getMyEstimate(moverId);

      // Assert
      expect(result).toEqual(mockEstimates);
      expect(mockEstimate.findMany).toHaveBeenCalledWith({
        where: {
          moverId: moverId,
          status: {
            in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"],
          },
          estimateRequest: {
            customerId: {
              not: moverId,
            },
          },
        },
        select: expect.any(Object), // estimateSelectOptions는 복잡하므로 any로 처리
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockEstimate.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.getMyEstimate(moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("내 반려 견적 조회", () => {
    it("성공적으로 내가 반려한 견적들을 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockRejectedEstimates = [
        {
          id: "estimate1",
          moverId: "mover123",
          estimateRequestId: "estimateRequest1",
          price: 500000,
          comment: "합리적인 가격",
          status: "REJECTED" as EstimateStatus,
          rejectReason: "가격이 너무 높음",
          isDesignated: false,
          workingHours: null,
          includesPackaging: false,
          insuranceAmount: null,
          validUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          mover: {
            id: "mover123",
            name: "이사업체A",
            moverImage: null,
            nickname: null,
            shortIntro: null,
            detailIntro: null,
            career: null,
            workedCount: null,
            averageRating: null,
            totalReviewCount: null,
            serviceTypes: [],
          },
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockEstimate.findMany.mockResolvedValue(mockRejectedEstimates);
      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result =
        await moverEstimateRepository.getMyRejectedEstimates(moverId);

      // Assert
      expect(result).toEqual(mockRejectedEstimates);
      expect(mockEstimate.findMany).toHaveBeenCalledWith({
        where: {
          moverId: moverId,
          status: "REJECTED",
        },
        select: expect.any(Object), // estimateSelectOptions는 복잡하므로 any로 처리
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockEstimate.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.getMyRejectedEstimates(moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 소유권 확인", () => {
    it("견적 소유권이 있을 때 true를 반환한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const moverId = "mover123";
      const mockEstimateData = {
        id: "estimate123",
        moverId: "mover123",
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateData);

      // Act
      const result = await moverEstimateRepository.checkEstimateOwnership(
        estimateId,
        moverId
      );

      // Assert
      expect(result).toBe(true);
      expect(mockEstimate.findUnique).toHaveBeenCalledWith({
        where: {
          id: estimateId,
          moverId: moverId,
        },
      });
    });

    it("견적 소유권이 없을 때 false를 반환한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const moverId = "mover123";

      mockEstimate.findUnique.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.checkEstimateOwnership(
        estimateId,
        moverId
      );

      // Assert
      expect(result).toBe(false);
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockEstimate.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.checkEstimateOwnership(estimateId, moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 상태 업데이트", () => {
    it("성공적으로 견적 상태를 업데이트한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "ACCEPTED";
      const mockUpdatedEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격",
        status: status,
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mover: {
          id: "mover123",
          name: "이사업체A",
          moverImage: null,
          nickname: null,
          shortIntro: null,
          detailIntro: null,
          career: null,
          workedCount: null,
          averageRating: null,
          totalReviewCount: null,
          serviceTypes: [],
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      };

      mockEstimate.update.mockResolvedValue(mockUpdatedEstimate);

      // Act
      const result = await moverEstimateRepository.updateEstimateStatus(
        estimateId,
        status
      );

      // Assert
      expect(result).toEqual(mockUpdatedEstimate);
      expect(mockEstimate.update).toHaveBeenCalledWith({
        where: {
          id: estimateId,
        },
        data: {
          status: status,
        },
        select: expect.any(Object), // estimateSelectOptions는 복잡하므로 any로 처리
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "ACCEPTED";
      const mockError = new Error("Database error");

      mockEstimate.update.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.updateEstimateStatus(estimateId, status)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적서 업데이트", () => {
    it("성공적으로 견적서를 업데이트한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const price = 600000;
      const comment = "업데이트된 견적";
      const mockUpdatedEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: price,
        comment: comment,
        status: "PROPOSED" as EstimateStatus,
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mover: {
          id: "mover123",
          name: "이사업체A",
          moverImage: null,
          nickname: null,
          shortIntro: null,
          detailIntro: null,
          career: null,
          workedCount: null,
          averageRating: null,
          totalReviewCount: null,
          serviceTypes: [],
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      };

      mockEstimate.update.mockResolvedValue(mockUpdatedEstimate);

      // Act
      const result = await moverEstimateRepository.updateEstimatePrice(
        estimateId,
        price,
        comment
      );

      // Assert
      expect(result).toEqual(mockUpdatedEstimate);
      expect(mockEstimate.update).toHaveBeenCalledWith({
        where: {
          id: estimateId,
        },
        data: {
          price: price,
          comment: comment,
        },
        select: expect.any(Object), // estimateSelectOptions는 복잡하므로 any로 처리
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const price = 600000;
      const comment = "업데이트된 견적";
      const mockError = new Error("Database error");

      mockEstimate.update.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.updateEstimatePrice(estimateId, price, comment)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 ID로 견적 조회", () => {
    it("성공적으로 견적을 조회한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const mockEstimateData = {
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        price: 500000,
        comment: "합리적인 가격",
        status: "PROPOSED" as EstimateStatus,
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateData);

      // Act
      const result = await moverEstimateRepository.getEstimateById(estimateId);

      // Assert
      expect(result).toEqual(mockEstimateData);
      expect(mockEstimate.findUnique).toHaveBeenCalledWith({
        where: { id: estimateId },
      });
    });

    it("견적이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateId = "estimate123";

      mockEstimate.findUnique.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.getEstimateById(estimateId);

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const mockError = new Error("Database error");

      mockEstimate.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateById(estimateId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 상세 정보 조회 (액션 메타데이터용)", () => {
    it("성공적으로 견적 상세 정보를 조회한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const mockEstimateDetail = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        status: "PROPOSED" as EstimateStatus,
        isDesignated: false,
        mover: {
          id: "mover123",
          name: "이사업체A",
          nickname: "이사왕",
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          customer: {
            id: "customer123",
            name: "고객A",
          },
        },
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateDetail);

      // Act
      const result =
        await moverEstimateRepository.getEstimateDetailForAction(estimateId);

      // Assert
      expect(result).toEqual(mockEstimateDetail);
      expect(mockEstimate.findUnique).toHaveBeenCalledWith({
        where: { id: estimateId },
        select: {
          id: true,
          moverId: true,
          estimateRequestId: true,
          status: true,
          isDesignated: true,
          mover: {
            select: {
              id: true,
              name: true,
              nickname: true,
            },
          },
          estimateRequest: {
            select: {
              id: true,
              customerId: true,
              moveType: true,
              moveDate: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    it("견적 상세 정보가 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateId = "nonexistent";

      mockEstimate.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await moverEstimateRepository.getEstimateDetailForAction(estimateId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("견적 요청 상세 조회 - 추가 검증 케이스", () => {
    it("빈 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateRequestById("")
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("null 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateRequestById(null as any)
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("숫자 타입 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateRequestById(123 as any)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적서 업데이트 - 추가 검증 케이스", () => {
    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const price = 600000;
      const comment = "업데이트된 견적";
      const mockError = new Error("Database error");

      mockEstimate.update.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.updateEstimatePrice(estimateId, price, comment)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 상태 업데이트 - 추가 검증 케이스", () => {
    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "ACCEPTED";
      const mockError = new Error("Database error");

      mockEstimate.update.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.updateEstimateStatus(estimateId, status)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 ID로 견적 조회 - 추가 검증 케이스", () => {
    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const mockError = new Error("Database error");

      mockEstimate.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateById(estimateId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("지역 견적 요청 조회 - 추가 케이스", () => {
    it("currentAreas가 빈 배열일 때 OR 조건을 추가하지 않는다", async () => {
      // Arrange
      const moverId = "mover123";
      const currentAreas: string[] = [];

      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      ];

      mockEstimateRequest.findMany.mockResolvedValue(mockEstimateRequests);
      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.getRegionEstimateRequest(
        moverId,
        "moveDate",
        undefined,
        undefined,
        currentAreas
      );

      // Assert
      expect(result).toEqual(
        mockEstimateRequests.map((request) => ({
          ...request,
          isDesignated: false,
        }))
      );
      expect(mockEstimateRequest.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: "PENDING",
          moveDate: {
            gt: expect.any(Date),
          },
          customerId: {
            not: moverId,
          },
          estimates: {
            none: {
              moverId: moverId,
              status: { in: ["PROPOSED", "REJECTED"] },
            },
          },
        }),
        select: expect.any(Object),
        orderBy: { moveDate: "asc" },
      });
    });

    it("sortBy가 undefined일 때 기본값 createdAt desc를 사용한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      ];

      mockEstimateRequest.findMany.mockResolvedValue(mockEstimateRequests);
      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result =
        await moverEstimateRepository.getRegionEstimateRequest(moverId);

      // Assert
      expect(result).toEqual(
        mockEstimateRequests.map((request) => ({
          ...request,
          isDesignated: false,
        }))
      );
      expect(mockEstimateRequest.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("지정 견적 요청 조회 - 추가 케이스", () => {
    it("sortBy가 undefined일 때 기본값 createdAt desc를 사용한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockDesignatedRequests = [
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockDesignatedMover.findMany.mockResolvedValue(mockDesignatedRequests);

      // Act
      const result =
        await moverEstimateRepository.getDesignatedEstimateRequest(moverId);

      // Assert
      expect(result).toEqual([
        {
          ...mockDesignatedRequests[0].estimateRequest,
          isDesignated: true,
        },
      ]);
      expect(mockDesignatedMover.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        select: {
          estimateRequest: expect.any(Object),
        },
        orderBy: { estimateRequest: { createdAt: "desc" } },
      });
    });

    it("고객 이름과 이사 타입 필터링이 모두 적용된다", async () => {
      // Arrange
      const moverId = "mover123";
      const customerName = "고객A";
      const movingType = "HOME";

      const mockDesignatedRequests = [
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockDesignatedMover.findMany.mockResolvedValue(mockDesignatedRequests);

      // Act
      const result = await moverEstimateRepository.getDesignatedEstimateRequest(
        moverId,
        "moveDate",
        customerName,
        movingType
      );

      // Assert
      expect(result).toEqual([
        {
          ...mockDesignatedRequests[0].estimateRequest,
          isDesignated: true,
        },
      ]);
      expect(mockDesignatedMover.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          moverId: moverId,
          deletedAt: null,
          estimateRequest: expect.objectContaining({
            customer: {
              name: {
                contains: customerName,
              },
            },
            moveType: movingType,
          }),
        }),
        select: {
          estimateRequest: expect.any(Object),
        },
        orderBy: { estimateRequest: { moveDate: "asc" } },
      });
    });
  });

  describe("견적 생성 - 추가 검증 케이스", () => {
    it("REJECTED 상태로 견적을 생성한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const price = 500000;
      const comment = "합리적인 가격";
      const status = "REJECTED";
      const isDesignated = true;

      const mockCreatedEstimate = {
        id: "estimate123",
        estimateRequestId: estimateRequestId,
        moverId: moverId,
        price: price,
        comment: comment,
        status: status,
        isDesignated: isDesignated,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mover: {
          id: "mover123",
          name: "이사업체A",
          moverImage: null,
          nickname: null,
          shortIntro: null,
          detailIntro: null,
          career: null,
          workedCount: null,
          averageRating: null,
          totalReviewCount: null,
          serviceTypes: [],
        },
        estimateRequest: {
          id: estimateRequestId,
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      };

      mockEstimate.create.mockResolvedValue(mockCreatedEstimate);

      // Act
      const result = await moverEstimateRepository.createEstimate(
        estimateRequestId,
        moverId,
        price,
        comment,
        status,
        isDesignated
      );

      // Assert
      expect(result).toEqual(mockCreatedEstimate);
      expect(mockEstimate.create).toHaveBeenCalledWith({
        data: {
          estimateRequestId: estimateRequestId,
          moverId: moverId,
          price: price,
          comment: comment,
          status: status,
          isDesignated: isDesignated,
        },
        select: expect.any(Object),
      });
    });
  });

  describe("견적 상태 업데이트 - 추가 케이스", () => {
    it("AUTO_REJECTED 상태로 견적을 업데이트한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "AUTO_REJECTED";
      const mockUpdatedEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격",
        status: status,
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mover: {
          id: "mover123",
          name: "이사업체A",
          moverImage: null,
          nickname: null,
          shortIntro: null,
          detailIntro: null,
          career: null,
          workedCount: null,
          averageRating: null,
          totalReviewCount: null,
          serviceTypes: [],
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      };

      mockEstimate.update.mockResolvedValue(mockUpdatedEstimate);

      // Act
      const result = await moverEstimateRepository.updateEstimateStatus(
        estimateId,
        status
      );

      // Assert
      expect(result).toEqual(mockUpdatedEstimate);
      expect(mockEstimate.update).toHaveBeenCalledWith({
        where: {
          id: estimateId,
        },
        data: {
          status: status,
        },
        select: expect.any(Object),
      });
    });
  });

  describe("지정 견적 요청 조회 - 추가 검증 케이스", () => {
    it("고객 이름만 필터링할 때 estimateRequest 조건이 올바르게 설정된다", async () => {
      // Arrange
      const moverId = "mover123";
      const customerName = "고객A";

      const mockDesignatedRequests = [
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockDesignatedMover.findMany.mockResolvedValue(mockDesignatedRequests);

      // Act
      const result = await moverEstimateRepository.getDesignatedEstimateRequest(
        moverId,
        undefined,
        customerName
      );

      // Assert
      expect(result).toEqual([
        {
          ...mockDesignatedRequests[0].estimateRequest,
          isDesignated: true,
        },
      ]);
      expect(mockDesignatedMover.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          moverId: moverId,
          deletedAt: null,
          estimateRequest: expect.objectContaining({
            customer: {
              name: {
                contains: customerName,
              },
            },
          }),
        }),
        select: {
          estimateRequest: expect.any(Object),
        },
        orderBy: { estimateRequest: { createdAt: "desc" } },
      });
    });

    it("이사 타입만 필터링할 때 estimateRequest 조건이 올바르게 설정된다", async () => {
      // Arrange
      const moverId = "mover123";
      const movingType = "OFFICE";

      const mockDesignatedRequests = [
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "OFFICE",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockDesignatedMover.findMany.mockResolvedValue(mockDesignatedRequests);

      // Act
      const result = await moverEstimateRepository.getDesignatedEstimateRequest(
        moverId,
        undefined,
        undefined,
        movingType
      );

      // Assert
      expect(result).toEqual([
        {
          ...mockDesignatedRequests[0].estimateRequest,
          isDesignated: true,
        },
      ]);
      expect(mockDesignatedMover.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          moverId: moverId,
          deletedAt: null,
          estimateRequest: expect.objectContaining({
            moveType: movingType,
          }),
        }),
        select: {
          estimateRequest: expect.any(Object),
        },
        orderBy: { estimateRequest: { createdAt: "desc" } },
      });
    });
  });

  describe("지역 견적 요청 조회 - 추가 검증 케이스", () => {
    it("고객 이름만 필터링할 때 customer 조건이 올바르게 설정된다", async () => {
      // Arrange
      const moverId = "mover123";
      const customerName = "고객B";

      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객B",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      ];

      mockEstimateRequest.findMany.mockResolvedValue(mockEstimateRequests);
      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.getRegionEstimateRequest(
        moverId,
        undefined,
        customerName
      );

      // Assert
      expect(result).toEqual(
        mockEstimateRequests.map((request) => ({
          ...request,
          isDesignated: false,
        }))
      );
      expect(mockEstimateRequest.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: "PENDING",
          moveDate: {
            gt: expect.any(Date),
          },
          customerId: {
            not: moverId,
          },
          estimates: {
            none: {
              moverId: moverId,
              status: { in: ["PROPOSED", "REJECTED"] },
            },
          },
          customer: {
            name: {
              contains: customerName,
            },
          },
        }),
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("이사 타입만 필터링할 때 moveType 조건이 올바르게 설정된다", async () => {
      // Arrange
      const moverId = "mover123";
      const movingType = "SMALL";

      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer123",
          moveType: "SMALL",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      ];

      mockEstimateRequest.findMany.mockResolvedValue(mockEstimateRequests);
      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.getRegionEstimateRequest(
        moverId,
        undefined,
        undefined,
        movingType
      );

      // Assert
      expect(result).toEqual(
        mockEstimateRequests.map((request) => ({
          ...request,
          isDesignated: false,
        }))
      );
      expect(mockEstimateRequest.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: "PENDING",
          moveDate: {
            gt: expect.any(Date),
          },
          customerId: {
            not: moverId,
          },
          estimates: {
            none: {
              moverId: moverId,
              status: { in: ["PROPOSED", "REJECTED"] },
            },
          },
          moveType: movingType,
        }),
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("지정 견적 요청 조회 - 추가 검증 케이스 2", () => {
    it("고객 이름과 이사 타입이 모두 undefined일 때 기본 조건만 적용된다", async () => {
      // Arrange
      const moverId = "mover123";

      const mockDesignatedRequests = [
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockDesignatedMover.findMany.mockResolvedValue(mockDesignatedRequests);

      // Act
      const result = await moverEstimateRepository.getDesignatedEstimateRequest(
        moverId,
        undefined,
        undefined,
        undefined
      );

      // Assert
      expect(result).toEqual([
        {
          ...mockDesignatedRequests[0].estimateRequest,
          isDesignated: true,
        },
      ]);
      expect(mockDesignatedMover.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          moverId: moverId,
          deletedAt: null,
          estimateRequest: expect.objectContaining({
            status: "PENDING",
            moveDate: {
              gt: expect.any(Date),
            },
            customerId: {
              not: moverId,
            },
            estimates: {
              none: {
                moverId: moverId,
                status: { in: ["PROPOSED", "REJECTED"] },
              },
            },
          }),
        }),
        select: {
          estimateRequest: expect.any(Object),
        },
        orderBy: { estimateRequest: { createdAt: "desc" } },
      });
    });
  });

  describe("견적 생성 - 추가 검증 케이스 2", () => {
    it("isDesignated가 true일 때 견적을 생성한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const moverId = "mover123";
      const price = 500000;
      const comment = "합리적인 가격";
      const status = "PROPOSED";
      const isDesignated = true;

      const mockCreatedEstimate = {
        id: "estimate123",
        estimateRequestId: estimateRequestId,
        moverId: moverId,
        price: price,
        comment: comment,
        status: status,
        isDesignated: isDesignated,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mover: {
          id: "mover123",
          name: "이사업체A",
          moverImage: null,
          nickname: null,
          shortIntro: null,
          detailIntro: null,
          career: null,
          workedCount: null,
          averageRating: null,
          totalReviewCount: null,
          serviceTypes: [],
        },
        estimateRequest: {
          id: estimateRequestId,
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      };

      mockEstimate.create.mockResolvedValue(mockCreatedEstimate);

      // Act
      const result = await moverEstimateRepository.createEstimate(
        estimateRequestId,
        moverId,
        price,
        comment,
        status,
        isDesignated
      );

      // Assert
      expect(result).toEqual(mockCreatedEstimate);
      expect(mockEstimate.create).toHaveBeenCalledWith({
        data: {
          estimateRequestId: estimateRequestId,
          moverId: moverId,
          price: price,
          comment: comment,
          status: status,
          isDesignated: isDesignated,
        },
        select: expect.any(Object),
      });
    });

    it("isDesignated가 null일 때 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "합리적인 가격",
          "PROPOSED",
          null as any
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("isDesignated가 undefined일 때 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "합리적인 가격",
          "PROPOSED",
          undefined as any
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("isDesignated가 문자열일 때 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "합리적인 가격",
          "PROPOSED",
          "true" as any
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("지정 견적 요청 조회 - 추가 검증 케이스 4", () => {
    it("sortBy가 유효하지 않은 값일 때 기본값 createdAt desc를 사용한다", async () => {
      // Arrange
      const moverId = "mover123";

      const mockDesignatedRequests = [
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockDesignatedMover.findMany.mockResolvedValue(mockDesignatedRequests);

      // Act
      const result = await moverEstimateRepository.getDesignatedEstimateRequest(
        moverId,
        "invalidSortBy" as any,
        undefined,
        undefined
      );

      // Assert
      expect(result).toEqual([
        {
          ...mockDesignatedRequests[0].estimateRequest,
          isDesignated: true,
        },
      ]);
      expect(mockDesignatedMover.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          moverId: moverId,
          deletedAt: null,
          estimateRequest: expect.objectContaining({
            status: "PENDING",
            moveDate: {
              gt: expect.any(Date),
            },
            customerId: {
              not: moverId,
            },
            estimates: {
              none: {
                moverId: moverId,
                status: { in: ["PROPOSED", "REJECTED"] },
              },
            },
          }),
        }),
        select: {
          estimateRequest: expect.any(Object),
        },
        orderBy: { estimateRequest: { createdAt: "desc" } },
      });
    });

    it("sortBy가 createdAt일 때 createdAt desc로 정렬한다", async () => {
      // Arrange
      const moverId = "mover123";

      const mockDesignatedRequests = [
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "이사 견적 요청",
            status: "PENDING" as RequestStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer123",
              name: "고객A",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: null,
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "12345",
              city: "서울시",
              district: "강남구",
              detail: "123-456",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "12346",
              city: "경기도",
              district: "성남시",
              detail: "789-012",
              region: "GYEONGGI",
            },
            estimates: [],
          },
        },
      ];

      mockDesignatedMover.findMany.mockResolvedValue(mockDesignatedRequests);

      // Act
      const result = await moverEstimateRepository.getDesignatedEstimateRequest(
        moverId,
        "createdAt",
        undefined,
        undefined
      );

      // Assert
      expect(result).toEqual([
        {
          ...mockDesignatedRequests[0].estimateRequest,
          isDesignated: true,
        },
      ]);
      expect(mockDesignatedMover.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          moverId: moverId,
          deletedAt: null,
          estimateRequest: expect.objectContaining({
            status: "PENDING",
            moveDate: {
              gt: expect.any(Date),
            },
            customerId: {
              not: moverId,
            },
            estimates: {
              none: {
                moverId: moverId,
                status: { in: ["PROPOSED", "REJECTED"] },
              },
            },
          }),
        }),
        select: {
          estimateRequest: expect.any(Object),
        },
        orderBy: { estimateRequest: { createdAt: "desc" } },
      });
    });
  });

  describe("지역 견적 요청 조회 - 추가 검증 케이스 5", () => {
    it("sortBy가 createdAt일 때 createdAt desc로 정렬한다", async () => {
      // Arrange
      const moverId = "mover123";

      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "이사 견적 요청",
          status: "PENDING" as RequestStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: null,
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      ];

      mockEstimateRequest.findMany.mockResolvedValue(mockEstimateRequests);
      mockDesignatedMover.findFirst.mockResolvedValue(null);

      // Act
      const result = await moverEstimateRepository.getRegionEstimateRequest(
        moverId,
        "createdAt",
        undefined,
        undefined,
        undefined
      );

      // Assert
      expect(result).toEqual(
        mockEstimateRequests.map((request) => ({
          ...request,
          isDesignated: false,
        }))
      );
      expect(mockEstimateRequest.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: "PENDING",
          moveDate: {
            gt: expect.any(Date),
          },
          customerId: {
            not: moverId,
          },
          estimates: {
            none: {
              moverId: moverId,
              status: { in: ["PROPOSED", "REJECTED"] },
            },
          },
        }),
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("견적 요청 상세 조회 - 추가 검증 케이스", () => {
    it("빈 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateRequestById("")
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("null 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateRequestById(null as any)
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("숫자 타입 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.getEstimateRequestById(123 as any)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 생성 - 추가 검증 케이스 3", () => {
    it("null 코멘트로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          null as any,
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("문자열이 아닌 코멘트로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          123 as any,
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("null 견적 요청 ID로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          null as any,
          "mover123",
          500000,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("null 기사 ID로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          null as any,
          500000,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("null 가격으로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          null as any,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("문자열 가격으로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          "500000" as any,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("null 상태로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "합리적인 가격",
          null as any,
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("빈 상태로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "합리적인 가격",
          "INVALID_STATUS" as any,
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 요청 ID로 조회 - 추가 검증 케이스", () => {
    it("undefined 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findEstimateRequestById(undefined as any)
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("공백만 있는 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findEstimateRequestById("   ")
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("기존 견적 조회 - 추가 검증 케이스", () => {
    it("undefined 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findExistingEstimate(
          undefined as any,
          "mover123"
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("undefined 기사 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findExistingEstimate(
          "estimateRequest123",
          undefined as any
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("공백만 있는 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findExistingEstimate("   ", "mover123")
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("공백만 있는 기사 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findExistingEstimate(
          "estimateRequest123",
          "   "
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("지정 견적 요청 조회 - 추가 검증 케이스 5", () => {
    it("undefined 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findDesignatedRequest(
          undefined as any,
          "mover123"
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("undefined 기사 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.findDesignatedRequest(
          "estimateRequest123",
          undefined as any
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("기존 견적 개수 조회 - 추가 검증 케이스", () => {
    it("undefined 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.countExistingEstimates(undefined as any)
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("공백만 있는 견적 요청 ID로 조회 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.countExistingEstimates("   ")
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 생성 - 추가 검증 케이스 4", () => {
    it("undefined 견적 요청 ID로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          undefined as any,
          "mover123",
          500000,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("undefined 기사 ID로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          undefined as any,
          500000,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("undefined 가격으로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          undefined as any,
          "합리적인 가격",
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("undefined 코멘트로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          undefined as any,
          "PROPOSED",
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("undefined 상태로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "합리적인 가격",
          undefined as any,
          false
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("undefined 지정 여부로 생성 시 RepositoryQueryError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateRepository.createEstimate(
          "estimateRequest123",
          "mover123",
          500000,
          "합리적인 가격",
          "PROPOSED",
          undefined as any
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });
});
