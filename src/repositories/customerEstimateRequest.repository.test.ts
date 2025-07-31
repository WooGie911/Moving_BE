import customerEstimateRequestRepository from "./customerEstimateRequest.repository";
import { RepositoryQueryError } from "../types/errors.types";
import { EstimateStatus, RequestStatus, MoveType } from "@prisma/client";

// PrismaClient 모킹
jest.mock("@prisma/client", () => {
  const mockEstimateRequest = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockEstimate = {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockUser = {
    findUnique: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      estimateRequest: mockEstimateRequest,
      estimate: mockEstimate,
      user: mockUser,
    })),
  };
});

// 모킹된 객체들을 가져오기
const { PrismaClient } = require("@prisma/client");
const mockPrisma = new PrismaClient();
const mockEstimateRequest = mockPrisma.estimateRequest;
const mockEstimate = mockPrisma.estimate;
const mockUser = mockPrisma.user;

// 테스트용 타입 정의
type MockEstimateRequestData = {
  id: string;
  customerId: string;
  moveType: MoveType;
  moveDate: Date;
  createdAt: Date;
  description: string;
  status: RequestStatus;
  fromAddress: {
    zoneCode: string;
    city: string;
    district: string;
    detail: string;
    region: string;
  };
  toAddress: {
    zoneCode: string;
    city: string;
    district: string;
    detail: string;
    region: string;
  };
  estimates: Array<{
    id: string;
    price: number;
    comment: string;
    status: EstimateStatus;
    isDesignated: boolean;
    createdAt: Date;
    mover: {
      id: string;
      name: string;
      userType: string[];
      moverImage: string | null;
      nickname: string | null;
      isVeteran: boolean | null;
      shortIntro: string | null;
      detailIntro: string | null;
      career: number | null;
      workedCount: number | null;
      averageRating: number | null;
      totalReviewCount: number | null;
      serviceTypes: string[];
      serviceAreas: Array<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        district: string | null;
        region: string;
        userId: string;
      }>;
      totalFavoriteCount: number;
      Favorite: Array<{ id: string }>;
    };
  }>;
};

