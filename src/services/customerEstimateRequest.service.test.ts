import customerEstimateRequestService from "./customerEstimateRequest.service";
import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  ServiceError,
  ServiceValidationError,
  ServiceDataProcessingError,
} from "../types/errors.types";
import { EstimateStatus, RequestStatus, MoveType } from "@prisma/client";

// Repository 모킹
jest.mock("../repositories/customerEstimateRequest.repository");

// PrismaClient 모킹
jest.mock("@prisma/client", () => {
  const mockEstimateRequest = {
    update: jest.fn(),
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

describe("customerEstimateRequestService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPendingEstimateRequest", () => {
    it("성공적으로 진행중인 견적요청을 조회한다", async () => {
      // Arrange
      const userId = "user123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockRawData = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
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
        mockRawData as any
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

  describe("getReceivedEstimateRequests", () => {
    it("성공적으로 완료된 견적요청 목록을 조회한다", async () => {
      // Arrange
      const userId = "user123";
      const mockRawData = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "COMPLETED" as RequestStatus,
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
                totalFavoriteCount: 5,
                Favorite: [],
              },
            },
          ],
        },
      ];

      mockCustomerEstimateRequestRepository.getReceivedEstimateRequests.mockResolvedValue(
        mockRawData as any
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

  describe("confirmEstimate", () => {
    it("성공적으로 견적을 확정한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate = {
        id: "estimate123",
        status: "PROPOSED" as EstimateStatus,
      };
      const mockEstimateRequest = {
        id: "estimateRequest123",
        status: "PENDING" as RequestStatus,
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
        mockEstimate as any
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest as any
      );

      // Prisma 트랜잭션 모킹
      const { PrismaClient } = require("@prisma/client");
      const mockPrisma = new PrismaClient();
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          estimateRequest: {
            update: jest
              .fn()
              .mockResolvedValue(mockTransactionResult.estimateRequest),
          },
          estimate: {
            update: jest.fn().mockResolvedValue(mockTransactionResult.estimate),
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(mockTx);
      });

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
      const mockEstimate = {
        id: "estimate123",
        status: "PROPOSED" as EstimateStatus,
      };
      const mockEstimateRequest = {
        id: "estimateRequest123",
        status: "APPROVED" as RequestStatus,
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate as any
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest as any
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("executeConfirmEstimateTransaction", () => {
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
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          estimateRequest: {
            update: jest
              .fn()
              .mockResolvedValue(mockTransactionResult.estimateRequest),
          },
          estimate: {
            update: jest.fn().mockResolvedValue(mockTransactionResult.estimate),
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(mockTx);
      });

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

  describe("cancelEstimate", () => {
    it("성공적으로 견적을 취소한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate = {
        id: "estimate123",
        status: "PROPOSED" as EstimateStatus,
      };
      const mockEstimateRequest = {
        id: "estimateRequest123",
        status: "PENDING" as RequestStatus,
      };
      const mockCancelledEstimate = {
        id: "estimate123",
        status: "REJECTED" as EstimateStatus,
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate as any
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest as any
      );
      mockCustomerEstimateRequestRepository.updateEstimateStatus.mockResolvedValue(
        mockCancelledEstimate as any
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
      const mockEstimate = {
        id: "estimate123",
        status: "PROPOSED" as EstimateStatus,
      };
      const mockEstimateRequest = {
        id: "estimateRequest123",
        status: "APPROVED" as RequestStatus,
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate as any
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest as any
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("completeEstimate", () => {
    it("성공적으로 이사를 완료한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const activeEstimateRequestId = "estimateRequest123";
      const mockEstimate = {
        id: "estimate123",
        status: "ACCEPTED" as EstimateStatus,
      };
      const mockEstimateRequest = {
        id: "estimateRequest123",
        status: "APPROVED" as RequestStatus,
      };
      const mockCompletedEstimateRequest = {
        id: "estimateRequest123",
        status: "COMPLETED" as RequestStatus,
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate as any
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest as any
      );
      mockCustomerEstimateRequestRepository.updateEstimateRequestStatus.mockResolvedValue(
        mockCompletedEstimateRequest as any
      );

      // Act
      const result = await customerEstimateRequestService.completeEstimate(
        userId,
        estimateId
      );

      // Assert
      expect(result).toEqual({ estimateRequest: mockCompletedEstimateRequest });
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
      const mockEstimate = {
        id: "estimate123",
        status: "ACCEPTED" as EstimateStatus,
      };
      const mockEstimateRequest = {
        id: "estimateRequest123",
        status: "PENDING" as RequestStatus,
      };

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate as any
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest as any
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("transformPendingEstimateData", () => {
    it("성공적으로 진행중인 견적 데이터를 변환한다", () => {
      // Arrange
      const mockRawData = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
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
              totalFavoriteCount: 5,
              Favorite: [{ id: "favorite1" }],
            },
          },
        ],
      };

      // Act
      const result =
        customerEstimateRequestService.transformPendingEstimateData(
          mockRawData as any
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
        customerEstimateRequestService.transformPendingEstimateData(
          null as any
        );

      // Assert
      expect(result).toEqual({
        estimateRequest: null,
        estimates: [],
      });
    });
  });

  describe("transformReceivedEstimateData", () => {
    it("성공적으로 완료된 견적 데이터를 변환한다", () => {
      // Arrange
      const mockRawData = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "COMPLETED" as RequestStatus,
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
          mockRawData as any
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
        customerEstimateRequestService.transformReceivedEstimateData(
          null as any
        );

      // Assert
      expect(result).toEqual([]);
    });
  });
});
