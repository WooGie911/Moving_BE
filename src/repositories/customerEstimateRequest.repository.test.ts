import customerEstimateRequestRepository from "./customerEstimateRequest.repository";
import { RepositoryQueryError } from "../types/errors.types";
import { RequestStatus, EstimateStatus } from "@prisma/client";

// PrismaClient 모킹 - 호이스팅 문제 해결
jest.mock("@prisma/client", () => {
  const mockEstimateRequest = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockEstimate = {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      estimateRequest: mockEstimateRequest,
      user: mockUser,
      estimate: mockEstimate,
    })),
  };
});

// 모킹된 객체들을 가져오기
const { PrismaClient } = require("@prisma/client");
const mockPrisma = new PrismaClient();
const mockEstimateRequest = mockPrisma.estimateRequest;
const mockUser = mockPrisma.user;
const mockEstimate = mockPrisma.estimate;

describe("customerEstimateRequestRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getActiveEstimateRequest", () => {
    it("성공적으로 활성 견적 요청 ID를 조회한다", async () => {
      // Arrange
      const userId = "user123";
      const mockEstimateRequestData = {
        id: "estimateRequest123",
      };

      mockEstimateRequest.findFirst.mockResolvedValue(mockEstimateRequestData);

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
        },
        select: {
          id: true,
        },
      });
    });

    it("활성 견적 요청이 없을 때 null을 반환한다", async () => {
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

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const mockError = new Error("Database error");

      mockEstimateRequest.findFirst.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getActiveEstimateRequest(userId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("getMover", () => {
    it("성공적으로 이사업체를 조회한다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockMover = {
        id: "mover123",
        name: "김이사",
        email: "kim@example.com",
        userType: ["MOVER"],
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const moverId = "nonexistent";

      mockUser.findUnique.mockResolvedValue(null);

      // Act
      const result = await customerEstimateRequestRepository.getMover(moverId);

      // Assert
      expect(result).toBeNull();
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const moverId = "mover123";
      const mockError = new Error("Database error");

      mockUser.findUnique.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getMover(moverId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("getPendingEstimateRequest", () => {
    it("성공적으로 진행중인 견적 요청을 조회한다", async () => {
      // Arrange
      const activeEstimateRequestId = "estimateRequest123";
      const userId = "user123";
      const mockEstimateRequestData = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date("2025-08-10"),
        createdAt: new Date("2025-07-30"),
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
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
            status: "PROPOSED" as EstimateStatus,
            isDesignated: false,
            createdAt: new Date("2025-07-31"),
            mover: {
              id: "mover1",
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
              totalFavoriteCount: 10,
              Favorite: [{ id: "favorite1" }],
            },
          },
        ],
      };

      mockEstimateRequest.findFirst.mockResolvedValue(mockEstimateRequestData);

      // Act
      const result =
        await customerEstimateRequestRepository.getPendingEstimateRequest(
          activeEstimateRequestId,
          userId
        );

      // Assert
      expect(result).toEqual(mockEstimateRequestData);
      expect(mockEstimateRequest.findFirst).toHaveBeenCalledWith({
        where: {
          id: activeEstimateRequestId,
          status: { in: ["PENDING", "APPROVED"] },
          deletedAt: null,
        },
        orderBy: { moveDate: "asc" },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          createdAt: true,
          description: true,
          status: true,
          fromAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          toAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          estimates: {
            where: {
              price: {
                not: null,
              },
              status: {
                in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"],
              },
            },
            select: {
              id: true,
              price: true,
              comment: true,
              status: true,
              isDesignated: true,
              createdAt: true,
              mover: {
                select: {
                  id: true,
                  name: true,
                  userType: true,
                  moverImage: true,
                  nickname: true,
                  isVeteran: true,
                  shortIntro: true,
                  detailIntro: true,
                  career: true,
                  workedCount: true,
                  averageRating: true,
                  totalReviewCount: true,
                  serviceTypes: true,
                  serviceAreas: true,
                  totalFavoriteCount: true,
                  Favorite: {
                    where: {
                      customerId: userId,
                      deletedAt: null,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const activeEstimateRequestId = "estimateRequest123";
      const userId = "user123";
      const mockError = new Error("Database error");

      mockEstimateRequest.findFirst.mockRejectedValue(mockError);

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
    it("성공적으로 완료된 견적 요청 목록을 조회한다", async () => {
      // Arrange
      const userId = "user123";
      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME",
          moveDate: new Date("2024-01-15"),
          createdAt: new Date("2024-01-10"),
          description: "이사 견적 요청",
          status: "COMPLETED" as RequestStatus,
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
              status: "ACCEPTED" as EstimateStatus,
              isDesignated: true,
              createdAt: new Date("2024-01-11"),
              mover: {
                id: "mover1",
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
                totalFavoriteCount: 10,
                Favorite: [{ id: "favorite1" }],
              },
            },
          ],
        },
      ];

      mockEstimateRequest.findMany.mockResolvedValue(mockEstimateRequests);

      // Act
      const result =
        await customerEstimateRequestRepository.getReceivedEstimateRequests(
          userId
        );

      // Assert
      expect(result).toEqual(mockEstimateRequests);
      expect(mockEstimateRequest.findMany).toHaveBeenCalledWith({
        where: {
          customerId: userId,
          status: { in: ["EXPIRED", "COMPLETED", "COMPLETED"] },
        },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          createdAt: true,
          description: true,
          status: true,
          fromAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          toAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          estimates: {
            where: {
              price: {
                not: null,
              },
              status: {
                in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"],
              },
            },
            select: {
              id: true,
              price: true,
              comment: true,
              status: true,
              isDesignated: true,
              createdAt: true,
              mover: {
                select: {
                  id: true,
                  name: true,
                  userType: true,
                  moverImage: true,
                  nickname: true,
                  isVeteran: true,
                  shortIntro: true,
                  detailIntro: true,
                  career: true,
                  workedCount: true,
                  averageRating: true,
                  totalReviewCount: true,
                  serviceTypes: true,
                  serviceAreas: true,
                  totalFavoriteCount: true,
                  Favorite: {
                    where: {
                      customerId: userId,
                      deletedAt: null,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const mockError = new Error("Database error");

      mockEstimateRequest.findMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.getReceivedEstimateRequests(userId)
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("getEstimateRequestById", () => {
    it("성공적으로 견적 요청을 조회한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const mockEstimateRequestData = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date("2025-08-10"),
        createdAt: new Date("2025-07-30"),
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        updatedAt: new Date("2025-07-30"),
        deletedAt: null,
        fromAddressId: "addr1",
        toAddressId: "addr2",
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

    it("견적 요청이 없을 때 null을 반환한다", async () => {
      // Arrange
      const estimateRequestId = "nonexistent";

      mockEstimateRequest.findUnique.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestRepository.getEstimateRequestById(
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
        customerEstimateRequestRepository.getEstimateRequestById(
          estimateRequestId
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });

  describe("getEstimateByIdAndRequestId", () => {
    it("성공적으로 견적을 조회한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const estimateRequestId = "estimateRequest123";
      const mockEstimateData = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
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
      const estimateId = "nonexistent";
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

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const estimateRequestId = "estimateRequest123";
      const mockError = new Error("Database error");

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

  describe("updateEstimateRequestStatus", () => {
    it("성공적으로 견적 요청 상태를 업데이트한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "APPROVED";
      const mockUpdatedEstimateRequest = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date("2025-08-10"),
        createdAt: new Date("2025-07-30"),
        description: "이사 견적 요청",
        status: "APPROVED" as RequestStatus,
        updatedAt: new Date("2025-07-30"),
        deletedAt: null,
        fromAddressId: "addr1",
        toAddressId: "addr2",
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

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "APPROVED";
      const mockError = new Error("Database error");

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

  describe("updateEstimateStatus", () => {
    it("성공적으로 견적 상태를 업데이트한다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "ACCEPTED" as EstimateStatus;
      const mockUpdatedEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격",
        status: "ACCEPTED" as EstimateStatus,
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

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateId = "estimate123";
      const status = "ACCEPTED" as EstimateStatus;
      const mockError = new Error("Database error");

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

  describe("updateAllEstimatesStatus", () => {
    it("성공적으로 모든 견적 상태를 일괄 업데이트한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "REJECTED" as EstimateStatus;

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

    it("특정 견적을 제외하고 모든 견적 상태를 일괄 업데이트한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "REJECTED" as EstimateStatus;
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

    it("데이터베이스 에러 발생 시 RepositoryQueryError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const status = "REJECTED" as EstimateStatus;
      const mockError = new Error("Database error");

      mockEstimate.updateMany.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestRepository.updateAllEstimatesStatus(
          estimateRequestId,
          status
        )
      ).rejects.toThrow(RepositoryQueryError);
    });
  });
});