describe("customerEstimateRequestRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getActiveEstimateRequest", () => {
    it("성공적으로 활성 견적요청 ID를 조회한다", async () => {
      // Arrange
      const userId = "user123";
      const mockData = {
        id: "estimateRequest123",
      };

      mockEstimateRequest.findFirst.mockResolvedValue(mockData);

      // Act
      const result =
        await customerEstimateRequestRepository.getActiveEstimateRequest(
          userId
        );

      // Assert
      expect(result).toBe("estimateRequest123");
      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          status: { in: ["PENDING", "APPROVED"] },
        },
        select: {
          id: true,
        },
      });
    });

    it("활성 견적요청이 없을 때 null을 반환한다", async () => {
      // Arrange
      const userId = "user123";

      mockEstimateRequest.findFirst.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getActiveEstimateRequest(
          userId
        );

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const mockError = new Error("Database connection failed");

      mockPrisma.estimateRequest.findFirst.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getActiveEstimateRequest(userId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("getMover", () => {
    it("성공적으로 이사업체 정보를 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockMover = {
        id: "mover123",
        name: "이사업체A",
        userType: ["MOVER"],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockMover);

      // Act
      const result = await customerEstimateRequestRepository.getMover(moverId);

      // Assert
      expect(result).toEqual(mockMover);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: moverId,
        },
      });
    });

    it("이사업체가 없을 때 null을 반환한다", async () => {
      // Arrange
      const moverId = "mover123";

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await customerEstimateRequestRepository.getMover(moverId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getPendingEstimateRequest", () => {
    it("성공적으로 진행중인 견적요청을 조회한다", async () => {
      // Arrange
      const activeEstimateRequestId = "estimateRequest123";
      const userId = "user123";
      const mockData: MockEstimateRequestData = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date(),
        createdAt: new Date(),
        description: "이사 견적 요청",
        status: "PENDING",
        fromAddress: {
          zoneCode: "12345",
          city: "서울시",
          district: "강남구",
          detail: "123-456",
          region: "SEOUL",
        },
        toAddress: {
          zoneCode: "12346",
          city: "경기도",
          district: "성남시",
          detail: "789-012",
          region: "GYEONGGI",
        },
        estimates: [
          {
            id: "estimate1",
            price: 500000,
            comment: "합리적인 가격",
            status: "PROPOSED",
            isDesignated: false,
            createdAt: new Date(),
            mover: {
              id: "mover123",
              name: "이사업체A",
              userType: ["MOVER"],
              moverImage: null,
              nickname: null,
              isVeteran: false,
              shortIntro: null,
              detailIntro: null,
              career: null,
              workedCount: null,
              averageRating: null,
              totalReviewCount: null,
              serviceTypes: [],
              serviceAreas: [],
              totalFavoriteCount: 5,
              Favorite: [],
            },
          },
        ],
      };

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(mockData);

      // Act
      const result =
        await customerEstimateRequestRepository.getPendingEstimateRequest(
          activeEstimateRequestId,
          userId
        );

      // Assert
      expect(result).toEqual(mockData);
      expect(mockPrisma.estimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          id: activeEstimateRequestId,
          status: { in: ["PENDING", "APPROVED"] },
          deletedAt: null,
        },
        orderBy: { moveDate: "asc" },
        select: expect.any(Object),
      });
    });

    it("진행중인 견적요청이 없을 때 null을 반환한다", async () => {
      // Arrange
      const activeEstimateRequestId = "estimateRequest123";
      const userId = "user123";

      mockPrisma.estimateRequest.findFirst.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getPendingEstimateRequest(
          activeEstimateRequestId,
          userId
        );

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const activeEstimateRequestId = "estimateRequest123";
      const userId = "user123";
      const mockError = new Error("Database connection failed");

      mockPrisma.estimateRequest.findFirst.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getPendingEstimateRequest(
          activeEstimateRequestId,
          userId
        )
      ).rejects.toThrow(RepositoryQueryError);
    });

    it("잘못된 파라미터로 호출했을 때 에러를 던진다", async () => {
      // Arrange
      const activeEstimateRequestId = "";
      const userId = "";

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getPendingEstimateRequest(
          activeEstimateRequestId,
          userId
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("getReceivedEstimateRequests", () => {
    it("성공적으로 완료된 견적요청 목록을 조회한다", async () => {
      // Arrange
      const userId = "user123";
      const mockData: MockEstimateRequestData[] = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME",
          moveDate: new Date(),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "COMPLETED",
          fromAddress: {
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL",
          },
          toAddress: {
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI",
          },
          estimates: [],
        },
      ];

      mockPrisma.estimateRequest.findMany.mockResolvedValue(mockData);

      // Act
      const result =
        await customerEstimateRequestRepository.getReceivedEstimateRequests(
          userId
        );

      // Assert
      expect(result).toEqual(mockData);
      expect(mockPrisma.estimateRequest.findMany).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          status: { in: ["EXPIRED", "COMPLETED"] },
        },
        select: expect.objectContaining({
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          createdAt: true,
          description: true,
          status: true,
          fromAddress: expect.any(Object),
          toAddress: expect.any(Object),
          estimates: expect.any(Object),
        }),
      });
    });

    it("완료된 견적요청이 없을 때 빈 배열을 반환한다", async () => {
      // Arrange
      const userId = "user123";

      mockPrisma.estimateRequest.findMany.mockResolvedValue([]);

      // Act
      const result =
        await customerEstimateRequestRepository.getReceivedEstimateRequests(
          userId
        );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("getEstimateRequestById", () => {
    it("성공적으로 견적요청을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockEstimateRequest = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date(),
        createdAt: new Date(),
        description: "이사 견적 요청",
        status: "PENDING",
      };

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(
        mockEstimateRequest
      );

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateRequestById(
          estimateRequestId
        );

      // Assert
      expect(result).toEqual(mockEstimateRequest);
      expect(mockPrisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: { id: estimateRequestId },
      });
    });

    it("견적요청이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";

      mockPrisma.estimateRequest.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateRequestById(
          estimateRequestId
        );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getEstimateByIdAndRequestId", () => {
    it("성공적으로 견적을 조회한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const estimateRequestId = "estimateRequest123";
      const mockEstimate = {
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격",
        status: "PROPOSED",
        isDesignated: false,
        createdAt: new Date(),
      };

      mockPrisma.estimate.findUnique.mockResolvedValue(mockEstimate);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateByIdAndRequestId(
          estimateId,
          estimateRequestId
        );

      // Assert
      expect(result).toEqual(mockEstimate);
      expect(mockPrisma.estimate.findUnique).toHaveBeenCalledWith({
        where: {
          id: estimateId,
          estimateRequestId: estimateRequestId,
        },
      });
    });

    it("견적이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const estimateRequestId = "estimateRequest123";

      mockPrisma.estimate.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateByIdAndRequestId(
          estimateId,
          estimateRequestId
        );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("updateEstimateRequestStatus", () => {
    it("성공적으로 견적요청 상태를 업데이트한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "APPROVED";
      const mockUpdatedEstimateRequest = {
        id: "estimateRequest123",
        status: "APPROVED",
      };

      mockPrisma.estimateRequest.update.mockResolvedValue(
        mockUpdatedEstimateRequest
      );

      // Act
      const result =
        await customerEstimateRequestRepository.updateEstimateRequestStatus(
          estimateRequestId,
          status
        );

      // Assert
      expect(result).toEqual(mockUpdatedEstimateRequest);
      expect(mockPrisma.estimateRequest.update).toHaveBeenCalledWith({
        where: { id: estimateRequestId },
        data: { status },
      });
    });
  });

  describe("updateEstimateStatus", () => {
    it("성공적으로 견적 상태를 업데이트한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "REJECTED";
      const mockUpdatedEstimate = {
        id: "estimate123",
        status: "REJECTED",
      };

      mockPrisma.estimate.update.mockResolvedValue(mockUpdatedEstimate);

      // Act
      const result =
        await customerEstimateRequestRepository.updateEstimateStatus(
          estimateId,
          status
        );

      // Assert
      expect(result).toEqual(mockUpdatedEstimate);
      expect(mockPrisma.estimate.update).toHaveBeenCalledWith({
        where: { id: estimateId },
        data: { status },
      });
    });
  });

  describe("updateAllEstimatesStatus", () => {
    it("성공적으로 모든 견적 상태를 일괄 업데이트한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "AUTO_REJECTED";
      const excludeEstimateId = "estimate123";

      mockPrisma.estimate.updateMany.mockResolvedValue({ count: 2 });

      // Act
      await customerEstimateRequestRepository.updateAllEstimatesStatus(
        estimateRequestId,
        status,
        excludeEstimateId
      );

      // Assert
      expect(mockPrisma.estimate.updateMany).toHaveBeenCalledWith({
        where: {
          estimateRequestId: estimateRequestId,
          id: { not: excludeEstimateId },
        },
        data: { status },
      });
    });

    it("제외할 견적 ID가 없을 때 모든 견적을 업데이트한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "AUTO_REJECTED";

      mockPrisma.estimate.updateMany.mockResolvedValue({ count: 3 });

      // Act
      await customerEstimateRequestRepository.updateAllEstimatesStatus(
        estimateRequestId,
        status
      );

      // Assert
      expect(mockPrisma.estimate.updateMany).toHaveBeenCalledWith({
        where: {
          estimateRequestId: estimateRequestId,
        },
        data: { status },
      });
    });
  });
});
