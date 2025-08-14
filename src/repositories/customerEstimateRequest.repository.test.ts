import customerEstimateRequestRepository from "./customerEstimateRequest.repository";
import { RepositoryQueryError } from "../types/errors.types";
import { EstimateStatus, RequestStatus, MoveType } from "@prisma/client";

// PrismaClient 모킹 - 타입 안전성 확보
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
    findMany: jest.fn(),
  };

  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockFavorite = {
    count: jest.fn(),
    groupBy: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      estimateRequest: mockEstimateRequest,
      estimate: mockEstimate,
      user: mockUser,
      favorite: mockFavorite,
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
  findFirst: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
}

interface MockEstimate {
  findUnique: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  findMany: jest.Mock;
}

interface MockUser {
  findUnique: jest.Mock;
}

interface MockFavorite {
  count: jest.Mock;
  groupBy: jest.Mock;
}

const mockEstimateRequest = mockPrisma.estimateRequest as MockEstimateRequest;
const mockEstimate = mockPrisma.estimate as MockEstimate;
const mockUser = mockPrisma.user as MockUser;
const mockFavorite = mockPrisma.favorite as MockFavorite;

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
      name: string | null;
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

describe("고객 견적 요청 레포지토리", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("활성 견적 요청 조회", () => {
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
      expect(mockEstimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          status: { in: ["PENDING", "APPROVED"] },
          moveDate: {
            gte: expect.any(Date),
          },
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

      mockEstimateRequest.findFirst.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getActiveEstimateRequest(userId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("기사님 조회", () => {
    it("성공적으로 이사업체 정보를 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockMover = {
        id: "mover123",
        name: "이사업체A",
        userType: ["MOVER"],
      };

      mockUser.findUnique.mockResolvedValue(mockMover);

      // Act
      const result = await customerEstimateRequestRepository.getMover(moverId);

      // Assert
      expect(result).toEqual(mockMover);
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: {
          id: moverId,
        },
      });
    });

    it("이사업체가 없을 때 null을 반환한다", async () => {
      // Arrange
      const moverId = "mover123";

      mockUser.findUnique.mockResolvedValue(null);

      // Act
      const result = await customerEstimateRequestRepository.getMover(moverId);

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockError = new Error("Database connection failed");

      mockUser.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getMover(moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("진행중인 견적 요청 조회", () => {
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

      mockEstimateRequest.findFirst.mockResolvedValue(mockData);

      // Act
      const result =
        await customerEstimateRequestRepository.getPendingEstimateRequest(
          activeEstimateRequestId,
          userId
        );

      // Assert
      expect(result).toEqual(mockData);
      expect(mockEstimateRequest.findFirst).toHaveBeenCalledWith({
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

      mockEstimateRequest.findFirst.mockResolvedValue(null);

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

      mockEstimateRequest.findFirst.mockRejectedValue(mockError);

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

  describe("완료된 견적 요청 목록 조회", () => {
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

      mockEstimateRequest.findMany.mockResolvedValue(mockData);

      // Act
      const result =
        await customerEstimateRequestRepository.getReceivedEstimateRequests(
          userId
        );

      // Assert
      expect(result).toEqual(mockData);
      expect(mockEstimateRequest.findMany).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          status: { in: ["EXPIRED", "COMPLETED", "APPROVED"] },
          moveDate: {
            lt: expect.any(Date),
          },
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

      mockEstimateRequest.findMany.mockResolvedValue([]);

      // Act
      const result =
        await customerEstimateRequestRepository.getReceivedEstimateRequests(
          userId
        );

      // Assert
      expect(result).toEqual([]);
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const mockError = new Error("Database connection failed");

      mockEstimateRequest.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getReceivedEstimateRequests(userId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 요청 ID로 조회", () => {
    it("성공적으로 견적요청을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockEstimateRequestData = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date(),
        createdAt: new Date(),
        description: "이사 견적 요청",
        status: "PENDING",
      };

      mockEstimateRequest.findUnique.mockResolvedValue(mockEstimateRequestData);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateRequestById(
          estimateRequestId
        );

      // Assert
      expect(result).toEqual(mockEstimateRequestData);
      expect(mockEstimateRequest.findUnique).toHaveBeenCalledWith({
        where: { id: estimateRequestId },
      });
    });

    it("견적요청이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";

      mockEstimateRequest.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateRequestById(
          estimateRequestId
        );

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockError = new Error("Database connection failed");

      mockEstimateRequest.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getEstimateRequestById(
          estimateRequestId
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 ID와 요청 ID로 견적 조회", () => {
    it("성공적으로 견적을 조회한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const estimateRequestId = "estimateRequest123";
      const mockEstimateData = {
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격",
        status: "PROPOSED",
        isDesignated: false,
        createdAt: new Date(),
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateData);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateByIdAndRequestId(
          estimateId,
          estimateRequestId
        );

      // Assert
      expect(result).toEqual(mockEstimateData);
      expect(mockEstimate.findUnique).toHaveBeenCalledWith({
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

      mockEstimate.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateByIdAndRequestId(
          estimateId,
          estimateRequestId
        );

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const estimateRequestId = "estimateRequest123";
      const mockError = new Error("Database connection failed");

      mockEstimate.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getEstimateByIdAndRequestId(
          estimateId,
          estimateRequestId
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 요청 상태 업데이트", () => {
    it("성공적으로 견적요청 상태를 업데이트한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "APPROVED";
      const mockUpdatedEstimateRequest = {
        id: "estimateRequest123",
        status: "APPROVED",
      };

      mockEstimateRequest.update.mockResolvedValue(mockUpdatedEstimateRequest);

      // Act
      const result =
        await customerEstimateRequestRepository.updateEstimateRequestStatus(
          estimateRequestId,
          status
        );

      // Assert
      expect(result).toEqual(mockUpdatedEstimateRequest);
      expect(mockEstimateRequest.update).toHaveBeenCalledWith({
        where: { id: estimateRequestId },
        data: { status },
      });
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "APPROVED";
      const mockError = new Error("Database connection failed");

      mockEstimateRequest.update.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.updateEstimateRequestStatus(
          estimateRequestId,
          status
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 상태 업데이트", () => {
    it("성공적으로 견적 상태를 업데이트한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "REJECTED";
      const mockUpdatedEstimate = {
        id: "estimate123",
        status: "REJECTED",
      };

      mockEstimate.update.mockResolvedValue(mockUpdatedEstimate);

      // Act
      const result =
        await customerEstimateRequestRepository.updateEstimateStatus(
          estimateId,
          status
        );

      // Assert
      expect(result).toEqual(mockUpdatedEstimate);
      expect(mockEstimate.update).toHaveBeenCalledWith({
        where: { id: estimateId },
        data: { status },
      });
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "REJECTED";
      const mockError = new Error("Database connection failed");

      mockEstimate.update.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.updateEstimateStatus(
          estimateId,
          status
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("모든 견적 상태 업데이트", () => {
    it("성공적으로 모든 견적 상태를 일괄 업데이트한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "AUTO_REJECTED";
      const excludeEstimateId = "estimate123";

      mockEstimate.updateMany.mockResolvedValue({ count: 2 });

      // Act
      await customerEstimateRequestRepository.updateAllEstimatesStatus(
        estimateRequestId,
        status,
        excludeEstimateId
      );

      // Assert
      expect(mockEstimate.updateMany).toHaveBeenCalledWith({
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

      mockEstimate.updateMany.mockResolvedValue({ count: 3 });

      // Act
      await customerEstimateRequestRepository.updateAllEstimatesStatus(
        estimateRequestId,
        status
      );

      // Assert
      expect(mockEstimate.updateMany).toHaveBeenCalledWith({
        where: {
          estimateRequestId: estimateRequestId,
        },
        data: { status },
      });
    });

    it("데이터베이스 에러가 발생했을 때 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "AUTO_REJECTED";
      const excludeEstimateId = "estimate123";
      const mockError = new Error("Database connection failed");

      mockEstimate.updateMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.updateAllEstimatesStatus(
          estimateRequestId,
          status,
          excludeEstimateId
        )
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
        price: 500000,
        comment: "합리적인 가격",
        status: "PROPOSED",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateData);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateById(estimateId);

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
      const result =
        await customerEstimateRequestRepository.getEstimateById(estimateId);

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
        customerEstimateRequestRepository.getEstimateById(estimateId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 상세 정보 조회", () => {
    it("성공적으로 견적 상세 정보를 조회한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const mockEstimateDetail = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        status: "PROPOSED",
        isDesignated: false,
        mover: {
          id: "mover123",
          name: "이사업체A",
          nickname: null,
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date(),
          customer: {
            id: "customer123",
            name: "고객A",
          },
        },
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateDetail);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateDetailForAction(
          estimateId
        );

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
                  nickname: true,
                },
              },
            },
          },
        },
      });
    });

    it("견적이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateId = "estimate123";

      mockEstimate.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateDetailForAction(
          estimateId
        );

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
        customerEstimateRequestRepository.getEstimateDetailForAction(estimateId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("다른 견적들 조회", () => {
    it("성공적으로 다른 견적들을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";
      const mockOtherEstimates = [
        {
          id: "estimate2",
          moverId: "mover456",
          status: "PROPOSED",
          isDesignated: false,
        },
        {
          id: "estimate3",
          moverId: "mover789",
          status: "ACCEPTED",
          isDesignated: true,
        },
      ];

      mockEstimate.findMany.mockResolvedValue(mockOtherEstimates);

      // Act
      const result = await customerEstimateRequestRepository.getOtherEstimates(
        estimateRequestId,
        excludeEstimateId
      );

      // Assert
      expect(result).toEqual(mockOtherEstimates);
      expect(mockEstimate.findMany).toHaveBeenCalledWith({
        where: {
          estimateRequestId: estimateRequestId,
          id: { not: excludeEstimateId },
          status: { in: ["PROPOSED", "ACCEPTED"] },
        },
        select: {
          id: true,
          moverId: true,
          status: true,
          isDesignated: true,
        },
      });
    });

    it("다른 견적이 없을 때 빈 배열을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";

      mockEstimate.findMany.mockResolvedValue([]);

      // Act
      const result = await customerEstimateRequestRepository.getOtherEstimates(
        estimateRequestId,
        excludeEstimateId
      );

      // Assert
      expect(result).toEqual([]);
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";
      const mockError = new Error("Database error");

      mockEstimate.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getOtherEstimates(
          estimateRequestId,
          excludeEstimateId
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("AUTO_REJECTED된 견적들 조회", () => {
    it("성공적으로 AUTO_REJECTED된 견적들을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";
      const mockAutoRejectedEstimates = [
        {
          id: "estimate2",
          moverId: "mover456",
          status: "AUTO_REJECTED",
          isDesignated: false,
        },
        {
          id: "estimate3",
          moverId: "mover789",
          status: "AUTO_REJECTED",
          isDesignated: true,
        },
      ];

      mockEstimate.findMany.mockResolvedValue(mockAutoRejectedEstimates);

      // Act
      const result =
        await customerEstimateRequestRepository.getAutoRejectedEstimates(
          estimateRequestId,
          excludeEstimateId
        );

      // Assert
      expect(result).toEqual(mockAutoRejectedEstimates);
      expect(mockEstimate.findMany).toHaveBeenCalledWith({
        where: {
          estimateRequestId: estimateRequestId,
          id: { not: excludeEstimateId },
          status: { in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"] },
        },
        select: {
          id: true,
          moverId: true,
          status: true,
          isDesignated: true,
        },
      });
    });

    it("AUTO_REJECTED된 견적이 없을 때 빈 배열을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";

      mockEstimate.findMany.mockResolvedValue([]);

      // Act
      const result =
        await customerEstimateRequestRepository.getAutoRejectedEstimates(
          estimateRequestId,
          excludeEstimateId
        );

      // Assert
      expect(result).toEqual([]);
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";
      const mockError = new Error("Database error");

      mockEstimate.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getAutoRejectedEstimates(
          estimateRequestId,
          excludeEstimateId
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("기사님의 전체 찜 개수 조회", () => {
    it("성공적으로 기사님의 찜 개수를 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockFavoriteCount = 15;

      mockFavorite.count.mockResolvedValue(mockFavoriteCount);

      // Act
      const result =
        await customerEstimateRequestRepository.getMoverFavoriteCount(moverId);

      // Assert
      expect(result).toBe(mockFavoriteCount);
      expect(mockFavorite.count).toHaveBeenCalledWith({
        where: {
          moverId: moverId,
          deletedAt: null,
        },
      });
    });

    it("찜이 없을 때 0을 반환한다", async () => {
      // Arrange
      const moverId = "mover123";

      mockFavorite.count.mockResolvedValue(0);

      // Act
      const result =
        await customerEstimateRequestRepository.getMoverFavoriteCount(moverId);

      // Assert
      expect(result).toBe(0);
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockFavorite.count.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getMoverFavoriteCount(moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("여러 기사님의 찜 개수 일괄 조회", () => {
    it("성공적으로 여러 기사님의 찜 개수를 조회한다", async () => {
      // Arrange
      const moverIds = ["mover123", "mover456", "mover789"];
      const mockFavoriteCounts = [
        { moverId: "mover123", _count: { moverId: 15 } },
        { moverId: "mover456", _count: { moverId: 8 } },
        { moverId: "mover789", _count: { moverId: 22 } },
      ];

      mockFavorite.groupBy.mockResolvedValue(mockFavoriteCounts);

      // Act
      const result =
        await customerEstimateRequestRepository.getMoversFavoriteCounts(
          moverIds
        );

      // Assert
      expect(result).toEqual({
        mover123: 15,
        mover456: 8,
        mover789: 22,
      });
      expect(mockFavorite.groupBy).toHaveBeenCalledWith({
        by: ["moverId"],
        where: {
          moverId: { in: moverIds },
          deletedAt: null,
        },
        _count: {
          moverId: true,
        },
      });
    });

    it("일부 기사님의 찜이 없을 때 0으로 설정한다", async () => {
      // Arrange
      const moverIds = ["mover123", "mover456", "mover789"];
      const mockFavoriteCounts = [
        { moverId: "mover123", _count: { moverId: 15 } },
        { moverId: "mover789", _count: { moverId: 22 } },
      ];

      mockFavorite.groupBy.mockResolvedValue(mockFavoriteCounts);

      // Act
      const result =
        await customerEstimateRequestRepository.getMoversFavoriteCounts(
          moverIds
        );

      // Assert
      expect(result).toEqual({
        mover123: 15,
        mover456: 0,
        mover789: 22,
      });
    });

    it("빈 배열일 때 빈 객체를 반환한다", async () => {
      // Arrange
      const moverIds: string[] = [];

      // Act
      const result =
        await customerEstimateRequestRepository.getMoversFavoriteCounts(
          moverIds
        );

      // Assert
      expect(result).toEqual({});
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverIds = ["mover123", "mover456"];
      const mockError = new Error("Database error");

      mockFavorite.groupBy.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getMoversFavoriteCounts(moverIds)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("견적 ID로 기사 조회", () => {
    it("성공적으로 견적 ID로 기사를 조회한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const mockEstimateData = {
        moverId: "mover123",
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateData);

      // Act
      const result =
        await customerEstimateRequestRepository.getMoverByEstimateId(
          estimateId
        );

      // Assert
      expect(result).toEqual(mockEstimateData);
      expect(mockEstimate.findUnique).toHaveBeenCalledWith({
        where: { id: estimateId },
        select: {
          moverId: true,
        },
      });
    });

    it("견적이 존재하지 않을 때 null을 반환한다", async () => {
      // Arrange
      const estimateId = "nonexistent";

      mockEstimate.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getMoverByEstimateId(
          estimateId
        );

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
        customerEstimateRequestRepository.getMoverByEstimateId(estimateId)
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
        status: "PROPOSED",
        isDesignated: false,
        mover: {
          id: "mover123",
          name: "이사업체A",
          nickname: "기사A",
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          customer: {
            id: "customer123",
            nickname: "고객A",
          },
        },
      };

      mockEstimate.findUnique.mockResolvedValue(mockEstimateDetail);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateDetailForAction(
          estimateId
        );

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
                  nickname: true,
                },
              },
            },
          },
        },
      });
    });

    it("견적이 존재하지 않을 때 null을 반환한다", async () => {
      // Arrange
      const estimateId = "nonexistent";

      mockEstimate.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateDetailForAction(
          estimateId
        );

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
        customerEstimateRequestRepository.getEstimateDetailForAction(estimateId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("AUTO_REJECTED된 견적들 조회 (액션 생성용)", () => {
    it("성공적으로 AUTO_REJECTED된 견적들을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";
      const mockAutoRejectedEstimates = [
        {
          id: "otherEstimate1",
          moverId: "mover456",
          status: "AUTO_REJECTED",
          isDesignated: false,
        },
        {
          id: "otherEstimate2",
          moverId: "mover789",
          status: "AUTO_REJECTED",
          isDesignated: true,
        },
      ];

      mockEstimate.findMany.mockResolvedValue(mockAutoRejectedEstimates);

      // Act
      const result =
        await customerEstimateRequestRepository.getAutoRejectedEstimates(
          estimateRequestId,
          excludeEstimateId
        );

      // Assert
      expect(result).toEqual(mockAutoRejectedEstimates);
      expect(mockEstimate.findMany).toHaveBeenCalledWith({
        where: {
          estimateRequestId: estimateRequestId,
          id: { not: excludeEstimateId },
          status: { in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"] },
        },
        select: {
          id: true,
          moverId: true,
          status: true,
          isDesignated: true,
        },
      });
    });

    it("AUTO_REJECTED된 견적이 없을 때 빈 배열을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";

      mockEstimate.findMany.mockResolvedValue([]);

      // Act
      const result =
        await customerEstimateRequestRepository.getAutoRejectedEstimates(
          estimateRequestId,
          excludeEstimateId
        );

      // Assert
      expect(result).toEqual([]);
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const excludeEstimateId = "estimate123";
      const mockError = new Error("Database error");

      mockEstimate.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getAutoRejectedEstimates(
          estimateRequestId,
          excludeEstimateId
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });
});
