import customerEstimateRequestService from "./customerEstimateRequest.service";
import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import { ServiceError, ServiceValidationError } from "../types/errors.types";
import { NotFoundError } from "../types/commonError.types";

// Repository 모킹
jest.mock("../repositories/customerEstimateRequest.repository");
const mockRepository = customerEstimateRequestRepository as jest.Mocked<
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
      const mockActiveEstimateRequestId = "estimateRequest123";
      const mockRawData = {
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

      mockRepository.getActiveEstimateRequest.mockResolvedValue(
        mockActiveEstimateRequestId
      );
      mockRepository.getPendingEstimateRequest.mockResolvedValue(mockRawData);

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequest(userId);

      // Assert
      expect(result).toEqual({
        estimateRequest: {
          id: mockRawData.id,
          customerId: mockRawData.customerId,
          moveType: mockRawData.moveType,
          moveDate: mockRawData.moveDate,
          createdAt: mockRawData.createdAt,
          description: mockRawData.description,
          status: mockRawData.status,
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
              ...mockRawData.estimates[0].mover,
              isFavorite: false,
              totalFavoriteCount: 5,
              Favorite: [],
            },
          },
        ],
      });
    });

    it("활성 견적요청이 없을 때 null estimateRequest를 반환한다", async () => {
      // Arrange
      const userId = "user123";

      mockRepository.getActiveEstimateRequest.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequest(userId);

      // Assert
      expect(result).toEqual({
        estimateRequest: null,
        estimates: [],
      });
    });

    it("잘못된 사용자 ID로 호출 시 ServiceValidationError를 던진다", async () => {
      // Arrange
      const invalidUserId = "";

      // Act & Assert
      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(invalidUserId)
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

      mockRepository.getReceivedEstimateRequests.mockResolvedValue(mockRawData);

      // Act
      const result =
        await customerEstimateRequestService.getReceivedEstimateRequests(
          userId
        );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        estimateRequest: {
          id: mockRawData[0].id,
          customerId: mockRawData[0].customerId,
          moveType: mockRawData[0].moveType,
          moveDate: mockRawData[0].moveDate,
          createdAt: mockRawData[0].createdAt,
          description: mockRawData[0].description,
          status: mockRawData[0].status,
          fromAddress: mockRawData[0].fromAddress,
          toAddress: mockRawData[0].toAddress,
        },
        estimates: [],
      });
    });

    it("완료된 견적요청이 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";

      mockRepository.getReceivedEstimateRequests.mockResolvedValue([]);

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
      const mockActiveEstimateRequestId = "estimateRequest123";
      const mockEstimate = {
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격",
        status: "PROPOSED",
        isDesignated: false,
        createdAt: new Date(),
      };
      const mockEstimateRequest = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date(),
        createdAt: new Date(),
        description: "이사 견적 요청",
        status: "PENDING",
      };
      const mockTransactionResult = {
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "user123",
          moveType: "HOME",
          moveDate: new Date(),
          createdAt: new Date(),
          description: "이사 견적 요청",
          status: "APPROVED",
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
        estimate: {
          id: "estimate123",
          estimateRequestId: "estimateRequest123",
          price: 500000,
          comment: "합리적인 가격",
          status: "ACCEPTED",
          isDesignated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockRepository.getActiveEstimateRequest.mockResolvedValue(
        mockActiveEstimateRequestId
      );
      mockRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockRepository.executeConfirmEstimateTransaction.mockResolvedValue(
        mockTransactionResult
      );

      // Act
      const result = await customerEstimateRequestService.confirmEstimate(
        userId,
        estimateId
      );

      // Assert
      expect(result).toEqual(mockTransactionResult);
    });

    it("진행중인 견적요청이 없을 때 ServiceError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";

      mockRepository.getActiveEstimateRequest.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(userId, estimateId)
      ).rejects.toThrow(ServiceError);
    });

    it("견적이 존재하지 않을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const userId = "user123";
      const estimateId = "estimate123";
      const mockActiveEstimateRequestId = "estimateRequest123";

      mockRepository.getActiveEstimateRequest.mockResolvedValue(
        mockActiveEstimateRequestId
      );
      mockRepository.getEstimateByIdAndRequestId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(userId, estimateId)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
