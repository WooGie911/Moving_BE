import customerEstimateRequestService from "./customerEstimateRequest.service";
import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import { NotFoundError } from "../types/commonError.types";
import { ServiceError, ServiceValidationError } from "../types/errors.types";
import {
  EstimateStatus,
  RequestStatus,
  MoveType,
  RegionType,
  UserType,
} from "@prisma/client";
import {
  TestEstimate,
  TestEstimateRequest,
  TestEstimateRequestWithRelations,
  TestMultipleEstimateRequestWithRelations,
  TestTransactionCallback,
} from "../types/test.types";

// Repository 모킹
jest.mock("../repositories/customerEstimateRequest.repository");

// PrismaClient 모킹
jest.mock("@prisma/client", () => {
  const mockEstimateRequest = {
    update: jest.fn(),
    findUnique: jest.fn(),
  };

  const mockEstimate = {
    update: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockTransaction = jest.fn();

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      estimateRequest: mockEstimateRequest,
      estimate: mockEstimate,
      $transaction: mockTransaction,
    })),
  };
});

const mockCustomerEstimateRequestRepository =
  customerEstimateRequestRepository as jest.Mocked<
    typeof customerEstimateRequestRepository
  >;

describe("고객 견적 요청 서비스", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("진행중인 견적 요청 조회", () => {
    it("성공적으로 진행중인 견적요청을 조회한다", async () => {
      // Arrange
      const userId = "user123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockRawData: TestEstimateRequestWithRelations = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        fromAddress: {
          zoneCode: "12345",
          city: "서울시",
          district: "강남구",
          detail: "123-456",
          region: "SEOUL" as RegionType,
        },
        toAddress: {
          zoneCode: "12346",
          city: "경기도",
          district: "성남시",
          detail: "789-012",
          region: "GYEONGGI" as RegionType,
        },
        estimates: [
          {
            id: "estimate1",
            price: 500000,
            comment: "합리적인 가격",
            status: "PROPOSED" as EstimateStatus,
            isDesignated: false,
            createdAt: new Date(),
            mover: {
              id: "mover123",
              name: "이사업체A",
              userType: ["MOVER"] as UserType[],
              moverImage: null,
              nickname: null,
              isVeteran: null,
              shortIntro: null,
              detailIntro: null,
              career: null,
              workedCount: null,
              averageRating: null,
              totalReviewCount: null,
              serviceTypes: ["HOME"] as MoveType[],
              serviceAreas: [
                {
                  id: "area1",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  deletedAt: null,
                  district: "강남구",
                  region: "SEOUL" as RegionType,
                  userId: "mover123",
                },
              ],
              totalFavoriteCount: 5,
              Favorite: [],
            },
          },
        ],
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getPendingEstimateRequest.mockResolvedValue(
        mockRawData
      );

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequest(userId);

      // Assert
      expect(result).toEqual({
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "user123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          createdAt: expect.any(Date),
          description: "이사 견적 요청",
          status: "PENDING",
          fromAddress: mockRawData.fromAddress,
          toAddress: mockRawData.toAddress,
        },
        estimates: [
          {
            id: "estimate1",
            price: 500000,
            comment: "합리적인 가격",
            status: "PROPOSED",
            isDesignated: false,
            createdAt: expect.any(Date),
            mover: {
              id: "mover123",
              name: "이사업체A",
              userType: ["MOVER"] as UserType[],
              moverImage: null,
              nickname: null,
              isVeteran: null,
              shortIntro: null,
              detailIntro: null,
              career: null,
              workedCount: null,
              averageRating: null,
              totalReviewCount: null,
              serviceTypes: ["HOME"] as MoveType[],
              serviceAreas: [
                {
                  id: "area1",
                  createdAt: expect.any(Date),
                  updatedAt: expect.any(Date),
                  deletedAt: null,
                  district: "강남구",
                  region: "SEOUL" as RegionType,
                  userId: "mover123",
                },
              ],
              totalFavoriteCount: 5,
              Favorite: [],
              isFavorite: false,
            },
          },
        ],
      });
    });

    it("활성 견적요청이 없을 때 빈 결과를 반환한다", async () => {
      // Arrange
      const userId = "user123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        null
      );

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequest(userId);

      // Assert
      expect(result).toEqual({
        estimateRequest: null,
        estimates: [],
      });
    });

    it("잘못된 사용자 ID일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const userId = "";

      // Act & Assert
      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(userId)
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("완료된 견적 요청 목록 조회", () => {
    it("성공적으로 완료된 견적요청 목록을 조회한다", async () => {
      // Arrange
      const userId = "user123";
      const mockRawData: TestMultipleEstimateRequestWithRelations = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "COMPLETED" as RequestStatus,
          fromAddress: {
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL" as RegionType,
          },
          toAddress: {
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI" as RegionType,
          },
          estimates: [
            {
              id: "estimate1",
              price: 500000,
              comment: "합리적인 가격",
              status: "ACCEPTED" as EstimateStatus,
              isDesignated: false,
              createdAt: new Date(),
              mover: {
                id: "mover123",
                name: "이사업체A",
                userType: ["MOVER"] as UserType[],
                moverImage: null,
                nickname: null,
                isVeteran: null,
                shortIntro: null,
                detailIntro: null,
                career: null,
                workedCount: null,
                averageRating: null,
                totalReviewCount: null,
                serviceTypes: ["HOME"] as MoveType[],
                serviceAreas: [
                  {
                    id: "area1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    district: "강남구",
                    region: "SEOUL" as RegionType,
                    userId: "mover123",
                  },
                ],
                totalFavoriteCount: 5,
                Favorite: [],
              },
            },
          ],
        },
      ];

      mockCustomerEstimateRequestRepository.getReceivedEstimateRequests.mockResolvedValue(
        mockRawData
      );

      // Act
      const result =
        await customerEstimateRequestService.getReceivedEstimateRequests(
          userId
        );

      // Assert
      expect(result).toEqual([
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "user123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            createdAt: expect.any(Date),
            description: "이사 견적 요청",
            status: "COMPLETED",
            fromAddress: mockRawData[0].fromAddress,
            toAddress: mockRawData[0].toAddress,
          },
          estimates: [
            {
              id: "estimate1",
              price: 500000,
              comment: "합리적인 가격",
              status: "ACCEPTED",
              isDesignated: false,
              createdAt: expect.any(Date),
              mover: {
                id: "mover123",
                name: "이사업체A",
                userType: ["MOVER"] as UserType[],
                moverImage: null,
                nickname: null,
                isVeteran: null,
                shortIntro: null,
                detailIntro: null,
                career: null,
                workedCount: null,
                averageRating: null,
                totalReviewCount: null,
                serviceTypes: ["HOME"] as MoveType[],
                serviceAreas: [
                  {
                    id: "area1",
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                    deletedAt: null,
                    district: "강남구",
                    region: "SEOUL" as RegionType,
                    userId: "mover123",
                  },
                ],
                totalFavoriteCount: 5,
                Favorite: [],
                isFavorite: false,
              },
            },
          ],
        },
      ]);
    });

    it("완료된 견적요청이 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";

      mockCustomerEstimateRequestRepository.getReceivedEstimateRequests.mockResolvedValue(
        []
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequests(userId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("견적 확정", () => {
    it("성공적으로 견적을 확정한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate: TestEstimate = {
        id: "estimate123",
        status: "PROPOSED" as EstimateStatus,
        price: 500000,
        comment: "합리적인 가격",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        rejectReason: null,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      };
      const mockEstimateRequest: TestEstimateRequest = {
        id: "estimateRequest123",
        status: "PENDING" as RequestStatus,
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: "이사 견적 요청",
        fromAddressId: "addr1",
        toAddressId: "addr2",
      };
      const mockTransactionResult = {
        estimateRequest: {
          id: "estimateRequest123",
          status: "APPROVED" as RequestStatus,
        },
        estimate: {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
        },
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Prisma 트랜잭션 모킹
      const { PrismaClient } = require("@prisma/client");
      const mockPrisma = new PrismaClient();
      mockPrisma.$transaction.mockImplementation(
        async (callback: TestTransactionCallback) => {
          const mockTx = {
            estimateRequest: {
              update: jest
                .fn()
                .mockResolvedValue(mockTransactionResult.estimateRequest),
            },
            estimate: {
              update: jest
                .fn()
                .mockResolvedValue(mockTransactionResult.estimate),
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          };
          return await callback(mockTx);
        }
      );

      // Act
      const result = await customerEstimateRequestService.confirmEstimate(
        userId,
        estimateId
      );

      // Assert
      expect(result).toEqual(mockTransactionResult);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("진행중인 견적요청이 없을 때 ServiceError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceError);
    });

    it("견적이 존재하지 않을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });

    it("이미 확정된 견적요청일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate: TestEstimate = {
        id: "estimate123",
        status: "PROPOSED" as EstimateStatus,
        price: 500000,
        comment: "합리적인 가격",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        rejectReason: null,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      };
      const mockEstimateRequest: TestEstimateRequest = {
        id: "estimateRequest123",
        status: "APPROVED" as RequestStatus,
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: "이사 견적 요청",
        fromAddressId: "addr1",
        toAddressId: "addr2",
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("견적 확정 트랜잭션 실행", () => {
    it("성공적으로 견적 확정 트랜잭션을 실행한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const estimateId = "estimate123";
      const mockTransactionResult = {
        estimateRequest: {
          id: "estimateRequest123",
          status: "APPROVED" as RequestStatus,
        },
        estimate: {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
        },
      };

      // Prisma 트랜잭션 모킹
      const { PrismaClient } = require("@prisma/client");
      const mockPrisma = new PrismaClient();
      mockPrisma.$transaction.mockImplementation(
        async (callback: TestTransactionCallback) => {
          const mockTx = {
            estimateRequest: {
              update: jest
                .fn()
                .mockResolvedValue(mockTransactionResult.estimateRequest),
            },
            estimate: {
              update: jest
                .fn()
                .mockResolvedValue(mockTransactionResult.estimate),
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          };
          return await callback(mockTx);
        }
      );

      // Act
      const result =
        await customerEstimateRequestService.executeConfirmEstimateTransaction(
          estimateRequestId,
          estimateId
        );

      // Assert
      expect(result).toEqual(mockTransactionResult);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("트랜잭션 실패 시 ServiceError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const estimateId = "estimate123";
      const mockError = new Error("Database error");

      // Prisma 트랜잭션 모킹
      const { PrismaClient } = require("@prisma/client");
      const mockPrisma = new PrismaClient();
      mockPrisma.$transaction.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestService.executeConfirmEstimateTransaction(
          estimateRequestId,
          estimateId
        )
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("견적 취소", () => {
    it("성공적으로 견적을 취소한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate: TestEstimate = {
        id: "estimate123",
        status: "PROPOSED" as EstimateStatus,
        price: 500000,
        comment: "합리적인 가격",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        rejectReason: null,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      };
      const mockEstimateRequest: TestEstimateRequest = {
        id: "estimateRequest123",
        status: "PENDING" as RequestStatus,
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: "이사 견적 요청",
        fromAddressId: "addr1",
        toAddressId: "addr2",
      };
      const mockCancelledEstimate: TestEstimate = {
        id: "estimate123",
        status: "REJECTED" as EstimateStatus,
        price: 500000,
        comment: "합리적인 가격",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        rejectReason: null,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockCustomerEstimateRequestRepository.updateEstimateStatus.mockResolvedValue(
        mockCancelledEstimate
      );

      // Act
      const result = await customerEstimateRequestService.cancelEstimate(
        userId,
        estimateId
      );

      // Assert
      expect(result).toEqual(mockCancelledEstimate);
      expect(
        mockCustomerEstimateRequestRepository.updateEstimateStatus
      ).toHaveBeenCalledWith(estimateId, "REJECTED");
    });

    it("진행중인 견적요청이 없을 때 ServiceError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceError);
    });

    it("견적이 존재하지 않을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });

    it("이미 확정된 견적요청일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate: TestEstimate = {
        id: "estimate123",
        status: "PROPOSED" as EstimateStatus,
        price: 500000,
        comment: "합리적인 가격",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        rejectReason: null,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      };
      const mockEstimateRequest: TestEstimateRequest = {
        id: "estimateRequest123",
        status: "APPROVED" as RequestStatus,
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: "이사 견적 요청",
        fromAddressId: "addr1",
        toAddressId: "addr2",
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("이사 완료", () => {
    it("성공적으로 이사를 완료한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate: TestEstimate = {
        id: "estimate123",
        status: "ACCEPTED" as EstimateStatus,
        price: 500000,
        comment: "합리적인 가격",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        rejectReason: null,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      };
      const mockEstimateRequest: TestEstimateRequest = {
        id: "estimateRequest123",
        status: "APPROVED" as RequestStatus,
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: "이사 견적 요청",
        fromAddressId: "addr1",
        toAddressId: "addr2",
      };
      const mockCompletedEstimateRequest: TestEstimateRequest = {
        id: "estimateRequest123",
        status: "COMPLETED" as RequestStatus,
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: "이사 견적 요청",
        fromAddressId: "addr1",
        toAddressId: "addr2",
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockCustomerEstimateRequestRepository.updateEstimateRequestStatus.mockResolvedValue(
        mockCompletedEstimateRequest
      );

      // Prisma findUnique 모킹 추가
      const { PrismaClient } = require("@prisma/client");
      const mockPrisma = new PrismaClient();
      mockPrisma.estimateRequest.findUnique.mockResolvedValue({
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "SMALL",
        moveDate: new Date("2025-07-10T00:33:16.456Z"),
        createdAt: new Date("2025-07-10T00:33:16.456Z"),
        description: "이사 요청 설명",
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
      });

      // Act
      const result = await customerEstimateRequestService.completeEstimate(
        userId,
        estimateId
      );

      // Assert
      expect(result).toEqual({
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "user123",
          moveType: "SMALL",
          moveDate: new Date("2025-07-10T00:33:16.456Z"),
          createdAt: new Date("2025-07-10T00:33:16.456Z"),
          description: "이사 요청 설명",
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
        },
      });
      expect(
        mockCustomerEstimateRequestRepository.updateEstimateRequestStatus
      ).toHaveBeenCalledWith(activeEstimateRequestId, "COMPLETED");
    });

    it("진행중인 견적요청이 없을 때 ServiceError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceError);
    });

    it("견적이 존재하지 않을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });

    it("확정되지 않은 견적요청일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate: TestEstimate = {
        id: "estimate123",
        status: "ACCEPTED" as EstimateStatus,
        price: 500000,
        comment: "합리적인 가격",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        rejectReason: null,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      };
      const mockEstimateRequest: TestEstimateRequest = {
        id: "estimateRequest123",
        status: "PENDING" as RequestStatus,
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: "이사 견적 요청",
        fromAddressId: "addr1",
        toAddressId: "addr2",
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("진행중인 견적 데이터 변환", () => {
    it("성공적으로 진행중인 견적 데이터를 변환한다", () => {
      // Arrange
      const mockRawData: TestEstimateRequestWithRelations = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        fromAddress: {
          zoneCode: "12345",
          city: "서울시",
          district: "강남구",
          detail: "123-456",
          region: "SEOUL" as RegionType,
        },
        toAddress: {
          zoneCode: "12346",
          city: "경기도",
          district: "성남시",
          detail: "789-012",
          region: "GYEONGGI" as RegionType,
        },
        estimates: [
          {
            id: "estimate1",
            price: 500000,
            comment: "합리적인 가격",
            status: "PROPOSED" as EstimateStatus,
            isDesignated: false,
            createdAt: new Date(),
            mover: {
              id: "mover123",
              name: "이사업체A",
              userType: ["MOVER"] as UserType[],
              moverImage: null,
              nickname: null,
              isVeteran: null,
              shortIntro: null,
              detailIntro: null,
              career: null,
              workedCount: null,
              averageRating: null,
              totalReviewCount: null,
              serviceTypes: ["HOME"] as MoveType[],
              serviceAreas: [
                {
                  id: "area1",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  deletedAt: null,
                  district: "강남구",
                  region: "SEOUL" as RegionType,
                  userId: "mover123",
                },
              ],
              totalFavoriteCount: 5,
              Favorite: [{ id: "favorite1" }],
            },
          },
        ],
      };

      // Act
      const result =
        customerEstimateRequestService.transformPendingEstimateData(
          mockRawData
        );

      // Assert
      expect(result).toEqual({
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "user123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          createdAt: expect.any(Date),
          description: "이사 견적 요청",
          status: "PENDING",
          fromAddress: mockRawData.fromAddress,
          toAddress: mockRawData.toAddress,
        },
        estimates: [
          {
            id: "estimate1",
            price: 500000,
            comment: "합리적인 가격",
            status: "PROPOSED",
            isDesignated: false,
            createdAt: expect.any(Date),
            mover: {
              id: "mover123",
              name: "이사업체A",
              userType: ["MOVER"] as UserType[],
              moverImage: null,
              nickname: null,
              isVeteran: null,
              shortIntro: null,
              detailIntro: null,
              career: null,
              workedCount: null,
              averageRating: null,
              totalReviewCount: null,
              serviceTypes: ["HOME"] as MoveType[],
              serviceAreas: [
                {
                  id: "area1",
                  createdAt: expect.any(Date),
                  updatedAt: expect.any(Date),
                  deletedAt: null,
                  district: "강남구",
                  region: "SEOUL" as RegionType,
                  userId: "mover123",
                },
              ],
              totalFavoriteCount: 5,
              Favorite: [{ id: "favorite1" }],
              isFavorite: true,
            },
          },
        ],
      });
    });

    it("빈 데이터일 때 빈 결과를 반환한다", () => {
      // Act
      const result =
        customerEstimateRequestService.transformPendingEstimateData(null);

      // Assert
      expect(result).toEqual({
        estimateRequest: null,
        estimates: [],
      });
    });
  });

  describe("완료된 견적 데이터 변환", () => {
    it("성공적으로 완료된 견적 데이터를 변환한다", () => {
      // Arrange
      const mockRawData: TestMultipleEstimateRequestWithRelations = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "COMPLETED" as RequestStatus,
          fromAddress: {
            zoneCode: "12345",
            city: "서울시",
            district: "강남구",
            detail: "123-456",
            region: "SEOUL" as RegionType,
          },
          toAddress: {
            zoneCode: "12346",
            city: "경기도",
            district: "성남시",
            detail: "789-012",
            region: "GYEONGGI" as RegionType,
          },
          estimates: [
            {
              id: "estimate1",
              price: 500000,
              comment: "합리적인 가격",
              status: "ACCEPTED" as EstimateStatus,
              isDesignated: false,
              createdAt: new Date(),
              mover: {
                id: "mover123",
                name: "이사업체A",
                userType: ["MOVER"] as UserType[],
                moverImage: null,
                nickname: null,
                isVeteran: null,
                shortIntro: null,
                detailIntro: null,
                career: null,
                workedCount: null,
                averageRating: null,
                totalReviewCount: null,
                serviceTypes: ["HOME"] as MoveType[],
                serviceAreas: [],
                totalFavoriteCount: 5,
                Favorite: [],
              },
            },
          ],
        },
      ];

      // Act
      const result =
        customerEstimateRequestService.transformReceivedEstimateData(
          mockRawData
        );

      // Assert
      expect(result).toEqual([
        {
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "user123",
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            createdAt: expect.any(Date),
            description: "이사 견적 요청",
            status: "COMPLETED",
            fromAddress: mockRawData[0].fromAddress,
            toAddress: mockRawData[0].toAddress,
          },
          estimates: [
            {
              id: "estimate1",
              price: 500000,
              comment: "합리적인 가격",
              status: "ACCEPTED",
              isDesignated: false,
              createdAt: expect.any(Date),
              mover: {
                id: "mover123",
                name: "이사업체A",
                userType: ["MOVER"] as UserType[],
                moverImage: null,
                nickname: null,
                isVeteran: null,
                shortIntro: null,
                detailIntro: null,
                career: null,
                workedCount: null,
                averageRating: null,
                totalReviewCount: null,
                serviceTypes: ["HOME"] as MoveType[],
                serviceAreas: [],
                totalFavoriteCount: 5,
                Favorite: [],
                isFavorite: false,
              },
            },
          ],
        },
      ]);
    });

    it("빈 데이터일 때 빈 배열을 반환한다", () => {
      // Act
      const result =
        customerEstimateRequestService.transformReceivedEstimateData([]);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
