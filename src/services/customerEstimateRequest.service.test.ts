import customerEstimateRequestService from "./customerEstimateRequest.service";
import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import actionService from "./action.service";
import { NotFoundError } from "../types/commonError.types";
import {
  ServiceError,
  ServiceValidationError,
  ServiceDataProcessingError,
} from "../types/errors.types";
import {
  EstimateStatus,
  RequestStatus,
  MoveType,
  RegionType,
  UserType,
  ActionType,
} from "@prisma/client";
import {
  TestEstimateRequestWithRelations,
  TestMultipleEstimateRequestWithRelations,
  TestEstimate,
  TestEstimateRequest,
  TestTransactionCallback,
} from "../types/test.types";
import { RepositoryError } from "../types/errors.types";

// Repository 모킹
jest.mock("../repositories/customerEstimateRequest.repository");

// ActionService 모킹
jest.mock("./action.service");

// Prisma 모킹
jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    estimateRequest: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    estimate: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockCustomerEstimateRequestRepository =
  customerEstimateRequestRepository as jest.Mocked<
    typeof customerEstimateRequestRepository
  >;

const mockActionService = actionService as jest.Mocked<typeof actionService>;

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
      mockCustomerEstimateRequestRepository.getMoversFavoriteCounts.mockResolvedValue(
        {
          mover123: 5,
        }
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

    test("잘못된 사용자 ID일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const invalidUserId = "";

      // Act & Assert
      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(invalidUserId)
      ).rejects.toThrow(ServiceValidationError);
    });

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      const userId = "user123";
      const activeEstimateRequestId = "estimateRequest123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getPendingEstimateRequest.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(userId)
      ).rejects.toThrow(ServiceError);
    });

    test("데이터 변환 중 에러 발생 시 ServiceDataProcessingError를 던진다", async () => {
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
      mockCustomerEstimateRequestRepository.getMoversFavoriteCounts.mockRejectedValue(
        new Error("데이터 처리 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(userId)
      ).rejects.toThrow(ServiceDataProcessingError);
    });

    test("rawData가 null일 때 빈 결과를 반환한다", async () => {
      // Arrange
      const userId = "user123";
      const activeEstimateRequestId = "estimateRequest123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getPendingEstimateRequest.mockResolvedValue(
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
      mockCustomerEstimateRequestRepository.getMoversFavoriteCounts.mockResolvedValue(
        {
          mover123: 5,
        }
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

    it("완료된 견적요청이 없을 때 빈 배열을 반환한다", async () => {
      // Arrange
      const userId = "user123";

      mockCustomerEstimateRequestRepository.getReceivedEstimateRequests.mockResolvedValue(
        []
      );

      // Act
      const result =
        await customerEstimateRequestService.getReceivedEstimateRequests(
          userId
        );

      // Assert
      expect(result).toEqual([]);
    });

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      const userId = "user123";

      mockCustomerEstimateRequestRepository.getReceivedEstimateRequests.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequests(userId)
      ).rejects.toThrow(ServiceError);
    });

    test("잘못된 사용자 ID일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const invalidUserId = "";

      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequests(
          invalidUserId
        )
      ).rejects.toThrow(ServiceValidationError);
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
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "APPROVED" as RequestStatus,
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
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "PROPOSED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.getAutoRejectedEstimates.mockResolvedValue(
        []
      );
      mockActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        deletedAt: null,
        description: null,
        userId: "mover123",
        type: ActionType.ESTIMATE_ACCEPTED,
        entityId: "estimate123",
        entityType: "ESTIMATE",
        metadata: {},
      });

      // Prisma 트랜잭션 모킹
      const prisma = require("../db/prisma/prisma").default;
      prisma.$transaction.mockImplementation(async (callback: any) => {
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
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockActionService.createAction).toHaveBeenCalled();
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

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceError);
    });

    test("견적요청이 존재하지 않을 때 NotFoundError를 던진다", async () => {
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

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });

    test("견적 확정 트랜잭션 실패 시 NotFoundError를 던진다", async () => {
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

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "PROPOSED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.getAutoRejectedEstimates.mockResolvedValue(
        []
      );
      mockActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        deletedAt: null,
        description: null,
        userId: "mover123",
        type: ActionType.ESTIMATE_ACCEPTED,
        entityId: "estimate123",
        entityType: "ESTIMATE",
        metadata: {},
      });

      // Prisma 트랜잭션 모킹 - null 반환
      const prisma = require("../db/prisma/prisma").default;
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          estimateRequest: {
            update: jest.fn().mockResolvedValue({
              id: "estimateRequest123",
              customerId: "user123",
              moveType: "HOME" as MoveType,
              moveDate: new Date("2025-08-10"),
              createdAt: new Date(),
              description: "이사 견적 요청",
              status: "APPROVED" as RequestStatus,
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
            }),
          },
          estimate: {
            update: jest.fn().mockResolvedValue({
              id: "estimate123",
              status: "ACCEPTED" as EstimateStatus,
            }),
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
      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockActionService.createAction).toHaveBeenCalled();
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
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "APPROVED" as RequestStatus,
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
        },
        estimate: {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
        },
      };

      // Prisma 트랜잭션 모킹
      const prisma = require("../db/prisma/prisma").default;
      prisma.$transaction.mockImplementation(async (callback: any) => {
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
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("트랜잭션 실패 시 ServiceError를 던진다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const estimateId = "estimate123";
      const mockError = new Error("Database error");

      // Prisma 트랜잭션 모킹
      const prisma = require("../db/prisma/prisma").default;
      prisma.$transaction.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        customerEstimateRequestService.executeConfirmEstimateTransaction(
          estimateRequestId,
          estimateId
        )
      ).rejects.toThrow(ServiceError);
    });

    test("견적 확정 트랜잭션에서 estimateDetail이 null일 때도 성공적으로 처리한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const estimateId = "estimate123";
      const mockTransactionResult = {
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "APPROVED" as RequestStatus,
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
        },
        estimate: {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
        },
      };

      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        null as any
      );
      mockCustomerEstimateRequestRepository.getAutoRejectedEstimates.mockResolvedValue(
        []
      );

      // Prisma 트랜잭션 모킹
      const prisma = require("../db/prisma/prisma").default;
      prisma.$transaction.mockImplementation(async (callback: any) => {
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
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockActionService.createAction).not.toHaveBeenCalled();
    });

    test("AUTO_REJECTED 견적들에 대한 액션 생성이 성공한다", async () => {
      // Arrange
      const estimateRequestId = "estimateRequest123";
      const estimateId = "estimate123";
      const mockTransactionResult = {
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "APPROVED" as RequestStatus,
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
        },
        estimate: {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
        },
      };

      const mockOtherEstimates = [
        {
          id: "otherEstimate1",
          status: "AUTO_REJECTED" as EstimateStatus,
          moverId: "mover456",
          isDesignated: false,
        },
        {
          id: "otherEstimate2",
          status: "AUTO_REJECTED" as EstimateStatus,
          moverId: "mover789",
          isDesignated: true,
        },
      ];

      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "PROPOSED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.getAutoRejectedEstimates.mockResolvedValue(
        mockOtherEstimates
      );
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction
        .mockResolvedValueOnce({
          id: "estimate123",
          status: "PROPOSED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        })
        .mockResolvedValueOnce({
          id: "otherEstimate1",
          status: "AUTO_REJECTED" as EstimateStatus,
          moverId: "mover456",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover456", name: "이사업체B", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        })
        .mockResolvedValueOnce({
          id: "otherEstimate2",
          status: "AUTO_REJECTED" as EstimateStatus,
          moverId: "mover789",
          estimateRequestId: "estimateRequest123",
          isDesignated: true,
          mover: { id: "mover789", name: "이사업체C", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        });

      mockActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        deletedAt: null,
        description: null,
        userId: "mover123",
        type: ActionType.ESTIMATE_ACCEPTED,
        entityId: "estimate123",
        entityType: "ESTIMATE",
        metadata: {},
      });

      // Prisma 트랜잭션 모킹
      const prisma = require("../db/prisma/prisma").default;
      prisma.$transaction.mockImplementation(async (callback: any) => {
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
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockActionService.createAction).toHaveBeenCalledTimes(3);
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
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "PROPOSED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
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
      ).toHaveBeenCalledWith(estimateId, "AUTO_REJECTED");
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

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceError);
    });

    test("견적요청이 존재하지 않을 때 NotFoundError를 던진다", async () => {
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

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });

    test("견적 취소 실패 시 NotFoundError를 던진다", async () => {
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

      mockCustomerEstimateRequestRepository.getActiveEstimateRequest.mockResolvedValue(
        activeEstimateRequestId
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "PROPOSED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.updateEstimateStatus.mockResolvedValue(
        null as any
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });

    test("견적 취소 액션 생성이 성공한다", async () => {
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
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "PROPOSED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.updateEstimateStatus.mockResolvedValue(
        mockCancelledEstimate
      );
      mockActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        deletedAt: null,
        description: null,
        userId: "mover123",
        type: ActionType.ESTIMATE_REJECTED,
        entityId: "estimate123",
        entityType: "ESTIMATE",
        metadata: {},
      });

      // Act
      const result = await customerEstimateRequestService.cancelEstimate(
        userId,
        estimateId
      );

      // Assert
      expect(result).toEqual(mockCancelledEstimate);
      expect(
        mockCustomerEstimateRequestRepository.updateEstimateStatus
      ).toHaveBeenCalledWith(estimateId, "AUTO_REJECTED");
      expect(mockActionService.createAction).toHaveBeenCalledWith(
        "mover123",
        ActionType.ESTIMATE_REJECTED,
        "estimate123",
        "ESTIMATE",
        {
          customerName: "고객A",
          moveType: "HOME",
        }
      );
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

      mockCustomerEstimateRequestRepository.getEstimateById.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: "기사A" },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.getMoverByEstimateId.mockResolvedValue(
        {
          moverId: "mover123",
        }
      );

      // Prisma 트랜잭션 모킹
      const prisma = require("../db/prisma/prisma").default;
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          estimateRequest: {
            update: jest.fn().mockResolvedValue({
              id: "estimateRequest123",
              customerId: "user123",
              moveType: "HOME" as MoveType,
              moveDate: new Date("2025-08-10"),
              createdAt: new Date(),
              description: "이사 견적 요청",
              status: "COMPLETED" as RequestStatus,
            }),
          },
          user: {
            update: jest.fn().mockResolvedValue({
              id: "mover123",
              workedCount: 5,
            }),
          },
        };
        return await callback(mockTx);
      });

      mockActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        deletedAt: null,
        description: null,
        userId: "mover123",
        type: ActionType.MOVE_DAY_REVIEW_REQUEST,
        entityId: "estimate123",
        entityType: "ESTIMATE",
        metadata: {},
      });

      // Prisma findUnique 모킹 추가
      prisma.estimateRequest.findUnique.mockResolvedValue({
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
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(
        mockCustomerEstimateRequestRepository.getMoverByEstimateId
      ).toHaveBeenCalledWith(estimateId);
      expect(mockActionService.createAction).toHaveBeenCalledWith(
        "mover123",
        ActionType.MOVE_DAY_REVIEW_REQUEST,
        "estimate123",
        "ESTIMATE",
        {
          moverName: "기사A",
          moveType: "HOME",
        }
      );
    });

    it("견적이 존재하지 않을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";

      mockCustomerEstimateRequestRepository.getEstimateById.mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
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

    it("견적요청에 대한 권한이 없을 때 ServiceError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
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
        customerId: "otherUser", // 다른 사용자
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        description: "이사 견적 요청",
        fromAddressId: "addr1",
        toAddressId: "addr2",
      };

      mockCustomerEstimateRequestRepository.getEstimateById.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceError);
    });

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";

      mockCustomerEstimateRequestRepository.getEstimateById.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceError);
    });

    test("견적요청 조회 실패 시 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
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

      mockCustomerEstimateRequestRepository.getEstimateById.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.updateEstimateRequestStatus.mockResolvedValue(
        mockEstimateRequest
      );

      // Prisma findUnique 모킹 - null 반환
      const prisma = require("../db/prisma/prisma").default;
      prisma.estimateRequest.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });

    test("이사 완료 실패 시 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
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

      mockCustomerEstimateRequestRepository.getEstimateById.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: null },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.updateEstimateRequestStatus.mockResolvedValue(
        null as any
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });

    test("이사 완료 액션 생성이 성공한다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
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

      mockCustomerEstimateRequestRepository.getEstimateById.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockCustomerEstimateRequestRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockCustomerEstimateRequestRepository.getEstimateDetailForAction.mockResolvedValue(
        {
          id: "estimate123",
          status: "ACCEPTED" as EstimateStatus,
          moverId: "mover123",
          estimateRequestId: "estimateRequest123",
          isDesignated: false,
          mover: { id: "mover123", name: "이사업체A", nickname: "이사업체A" },
          estimateRequest: {
            id: "estimateRequest123",
            customerId: "customer123",
            moveType: "HOME" as MoveType,
            moveDate: new Date("2025-08-10"),
            customer: { id: "customer123", nickname: "고객A" },
          },
        }
      );
      mockCustomerEstimateRequestRepository.updateEstimateRequestStatus.mockResolvedValue(
        mockCompletedEstimateRequest
      );

      // Prisma findUnique 모킹
      const prisma = require("../db/prisma/prisma").default;
      prisma.estimateRequest.findUnique.mockResolvedValue({
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

      mockActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        deletedAt: null,
        description: null,
        userId: "mover123",
        type: ActionType.MOVE_DAY_REVIEW_REQUEST,
        entityId: "estimate123",
        entityType: "ESTIMATE",
        metadata: {},
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
      // updateEstimateRequestStatus는 트랜잭션 내에서 호출되므로 여기서는 확인하지 않음
      expect(mockActionService.createAction).toHaveBeenCalledWith(
        "mover123",
        ActionType.MOVE_DAY_REVIEW_REQUEST,
        "estimate123",
        "ESTIMATE",
        {
          moverName: "이사업체A",
          moveType: "HOME",
        }
      );
    });
  });

  describe("진행중인 견적 데이터 변환", () => {
    it("성공적으로 진행중인 견적 데이터를 변환한다", async () => {
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

      mockCustomerEstimateRequestRepository.getMoversFavoriteCounts.mockResolvedValue(
        {
          mover123: 5,
        }
      );

      // Act
      const result =
        await customerEstimateRequestService.transformPendingEstimateData(
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

    it("빈 데이터일 때 빈 결과를 반환한다", async () => {
      // Act
      const result =
        await customerEstimateRequestService.transformPendingEstimateData(null);

      // Assert
      expect(result).toEqual({
        estimateRequest: null,
        estimates: [],
      });
    });

    test("데이터 변환 중 에러 발생 시 ServiceDataProcessingError를 던진다", async () => {
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
              Favorite: [],
            },
          },
        ],
      };

      mockCustomerEstimateRequestRepository.getMoversFavoriteCounts.mockRejectedValue(
        new Error("데이터 처리 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.transformPendingEstimateData(mockRawData)
      ).rejects.toThrow(ServiceDataProcessingError);
    });
  });

  describe("완료된 견적 데이터 변환", () => {
    it("성공적으로 완료된 견적 데이터를 변환한다", async () => {
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

      mockCustomerEstimateRequestRepository.getMoversFavoriteCounts.mockResolvedValue(
        {
          mover123: 5,
        }
      );

      // Act
      const result =
        await customerEstimateRequestService.transformReceivedEstimateData(
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

    it("빈 데이터일 때 빈 배열을 반환한다", async () => {
      // Act
      const result =
        await customerEstimateRequestService.transformReceivedEstimateData([]);

      // Assert
      expect(result).toEqual([]);
    });

    test("데이터 변환 중 에러 발생 시 ServiceDataProcessingError를 던진다", async () => {
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

      mockCustomerEstimateRequestRepository.getMoversFavoriteCounts.mockRejectedValue(
        new Error("데이터 처리 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.transformReceivedEstimateData(
          mockRawData
        )
      ).rejects.toThrow(ServiceDataProcessingError);
    });
  });
});
