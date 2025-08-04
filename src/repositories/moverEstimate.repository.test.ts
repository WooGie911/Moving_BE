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
    })),
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
      const mockError = new Error("Database error");

      mockDesignatedMover.findFirst.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.findDesignatedRequest(
          estimateRequestId,
          moverId
        )
      ).rejects.toThrow(RepositoryQueryError);
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
      const mockError = new Error("Database error");

      mockEstimate.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        moverEstimateRepository.countExistingEstimates(estimateRequestId)
      ).rejects.toThrow(RepositoryQueryError);
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
      const mockError = new Error("Database error");

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
});
