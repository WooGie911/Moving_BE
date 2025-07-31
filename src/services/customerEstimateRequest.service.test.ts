import customerEstimateRequestService from "./customerEstimateRequest.service";
import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  ServiceError,
  ServiceValidationError,
  ServiceDataProcessingError,
  RepositoryError,
  ErrorCode,
} from "../types/errors.types";
import {
  RequestStatus,
  EstimateStatus,
  RegionType,
  MoveType,
  UserType,
} from "../types/user.types";
import {
  SingleEstimateRequestWithRelations,
  MultipleEstimateRequestWithRelations,
} from "../types/repository.types";

// 레포지토리 모킹
jest.mock("../repositories/customerEstimateRequest.repository");
const mockedRepository = customerEstimateRequestRepository as jest.Mocked<
  typeof customerEstimateRequestRepository
>;

describe("customerEstimateRequestService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("현재 진행중인 견적요청을 조회한다", () => {
    const mockUserId = "user123";

    it("성공적으로 진행중인 견적요청을 조회한다", async () => {
      // Arrange
      const mockActiveEstimateRequestId = "estimateRequest123";
      const mockRawData: SingleEstimateRequestWithRelations = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2025-08-10"),
        createdAt: new Date("2024-07-30"),
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        fromAddress: {
          zoneCode: "12345",
          city: "서울특별시",
          district: "강남구",
          detail: "상세주소",
          region: "SEOUL" as RegionType,
        },
        toAddress: {
          zoneCode: "12346",
          city: "서울특별시",
          district: "서초구",
          detail: "상세주소",
          region: "SEOUL" as RegionType,
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
              userType: ["MOVER"] as UserType[],
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

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockActiveEstimateRequestId
      );
      mockedRepository.getPendingEstimateRequest.mockResolvedValue(mockRawData);

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequest(
          mockUserId
        );

      // Assert
      expect(result).toStrictEqual({
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "user123",
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          createdAt: new Date("2024-07-30"),
          description: "이사 견적 요청",
          status: "PENDING",
          fromAddress: {
            zoneCode: "12345",
            city: "서울특별시",
            district: "강남구",
            detail: "상세주소",
            region: "SEOUL",
          },
          toAddress: {
            zoneCode: "12346",
            city: "서울특별시",
            district: "서초구",
            detail: "상세주소",
            region: "SEOUL",
          },
        },
        estimates: [
          {
            id: "estimate1",
            price: 500000,
            comment: "합리적인 가격",
            status: "PROPOSED",
            isDesignated: false,
            createdAt: new Date("2025-07-31"),
            mover: {
              id: "mover1",
              name: "이사업체A",
              userType: ["MOVER"] as UserType[],
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
              isFavorite: true,
            },
          },
        ],
      });
    });

    it("활성 견적요청이 없을 때 빈 결과를 반환한다", async () => {
      // Arrange
      mockedRepository.getActiveEstimateRequest.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequest(
          mockUserId
        );

      // Assert
      expect(result).toEqual({
        estimateRequest: null,
        estimates: [],
      });
    });

    it("데이터가 없을 때 빈 결과를 반환한다", async () => {
      // Arrange
      const mockActiveEstimateRequestId = "estimateRequest123";
      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockActiveEstimateRequestId
      );
      mockedRepository.getPendingEstimateRequest.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequest(
          mockUserId
        );

      // Assert
      expect(result).toEqual({
        estimateRequest: null,
        estimates: [],
      });
    });

    it("잘못된 사용자 ID로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        customerEstimateRequestService.getPendingEstimateRequest("")
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(null!)
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(123 as never)
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(undefined!)
      ).rejects.toThrow(ServiceValidationError);
    });

    it("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      mockedRepository.getActiveEstimateRequest.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.getPendingEstimateRequest(mockUserId)
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("레포지토리에서 받은 데이터를 변환한다", () => {
    it("정상적으로 데이터를 변환한다", () => {
      // Arrange
      const mockRawData: SingleEstimateRequestWithRelations = {
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        createdAt: new Date("2024-01-10"),
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        fromAddress: {
          zoneCode: "12345",
          city: "서울특별시",
          district: "강남구",
          detail: "상세주소",
          region: "SEOUL" as RegionType,
        },
        toAddress: {
          zoneCode: "12346",
          city: "서울특별시",
          district: "서초구",
          detail: "상세주소",
          region: "SEOUL" as RegionType,
        },
        estimates: [
          {
            id: "estimate1",
            price: 500000,
            comment: "합리적인 가격",
            status: "PROPOSED" as EstimateStatus,
            isDesignated: false,
            createdAt: new Date("2024-01-11"),
            mover: {
              id: "mover1",
              name: "이사업체A",
              userType: ["MOVER"] as UserType[],
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

      // Act
      const result =
        customerEstimateRequestService.transformPendingEstimateData(
          mockRawData
        );

      // Assert
      expect(result.estimateRequest).toEqual({
        id: "estimateRequest123",
        customerId: "user123",
        moveType: "HOME",
        moveDate: new Date("2024-01-15"),
        createdAt: new Date("2024-01-10"),
        description: "이사 견적 요청",
        status: "PENDING",
        fromAddress: {
          zoneCode: "12345",
          city: "서울특별시",
          district: "강남구",
          detail: "상세주소",
          region: "SEOUL",
        },
        toAddress: {
          zoneCode: "12346",
          city: "서울특별시",
          district: "서초구",
          detail: "상세주소",
          region: "SEOUL",
        },
      });
      expect(result.estimates).toHaveLength(1);
      expect(result.estimates[0].mover.isFavorite).toBe(true);
    });

    it("null 데이터에 대해 빈 결과를 반환한다", () => {
      // Act
      const result =
        customerEstimateRequestService.transformPendingEstimateData(
          null as unknown as SingleEstimateRequestWithRelations
        );

      // Assert
      expect(result).toEqual({
        estimateRequest: null,
        estimates: [],
      });
    });

    it("에러 발생 시 ServiceDataProcessingError를 던진다", () => {
      // Arrange
      const invalidData = {
        estimates: [
          {
            mover: null, // 잘못된 데이터
          },
        ],
      };

      // Act & Assert
      expect(() =>
        customerEstimateRequestService.transformPendingEstimateData(
          invalidData as unknown as SingleEstimateRequestWithRelations
        )
      ).toThrow(ServiceDataProcessingError);
    });
  });

  describe("이미 완료한 이사견적요청을 조회한다", () => {
    const mockUserId = "user123";

    it("성공적으로 완료된 견적요청 목록을 조회한다", async () => {
      // Arrange
      const mockRawData: MultipleEstimateRequestWithRelations = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2024-01-15"),
          createdAt: new Date("2024-01-10"),
          description: "이사 견적 요청",
          status: "COMPLETED" as RequestStatus,
          fromAddress: {
            zoneCode: "12345",
            city: "서울특별시",
            district: "강남구",
            detail: "상세주소",
            region: "SEOUL" as RegionType,
          },
          toAddress: {
            zoneCode: "12346",
            city: "서울특별시",
            district: "서초구",
            detail: "상세주소",
            region: "SEOUL" as RegionType,
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
                userType: ["MOVER"] as UserType[],
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

      mockedRepository.getReceivedEstimateRequests.mockResolvedValue(
        mockRawData
      );

      // Act
      const result =
        await customerEstimateRequestService.getReceivedEstimateRequests(
          mockUserId
        );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].estimateRequest.id).toBe("estimateRequest1");
      expect(result[0].estimates).toHaveLength(1);
      expect(result[0].estimates[0].mover.isFavorite).toBe(true);
    });

    it("완료된 견적요청이 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      mockedRepository.getReceivedEstimateRequests.mockResolvedValue([]);

      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequests(mockUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it("잘못된 사용자 ID로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequests("")
      ).rejects.toThrow(ServiceValidationError);
    });

    it("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      mockedRepository.getReceivedEstimateRequests.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequests(mockUserId)
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("레포지토리에서 받은 데이터를 변환한다", () => {
    it("정상적으로 데이터를 변환한다", () => {
      // Arrange
      const mockRawData: MultipleEstimateRequestWithRelations = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2024-01-15"),
          createdAt: new Date("2024-01-10"),
          description: "이사 견적 요청",
          status: "COMPLETED" as RequestStatus,
          fromAddress: {
            zoneCode: "12345",
            city: "서울특별시",
            district: "강남구",
            detail: "상세주소",
            region: "SEOUL" as RegionType,
          },
          toAddress: {
            zoneCode: "12346",
            city: "서울특별시",
            district: "서초구",
            detail: "상세주소",
            region: "SEOUL" as RegionType,
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
                userType: ["MOVER"] as UserType[],
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

      // Act
      const result =
        customerEstimateRequestService.transformReceivedEstimateData(
          mockRawData
        );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].estimateRequest.id).toBe("estimateRequest1");
      expect(result[0].estimates[0].mover.isFavorite).toBe(true);
    });

    it("null 데이터에 대해 빈 배열을 반환한다", () => {
      // Act
      const result =
        customerEstimateRequestService.transformReceivedEstimateData(
          null as unknown as MultipleEstimateRequestWithRelations
        );

      // Assert
      expect(result).toEqual([]);
    });

    it("에러 발생 시 ServiceDataProcessingError를 던진다", () => {
      // Arrange
      const invalidData = [
        {
          estimates: [
            {
              mover: null, // 잘못된 데이터
            },
          ],
        },
      ];

      // Act & Assert
      expect(() =>
        customerEstimateRequestService.transformReceivedEstimateData(
          invalidData as unknown as MultipleEstimateRequestWithRelations
        )
      ).toThrow(ServiceDataProcessingError);
    });
  });

  describe("견적 확정", () => {
    const mockUserId = "user123";
    const mockEstimateId = "estimate1";
    const mockEstimateRequestId = "estimateRequest1";

    it("성공적으로 견적을 확정한다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate1",
        moverId: "mover1",
        estimateRequestId: "estimateRequest1",
        price: 500000,
        comment: "합리적인 가격",
        status: "PENDING" as EstimateStatus,
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-11"),
        deletedAt: null,
      };

      const mockConfirmedEstimateRequest = {
        ...mockEstimateRequest,
        status: "APPROVED" as RequestStatus,
      };

      const mockAcceptedEstimate = {
        ...mockEstimate,
        status: "ACCEPTED" as EstimateStatus,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockedRepository.updateEstimateRequestStatus.mockResolvedValue(
        mockConfirmedEstimateRequest
      );
      mockedRepository.updateEstimateStatus.mockResolvedValue(
        mockAcceptedEstimate
      );
      mockedRepository.updateAllEstimatesStatus.mockResolvedValue(undefined);

      // Act
      const result = await customerEstimateRequestService.confirmEstimate(
        mockUserId,
        mockEstimateId
      );

      // Assert
      expect(result).toEqual({
        estimateRequest: mockConfirmedEstimateRequest,
        estimate: mockAcceptedEstimate,
      });
      expect(mockedRepository.getActiveEstimateRequest).toHaveBeenCalledWith(
        mockUserId
      );
      expect(mockedRepository.getEstimateRequestById).toHaveBeenCalledWith(
        mockEstimateRequestId
      );
      expect(mockedRepository.getEstimateByIdAndRequestId).toHaveBeenCalledWith(
        mockEstimateId,
        mockEstimateRequestId
      );
      expect(mockedRepository.updateEstimateRequestStatus).toHaveBeenCalledWith(
        mockEstimateRequestId,
        "APPROVED"
      );
      expect(mockedRepository.updateEstimateStatus).toHaveBeenCalledWith(
        mockEstimateId,
        "ACCEPTED"
      );
      expect(mockedRepository.updateAllEstimatesStatus).toHaveBeenCalledWith(
        mockEstimateRequestId,
        "AUTO_REJECTED",
        mockEstimateId
      );
    });

    it("진행중인 견적요청이 없을 때 ServiceError를 던진다", async () => {
      // Arrange
      mockedRepository.getActiveEstimateRequest.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceError);
    });

    it("견적요청을 찾을 수 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("이미 확정된 견적요청일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "APPROVED" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceValidationError);
    });

    it("견적을 찾을 수 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.getEstimateByIdAndRequestId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("견적 확정 트랜잭션에 실패할 때 NotFoundError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate1",
        moverId: "mover1",
        estimateRequestId: "estimateRequest1",
        price: 500000,
        comment: "합리적인 가격",
        status: "PENDING" as EstimateStatus,
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-11"),
        deletedAt: null,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockedRepository.updateEstimateRequestStatus.mockRejectedValue(
        new Error("트랜잭션 실패")
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceError);
    });

    it("Repository 에러가 발생했을 때 ServiceError로 래핑된다", async () => {
      // Arrange
      const mockRepositoryError = new RepositoryError(
        "데이터베이스 연결 실패",
        ErrorCode.REPOSITORY_CONNECTION_ERROR,
        new Error("Connection failed")
      );

      mockedRepository.getActiveEstimateRequest.mockRejectedValue(
        mockRepositoryError
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("견적 취소", () => {
    const mockUserId = "user123";
    const mockEstimateId = "estimate1";
    const mockEstimateRequestId = "estimateRequest1";

    it("성공적으로 견적을 취소한다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate1",
        moverId: "mover1",
        estimateRequestId: "estimateRequest1",
        price: 500000,
        comment: "합리적인 가격",
        status: "PENDING" as EstimateStatus,
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-11"),
        deletedAt: null,
      };

      const mockRejectedEstimate = {
        ...mockEstimate,
        status: "REJECTED" as EstimateStatus,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockedRepository.updateEstimateStatus.mockResolvedValue(
        mockRejectedEstimate
      );

      // Act
      const result = await customerEstimateRequestService.cancelEstimate(
        mockUserId,
        mockEstimateId
      );

      // Assert
      expect(result).toEqual(mockRejectedEstimate);
      expect(mockedRepository.getActiveEstimateRequest).toHaveBeenCalledWith(
        mockUserId
      );
      expect(mockedRepository.getEstimateRequestById).toHaveBeenCalledWith(
        mockEstimateRequestId
      );
      expect(mockedRepository.getEstimateByIdAndRequestId).toHaveBeenCalledWith(
        mockEstimateId,
        mockEstimateRequestId
      );
      expect(mockedRepository.updateEstimateStatus).toHaveBeenCalledWith(
        mockEstimateId,
        "REJECTED"
      );
    });

    it("진행중인 견적요청이 없을 때 ServiceError를 던진다", async () => {
      // Arrange
      mockedRepository.getActiveEstimateRequest.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceError);
    });

    it("이미 확정된 견적요청일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "APPROVED" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceValidationError);
    });

    it("견적을 찾을 수 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.getEstimateByIdAndRequestId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("Repository 에러가 발생했을 때 ServiceError로 래핑된다", async () => {
      // Arrange
      const mockRepositoryError = new RepositoryError(
        "데이터베이스 연결 실패",
        ErrorCode.REPOSITORY_CONNECTION_ERROR,
        new Error("Connection failed")
      );

      mockedRepository.getActiveEstimateRequest.mockRejectedValue(
        mockRepositoryError
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.cancelEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("이사완료(구매확정)", () => {
    const mockUserId = "user123";
    const mockEstimateId = "estimate1";
    const mockEstimateRequestId = "estimateRequest1";

    it("성공적으로 이사를 완료한다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "APPROVED" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      const mockEstimate = {
        id: "estimate1",
        moverId: "mover1",
        estimateRequestId: "estimateRequest1",
        price: 500000,
        comment: "합리적인 가격",
        status: "ACCEPTED" as EstimateStatus,
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-11"),
        deletedAt: null,
      };

      const mockCompletedEstimateRequest = {
        ...mockEstimateRequest,
        status: "COMPLETED" as RequestStatus,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.getEstimateByIdAndRequestId.mockResolvedValue(
        mockEstimate
      );
      mockedRepository.updateEstimateRequestStatus.mockResolvedValue(
        mockCompletedEstimateRequest
      );

      // Act
      const result = await customerEstimateRequestService.completeEstimate(
        mockUserId,
        mockEstimateId
      );

      // Assert
      expect(result).toEqual({
        estimateRequest: mockCompletedEstimateRequest,
      });
      expect(mockedRepository.getActiveEstimateRequest).toHaveBeenCalledWith(
        mockUserId
      );
      expect(mockedRepository.getEstimateRequestById).toHaveBeenCalledWith(
        mockEstimateRequestId
      );
      expect(mockedRepository.getEstimateByIdAndRequestId).toHaveBeenCalledWith(
        mockEstimateId,
        mockEstimateRequestId
      );
      expect(mockedRepository.updateEstimateRequestStatus).toHaveBeenCalledWith(
        mockEstimateRequestId,
        "COMPLETED"
      );
    });

    it("진행중인 견적요청이 없을 때 ServiceError를 던진다", async () => {
      // Arrange
      mockedRepository.getActiveEstimateRequest.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceError);
    });

    it("확정하지 않은 견적요청일 때 ServiceValidationError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "PENDING" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceValidationError);
    });

    it("견적을 찾을 수 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        id: "estimateRequest1",
        customerId: "user123",
        moveType: "HOME" as MoveType,
        moveDate: new Date("2024-01-15"),
        fromAddressId: "addr1",
        toAddressId: "addr2",
        description: "이사 견적 요청",
        status: "APPROVED" as RequestStatus,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        deletedAt: null,
      };

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockEstimateRequestId
      );
      mockedRepository.getEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.getEstimateByIdAndRequestId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("Repository 에러가 발생했을 때 ServiceError로 래핑된다", async () => {
      // Arrange
      const mockRepositoryError = new RepositoryError(
        "데이터베이스 연결 실패",
        ErrorCode.REPOSITORY_CONNECTION_ERROR,
        new Error("Connection failed")
      );

      mockedRepository.getActiveEstimateRequest.mockRejectedValue(
        mockRepositoryError
      );

      // Act & Assert
      await expect(
        customerEstimateRequestService.completeEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(ServiceError);
    });
  });
});
