import customerEstimateRequestService from "./customerEstimateRequest.service";
import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  ServiceError,
  ServiceValidationError,
  ServiceDataProcessingError,
  RepositoryError,
} from "../types/errors.types";

// 레포지토리 모킹
jest.mock("../repositories/customerEstimateRequest.repository");
const mockedRepository = customerEstimateRequestRepository as jest.Mocked<
  typeof customerEstimateRequestRepository
>;

describe("customerEstimateRequestService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("현재 대기중인 견적을 조회한다", () => {
    const mockUserId = "user123";

    test("성공적으로 진행중인 견적요청을 조회한다", async () => {
      // Arrange
      const mockActiveEstimateRequestId = "estimateRequest123";
      const mockRawData = {
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
              userType: "MOVER",
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
      } as any;

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
                userType: "MOVER",
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
      });
    });

    test("활성 견적요청이 없을 때 빈 결과를 반환한다", async () => {
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

    test("데이터가 없을 때 빈 결과를 반환한다", async () => {
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

    test("잘못된 사용자 ID로 호출 시 ServiceValidationError를 던진다", async () => {
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

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
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
    test("정상적으로 데이터를 변환한다", () => {
      // Arrange
      const mockRawData = {
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
        estimates: [
          {
            id: "estimate1",
            price: 500000,
            comment: "합리적인 가격",
            status: "PROPOSED",
            isDesignated: false,
            createdAt: new Date("2024-01-11"),
            mover: {
              id: "mover1",
              name: "이사업체A",
              userType: "MOVER",
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
      } as any;

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

    test("null 데이터에 대해 빈 결과를 반환한다", () => {
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

    test("에러 발생 시 ServiceDataProcessingError를 던진다", () => {
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
          invalidData as any
        )
      ).toThrow(ServiceDataProcessingError);
    });
  });

  describe("getReceivedEstimateRequests", () => {
    const mockUserId = "user123";

    test("성공적으로 완료된 견적요청 목록을 조회한다", async () => {
      // Arrange
      const mockRawData = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME",
          moveDate: new Date("2024-01-15"),
          createdAt: new Date("2024-01-10"),
          description: "이사 견적 요청",
          status: "COMPLETED",
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
          estimates: [
            {
              id: "estimate1",
              price: 500000,
              comment: "합리적인 가격",
              status: "ACCEPTED",
              isDesignated: true,
              createdAt: new Date("2024-01-11"),
              mover: {
                id: "mover1",
                name: "이사업체A",
                userType: "MOVER",
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
      ] as any;

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

    test("완료된 견적요청이 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      mockedRepository.getReceivedEstimateRequests.mockResolvedValue([]);

      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequests(mockUserId)
      ).rejects.toThrow(NotFoundError);
    });

    test("잘못된 사용자 ID로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequests("")
      ).rejects.toThrow(ServiceValidationError);
    });

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
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

  describe("transformReceivedEstimateData", () => {
    test("정상적으로 데이터를 변환한다", () => {
      // Arrange
      const mockRawData = [
        {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME",
          moveDate: new Date("2024-01-15"),
          createdAt: new Date("2024-01-10"),
          description: "이사 견적 요청",
          status: "COMPLETED",
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
          estimates: [
            {
              id: "estimate1",
              price: 500000,
              comment: "합리적인 가격",
              status: "ACCEPTED",
              isDesignated: true,
              createdAt: new Date("2024-01-11"),
              mover: {
                id: "mover1",
                name: "이사업체A",
                userType: "MOVER",
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
      ] as any;

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

    test("null 데이터에 대해 빈 배열을 반환한다", () => {
      // Act
      const result =
        customerEstimateRequestService.transformReceivedEstimateData(
          null as any
        );

      // Assert
      expect(result).toEqual([]);
    });

    test("에러 발생 시 ServiceDataProcessingError를 던진다", () => {
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
          invalidData as any
        )
      ).toThrow(ServiceDataProcessingError);
    });
  });

  describe("getPendingEstimateRequestDetail", () => {
    const mockUserId = "user123";
    const mockEstimateId = "estimate1";

    test("성공적으로 견적 상세 정보를 조회한다", async () => {
      // Arrange
      const mockActiveEstimateRequestId = "estimateRequest123";
      const mockResult = {
        id: "estimate1",
        price: 500000,
        comment: "합리적인 가격",
        status: "PROPOSED",
        isDesignated: false,
        createdAt: new Date("2024-01-11"),
        mover: {
          id: "mover1",
          name: "이사업체A",
          isFavorite: true,
          totalFavoriteCount: 10,
          Favorite: [{ id: "favorite1" }],
        },
      } as any;

      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockActiveEstimateRequestId
      );
      mockedRepository.getPendingEstimateRequestDetail.mockResolvedValue(
        mockResult
      );

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequestDetail(
          mockUserId,
          mockEstimateId
        );

      // Assert
      expect(result).toEqual(mockResult);
    });

    test("활성 견적요청이 없을 때 빈 객체를 반환한다", async () => {
      // Arrange
      mockedRepository.getActiveEstimateRequest.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequestDetail(
          mockUserId,
          mockEstimateId
        );

      // Assert
      expect(result).toEqual({});
    });

    test("견적 상세 정보가 없을 때 빈 객체를 반환한다", async () => {
      // Arrange
      const mockActiveEstimateRequestId = "estimateRequest123";
      mockedRepository.getActiveEstimateRequest.mockResolvedValue(
        mockActiveEstimateRequestId
      );
      mockedRepository.getPendingEstimateRequestDetail.mockResolvedValue(null);

      // Act
      const result =
        await customerEstimateRequestService.getPendingEstimateRequestDetail(
          mockUserId,
          mockEstimateId
        );

      // Assert
      expect(result).toEqual({});
    });
  });

  describe("getReceivedEstimateRequestDetail", () => {
    const mockUserId = "user123";
    const mockEstimateRequestId = "estimateRequest1";
    const mockEstimateId = "estimate1";

    test("성공적으로 견적 상세 정보를 조회한다", async () => {
      // Arrange
      const mockResult = {
        id: "estimate1",
        price: 500000,
        comment: "합리적인 가격",
        status: "ACCEPTED",
        isDesignated: true,
        createdAt: new Date("2024-01-11"),
        mover: {
          id: "mover1",
          name: "이사업체A",
          isFavorite: true,
          totalFavoriteCount: 10,
          Favorite: [{ id: "favorite1" }],
        },
      } as any;

      mockedRepository.getReceivedEstimateRequestDetail.mockResolvedValue(
        mockResult
      );

      // Act
      const result =
        await customerEstimateRequestService.getReceivedEstimateRequestDetail(
          mockUserId,
          mockEstimateRequestId,
          mockEstimateId
        );

      // Assert
      expect(result).toEqual(mockResult);
    });

    test("견적 상세 정보가 없을 때 NotFoundError를 던진다", async () => {
      // Arrange
      mockedRepository.getReceivedEstimateRequestDetail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.getReceivedEstimateRequestDetail(
          mockUserId,
          mockEstimateRequestId,
          mockEstimateId
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("confirmEstimate", () => {
    const mockUserId = "user123";
    const mockEstimateId = "estimate1";

    test("성공적으로 견적을 확정한다", async () => {
      // Arrange
      const mockResult = {
        estimateRequest: {
          id: "estimateRequest1",
          status: "APPROVED",
        },
        estimate: {
          id: "estimate1",
          status: "ACCEPTED",
        },
      } as any;

      mockedRepository.confirmEstimate.mockResolvedValue(mockResult);

      // Act
      const result = await customerEstimateRequestService.confirmEstimate(
        mockUserId,
        mockEstimateId
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockedRepository.confirmEstimate).toHaveBeenCalledWith(
        mockUserId,
        mockEstimateId
      );
    });

    test("견적 확정에 실패할 때 NotFoundError를 던진다", async () => {
      // Arrange
      mockedRepository.confirmEstimate.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.confirmEstimate(
          mockUserId,
          mockEstimateId
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("designateEstimateRequest", () => {
    const mockEstimateRequestId = "estimateRequest1";
    const mockUserId = "user123";
    const mockMessage = "지정 견적 요청 메시지";
    const mockMoverId = "mover1";

    test("성공적으로 지정 견적을 요청한다", async () => {
      // Arrange
      const mockResult = {
        id: "designate1",
        estimateRequestId: mockEstimateRequestId,
        message: mockMessage,
        moverId: mockMoverId,
        status: "PENDING",
        expiresAt: new Date("2024-02-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      mockedRepository.designateEstimateRequest.mockResolvedValue(mockResult);

      // Act
      const result =
        await customerEstimateRequestService.designateEstimateRequest(
          mockEstimateRequestId,
          mockUserId,
          mockMessage,
          mockMoverId
        );

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockedRepository.designateEstimateRequest).toHaveBeenCalledWith(
        mockEstimateRequestId,
        mockUserId,
        mockMessage,
        mockMoverId
      );
    });

    test("지정 견적 요청에 실패할 때 NotFoundError를 던진다", async () => {
      // Arrange
      mockedRepository.designateEstimateRequest.mockResolvedValue(null);

      // Act & Assert
      await expect(
        customerEstimateRequestService.designateEstimateRequest(
          mockEstimateRequestId,
          mockUserId,
          mockMessage,
          mockMoverId
        )
      ).rejects.toThrow(NotFoundError);
    });
  });
});
