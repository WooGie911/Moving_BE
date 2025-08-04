import moverEstimateService from "./moverEstimate.service";
import moverEstimateRepository from "../repositories/moverEstimate.repository";
import actionService from "./action.service";

import {
  ServiceError,
  ServiceValidationError,
  MoverEstimateDuplicateError,
  MoverEstimateQuotaExceededError,
  MoverInvalidEstimateRequestError,
  MoverExpiredEstimateRequestError,
  MoverNoDesignatedRequestError,
  MoverUnauthorizedAccessError,
  MoverInvalidEstimateStatusError,
  RepositoryError,
} from "../types/errors.types";
import { RequestStatus, EstimateStatus, RegionType } from "../types/user.types";
import { ActionType } from "@prisma/client";

// 레포지토리 모킹
jest.mock("../repositories/moverEstimate.repository");
const mockedRepository = moverEstimateRepository as jest.Mocked<
  typeof moverEstimateRepository
>;

// 액션 서비스 모킹
jest.mock("./action.service");
const mockedActionService = actionService as jest.Mocked<typeof actionService>;

// 타입 안전한 상수 정의
const REQUEST_STATUS = {
  PENDING: "PENDING" as RequestStatus,
  COMPLETED: "COMPLETED" as RequestStatus,
  APPROVED: "APPROVED" as RequestStatus,
} as const;

const ESTIMATE_STATUS = {
  PROPOSED: "PROPOSED" as EstimateStatus,
  ACCEPTED: "ACCEPTED" as EstimateStatus,
  REJECTED: "REJECTED" as EstimateStatus,
  AUTO_REJECTED: "AUTO_REJECTED" as EstimateStatus,
} as const;

const REGION_TYPE = {
  SEOUL: "SEOUL" as RegionType,
} as const;

describe("이사업체 견적 서비스", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("견적 생성", () => {
    const mockData = {
      estimateRequestId: "estimateRequest123",
      moverId: "mover123",
      price: 500000,
      comment: "합리적인 가격으로 안전한 이사 서비스 제공",
    };

    test("성공적으로 견적을 생성한다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };

      const mockEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격으로 안전한 이사 서비스 제공",
        status: ESTIMATE_STATUS.PROPOSED,
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
          name: "김이사",
          moverImage: null,
          nickname: "김이사",
          shortIntro: "5년 경력의 전문 이사업체",
          detailIntro: "신중하고 안전한 이사 서비스",
          career: 5,
          workedCount: 120,
          averageRating: 4.8,
          totalReviewCount: 45,
          serviceTypes: ["HOME", "SMALL"],
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: REQUEST_STATUS.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "김고객",
            currentArea: "서울특별시",
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: REGION_TYPE.SEOUL,
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: REGION_TYPE.SEOUL,
          },
        },
      };

      const mockEstimateDetail = {
        id: "estimate123",
        status: ESTIMATE_STATUS.PROPOSED,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        isDesignated: false,
        mover: { name: "김이사" },
        estimateRequest: {
          customerId: "customer123",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          id: "estimateRequest123",
          customer: { id: "customer123", name: "김고객" },
        },
      } as any;

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(null);
      mockedRepository.findDesignatedRequest.mockResolvedValue(null);
      mockedRepository.countExistingEstimates.mockResolvedValue([]);
      mockedRepository.createEstimate.mockResolvedValue(mockEstimate);
      mockedRepository.getEstimateDetailForAction.mockResolvedValue(
        mockEstimateDetail
      );
      mockedActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        description: null,
        deletedAt: null,
        userId: "customer123",
        type: ActionType.ESTIMATE_SUBMITTED,
        entityId: "estimate123",
        entityType: "ESTIMATE",
        metadata: {},
      } as any);

      // Act
      const result = await moverEstimateService.createEstimate(mockData);

      // Assert
      expect(result).toEqual({
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        price: 500000,
        comment: "합리적인 가격으로 안전한 이사 서비스 제공",
        status: "PROPOSED",
        createdAt: mockEstimate.createdAt,
      });
      expect(mockedRepository.findEstimateRequestById).toHaveBeenCalledWith(
        mockData.estimateRequestId
      );
      expect(mockedRepository.findExistingEstimate).toHaveBeenCalledWith(
        mockData.estimateRequestId,
        mockData.moverId
      );
      expect(mockedRepository.createEstimate).toHaveBeenCalledWith(
        mockData.estimateRequestId,
        mockData.moverId,
        mockData.price,
        mockData.comment,
        ESTIMATE_STATUS.PROPOSED,
        false
      );
      expect(mockedActionService.createAction).toHaveBeenCalledWith(
        "customer123",
        ActionType.ESTIMATE_SUBMITTED,
        "estimate123",
        "ESTIMATE",
        {
          moverName: "김이사",
          moveType: "HOME",
        }
      );
    });

    test("지정 견적으로 성공적으로 견적을 생성한다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };

      const mockEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "지정 견적입니다",
        status: ESTIMATE_STATUS.PROPOSED,
        rejectReason: null,
        isDesignated: true,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mover: {
          id: "mover123",
          name: "김이사",
          moverImage: null,
          nickname: "김이사",
          shortIntro: "5년 경력의 전문 이사업체",
          detailIntro: "신중하고 안전한 이사 서비스",
          career: 5,
          workedCount: 120,
          averageRating: 4.8,
          totalReviewCount: 45,
          serviceTypes: ["HOME", "SMALL"],
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: REQUEST_STATUS.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "김고객",
            currentArea: "서울특별시",
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: REGION_TYPE.SEOUL,
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: REGION_TYPE.SEOUL,
          },
        },
      };

      const mockEstimateDetail = {
        id: "estimate123",
        status: ESTIMATE_STATUS.PROPOSED,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        isDesignated: true,
        mover: { name: "김이사" },
        estimateRequest: {
          customerId: "customer123",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          id: "estimateRequest123",
          customer: { id: "customer123", name: "김고객" },
        },
      } as any;

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(null);
      mockedRepository.findDesignatedRequest.mockResolvedValue({
        id: "designated123",
        createdAt: new Date(),
        status: REQUEST_STATUS.PENDING,
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        message: null,
        expiresAt: new Date(),
      });
      mockedRepository.countExistingEstimates.mockResolvedValue([]);
      mockedRepository.createEstimate.mockResolvedValue(mockEstimate);
      mockedRepository.getEstimateDetailForAction.mockResolvedValue(
        mockEstimateDetail
      );
      mockedActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        description: null,
        deletedAt: null,
        userId: "customer123",
        type: ActionType.DESIGNATED_ESTIMATE_SUBMITTED,
        entityId: "estimate123",
        entityType: "DESIGNATED_ESTIMATE",
        metadata: {},
      } as any);

      // Act
      const result = await moverEstimateService.createEstimate(mockData);

      // Assert
      expect(mockedRepository.createEstimate).toHaveBeenCalledWith(
        mockData.estimateRequestId,
        mockData.moverId,
        mockData.price,
        mockData.comment,
        ESTIMATE_STATUS.PROPOSED,
        true
      );
      expect(mockedActionService.createAction).toHaveBeenCalledWith(
        "customer123",
        ActionType.DESIGNATED_ESTIMATE_SUBMITTED,
        "estimate123",
        "DESIGNATED_ESTIMATE",
        {
          moverName: "김이사",
          moveType: "HOME",
        }
      );
    });

    test("견적 생성 실패 시 ServiceError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(null);
      mockedRepository.findDesignatedRequest.mockResolvedValue(null);
      mockedRepository.countExistingEstimates.mockResolvedValue([]);
      mockedRepository.createEstimate.mockResolvedValue(null);

      // Act & Assert
      await expect(
        moverEstimateService.createEstimate(mockData)
      ).rejects.toThrow(ServiceError);
    });

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      mockedRepository.findEstimateRequestById.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        moverEstimateService.createEstimate(mockData)
      ).rejects.toThrow(ServiceError);
    });

    test("잘못된 입력값으로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateService.createEstimate({
          ...mockData,
          moverId: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.createEstimate({
          ...mockData,
          estimateRequestId: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.createEstimate({
          ...mockData,
          price: 0,
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.createEstimate({
          ...mockData,
          comment: "",
        })
      ).rejects.toThrow(ServiceValidationError);
    });

    test("견적 요청이 존재하지 않을 때 MoverInvalidEstimateRequestError를 던진다", async () => {
      // Arrange
      mockedRepository.findEstimateRequestById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        moverEstimateService.createEstimate(mockData)
      ).rejects.toThrow(MoverInvalidEstimateRequestError);
    });

    test("견적 요청 상태가 PENDING이 아닐 때 MoverInvalidEstimateRequestError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.COMPLETED,
        moveDate: new Date("2025-08-10"),
      };
      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        moverEstimateService.createEstimate(mockData)
      ).rejects.toThrow(MoverInvalidEstimateRequestError);
    });

    test("이사일이 지났을 때 MoverExpiredEstimateRequestError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2024-01-01"), // 과거 날짜
      };
      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        moverEstimateService.createEstimate(mockData)
      ).rejects.toThrow(MoverExpiredEstimateRequestError);
    });

    test("이미 견적이 존재할 때 MoverEstimateDuplicateError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };
      const mockExistingEstimate = {
        id: "existingEstimate",
        status: ESTIMATE_STATUS.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "기존 견적",
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        mover: {
          id: "mover123",
          name: "김이사",
          moverImage: null,
          nickname: "김이사",
          shortIntro: "5년 경력의 전문 이사업체",
          detailIntro: "신중하고 안전한 이사 서비스",
          career: 5,
          workedCount: 120,
          averageRating: 4.8,
          totalReviewCount: 45,
          serviceTypes: ["HOME", "SMALL"],
        },
        estimateRequest: {
          id: "estimateRequest123",
          customerId: "customer123",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: REQUEST_STATUS.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer123",
            name: "김고객",
            currentArea: "서울특별시",
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: REGION_TYPE.SEOUL,
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: REGION_TYPE.SEOUL,
          },
        },
      };

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(
        mockExistingEstimate
      );

      // Act & Assert
      await expect(
        moverEstimateService.createEstimate(mockData)
      ).rejects.toThrow(MoverEstimateDuplicateError);
    });

    test("견적 개수 제한을 초과할 때 MoverEstimateQuotaExceededError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };
      const mockExistingEstimates = Array(5).fill({ isDesignated: false });

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(null);
      mockedRepository.findDesignatedRequest.mockResolvedValue(null);
      mockedRepository.countExistingEstimates.mockResolvedValue(
        mockExistingEstimates
      );

      // Act & Assert
      await expect(
        moverEstimateService.createEstimate(mockData)
      ).rejects.toThrow(MoverEstimateQuotaExceededError);
    });
  });

  describe("지역 견적 요청 조회", () => {
    const mockMoverId = "mover123";

    test("성공적으로 서비스 가능 지역 견적을 조회한다", async () => {
      // Arrange
      const mockCurrentAreas: RegionType[] = ["SEOUL", "GYEONGGI"];
      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer1",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: REQUEST_STATUS.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL" as RegionType,
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: REGION_TYPE.SEOUL,
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: REGION_TYPE.SEOUL,
          },
          estimates: [],
        },
      ];

      mockedRepository.findUserServiceAreas.mockResolvedValue(mockCurrentAreas);
      mockedRepository.getRegionEstimateRequest.mockResolvedValue(
        mockEstimateRequests
      );

      // Act
      const result = await moverEstimateService.getRegionEstimateRequest(
        mockMoverId,
        "createdAt",
        "김고객",
        "HOME"
      );

      // Assert
      expect(result).toEqual(mockEstimateRequests);
      expect(mockedRepository.findUserServiceAreas).toHaveBeenCalledWith(
        mockMoverId
      );
      expect(mockedRepository.getRegionEstimateRequest).toHaveBeenCalledWith(
        mockMoverId,
        "createdAt",
        "김고객",
        "HOME",
        mockCurrentAreas
      );
    });

    test("잘못된 기사 ID로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateService.getRegionEstimateRequest("")
      ).rejects.toThrow(ServiceValidationError);
    });

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      mockedRepository.findUserServiceAreas.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        moverEstimateService.getRegionEstimateRequest(mockMoverId)
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("지정 견적 요청 조회", () => {
    const mockMoverId = "mover123";

    test("성공적으로 지정 견적을 조회한다", async () => {
      // Arrange
      const mockEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer1",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: REQUEST_STATUS.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL" as RegionType,
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: REGION_TYPE.SEOUL,
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: REGION_TYPE.SEOUL,
          },
          estimates: [],
        },
      ];

      mockedRepository.getDesignatedEstimateRequest.mockResolvedValue(
        mockEstimateRequests
      );

      // Act
      const result = await moverEstimateService.getDesignatedEstimateRequest(
        mockMoverId,
        "createdAt",
        "김고객",
        "HOME"
      );

      // Assert
      expect(result).toEqual(mockEstimateRequests);
      expect(
        mockedRepository.getDesignatedEstimateRequest
      ).toHaveBeenCalledWith(mockMoverId, "createdAt", "김고객", "HOME");
    });

    test("지정 견적이 없을 때 MoverNoDesignatedRequestError를 던진다", async () => {
      // Arrange
      mockedRepository.getDesignatedEstimateRequest.mockResolvedValue([]);

      // Act & Assert
      await expect(
        moverEstimateService.getDesignatedEstimateRequest(mockMoverId)
      ).rejects.toThrow(MoverNoDesignatedRequestError);
    });

    test("잘못된 기사 ID로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateService.getDesignatedEstimateRequest("")
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("전체 견적 요청 조회", () => {
    const mockMoverId = "mover123";
    const mockOptions = {
      region: true,
      designated: false,
      sortBy: "createdAt" as const,
      customerName: "김고객",
      movingType: "HOME" as const,
    };

    test("성공적으로 통합 견적 요청을 조회한다", async () => {
      // Arrange
      const mockCurrentAreas: RegionType[] = ["SEOUL"];
      const mockRegionEstimateRequests = [
        {
          id: "estimateRequest1",
          customerId: "customer1",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: REQUEST_STATUS.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL" as RegionType,
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: REGION_TYPE.SEOUL,
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: REGION_TYPE.SEOUL,
          },
          estimates: [],
        },
      ];

      mockedRepository.findUserServiceAreas.mockResolvedValue(mockCurrentAreas);
      mockedRepository.getRegionEstimateRequest.mockResolvedValue(
        mockRegionEstimateRequests
      );

      // Act
      const result = await moverEstimateService.getAllEstimateRequests(
        mockMoverId,
        mockOptions
      );

      // Assert
      expect(result).toEqual({
        regionEstimateRequests: mockRegionEstimateRequests,
        designatedEstimateRequests: undefined,
      });
    });

    test("지역 견적 조회 중 에러가 발생해도 빈 배열로 처리한다", async () => {
      // Arrange
      mockedRepository.findUserServiceAreas.mockRejectedValue(
        new Error("DB 에러")
      );

      // Act
      const result = await moverEstimateService.getAllEstimateRequests(
        mockMoverId,
        mockOptions
      );

      // Assert
      expect(result).toEqual({
        regionEstimateRequests: [],
        designatedEstimateRequests: undefined,
      });
    });

    test("지정 견적 조회 중 에러가 발생해도 빈 배열로 처리한다", async () => {
      // Arrange
      const mockOptionsWithDesignated = {
        ...mockOptions,
        region: false,
        designated: true,
      };

      mockedRepository.getDesignatedEstimateRequest.mockRejectedValue(
        new Error("DB 에러")
      );

      // Act
      const result = await moverEstimateService.getAllEstimateRequests(
        mockMoverId,
        mockOptionsWithDesignated
      );

      // Assert
      expect(result).toEqual({
        regionEstimateRequests: undefined,
        designatedEstimateRequests: [],
      });
    });
  });

  describe("내 견적서 조회", () => {
    const mockMoverId = "mover123";

    test("성공적으로 내가 보낸 견적서를 조회한다", async () => {
      // Arrange
      const mockEstimates = [
        {
          id: "estimate1",
          moverId: "mover123",
          estimateRequestId: "estimateRequest1",
          price: 500000,
          comment: "합리적인 가격",
          status: "PROPOSED" as const,
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
            name: "김이사",
            moverImage: null,
            nickname: "김이사",
            shortIntro: "5년 경력의 전문 이사업체",
            detailIntro: "신중하고 안전한 이사 서비스",
            career: 5,
            workedCount: 120,
            averageRating: 4.8,
            totalReviewCount: 45,
            serviceTypes: ["HOME", "SMALL"],
          },
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer1",
            moveType: "HOME" as const,
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "1인가구 이사",
            status: REQUEST_STATUS.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer1",
              name: "김고객",
              currentArea: "SEOUL" as RegionType,
              customerImage: null,
              nickname: "김고객",
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "06123",
              city: "서울특별시",
              district: "강남구",
              detail: "테헤란로 123",
              region: REGION_TYPE.SEOUL,
            },
            toAddress: {
              id: "addr2",
              zoneCode: "06621",
              city: "서울특별시",
              district: "서초구",
              detail: "서초대로 456",
              region: REGION_TYPE.SEOUL,
            },
          },
        },
      ];

      mockedRepository.getMyEstimate.mockResolvedValue(mockEstimates);

      // Act
      const result = await moverEstimateService.getMyEstimate(mockMoverId);

      // Assert
      expect(result).toEqual(mockEstimates);
      expect(mockedRepository.getMyEstimate).toHaveBeenCalledWith(mockMoverId);
    });

    test("잘못된 기사 ID로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(moverEstimateService.getMyEstimate("")).rejects.toThrow(
        ServiceValidationError
      );
    });
  });

  describe("내 반려 견적 조회", () => {
    const mockMoverId = "mover123";

    test("성공적으로 내가 반려한 견적을 조회한다", async () => {
      // Arrange
      const mockRejectedEstimates = [
        {
          id: "estimate1",
          moverId: "mover123",
          estimateRequestId: "estimateRequest1",
          price: null,
          comment: "일정이 맞지 않아 반려합니다",
          status: "REJECTED" as const,
          rejectReason: "일정이 맞지 않음",
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
            name: "김이사",
            moverImage: null,
            nickname: "김이사",
            shortIntro: "5년 경력의 전문 이사업체",
            detailIntro: "신중하고 안전한 이사 서비스",
            career: 5,
            workedCount: 120,
            averageRating: 4.8,
            totalReviewCount: 45,
            serviceTypes: ["HOME", "SMALL"],
          },
          estimateRequest: {
            id: "estimateRequest1",
            customerId: "customer1",
            moveType: "HOME" as const,
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "1인가구 이사",
            status: REQUEST_STATUS.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer1",
              name: "김고객",
              currentArea: "SEOUL" as RegionType,
              customerImage: null,
              nickname: "김고객",
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "06123",
              city: "서울특별시",
              district: "강남구",
              detail: "테헤란로 123",
              region: REGION_TYPE.SEOUL,
            },
            toAddress: {
              id: "addr2",
              zoneCode: "06621",
              city: "서울특별시",
              district: "서초구",
              detail: "서초대로 456",
              region: REGION_TYPE.SEOUL,
            },
          },
        },
      ];

      mockedRepository.getMyRejectedEstimates.mockResolvedValue(
        mockRejectedEstimates
      );

      // Act
      const result =
        await moverEstimateService.getMyRejectedEstimates(mockMoverId);

      // Assert
      expect(result).toEqual(mockRejectedEstimates);
      expect(mockedRepository.getMyRejectedEstimates).toHaveBeenCalledWith(
        mockMoverId
      );
    });

    test("잘못된 기사 ID로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateService.getMyRejectedEstimates("")
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe("견적 반려", () => {
    const mockRejectData = {
      estimateRequestId: "estimateRequest123",
      moverId: "mover123",
      comment: "일정이 맞지 않아 반려합니다",
    };

    test("성공적으로 견적을 반려한다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };

      const mockRejectedEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 0,
        comment: "일정이 맞지 않아 반려합니다",
        status: ESTIMATE_STATUS.REJECTED,
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

      const mockEstimateDetail = {
        id: "estimate123",
        status: ESTIMATE_STATUS.REJECTED,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        isDesignated: false,
        mover: { name: "김이사" },
        estimateRequest: {
          customerId: "customer123",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          id: "estimateRequest123",
          customer: { id: "customer123", name: "김고객" },
        },
      } as any;

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(null);
      mockedRepository.findDesignatedRequest.mockResolvedValue(null);
      mockedRepository.createEstimate.mockResolvedValue(
        mockRejectedEstimate as any
      );
      mockedRepository.getEstimateDetailForAction.mockResolvedValue(
        mockEstimateDetail
      );
      mockedActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        description: null,
        deletedAt: null,
        userId: "mover123",
        type: ActionType.ESTIMATE_REJECTED,
        entityId: "estimate123",
        entityType: "ESTIMATE",
        metadata: {},
      } as any);

      // Act
      const result = await moverEstimateService.rejectEstimate(mockRejectData);

      // Assert
      expect(result).toEqual({
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        price: 0,
        comment: "일정이 맞지 않아 반려합니다",
        status: "REJECTED",
        createdAt: mockRejectedEstimate.createdAt,
      });
      expect(mockedRepository.createEstimate).toHaveBeenCalledWith(
        mockRejectData.estimateRequestId,
        mockRejectData.moverId,
        0,
        mockRejectData.comment,
        ESTIMATE_STATUS.REJECTED,
        false
      );
      expect(mockedActionService.createAction).toHaveBeenCalledWith(
        "mover123",
        ActionType.ESTIMATE_REJECTED,
        "estimate123",
        "ESTIMATE",
        {
          moveType: "HOME",
          estimateRequestId: "estimateRequest123",
        }
      );
    });

    test("지정 견적을 성공적으로 반려한다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };

      const mockRejectedEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 0,
        comment: "지정 견적 반려",
        status: ESTIMATE_STATUS.REJECTED,
        rejectReason: null,
        isDesignated: true,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockEstimateDetail = {
        id: "estimate123",
        status: ESTIMATE_STATUS.REJECTED,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        isDesignated: true,
        mover: { name: "김이사" },
        estimateRequest: {
          customerId: "customer123",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          id: "estimateRequest123",
          customer: { id: "customer123", name: "김고객" },
        },
      } as any;

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(null);
      mockedRepository.findDesignatedRequest.mockResolvedValue({
        id: "designated123",
        createdAt: new Date(),
        status: REQUEST_STATUS.PENDING,
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        message: null,
        expiresAt: new Date(),
      });
      mockedRepository.createEstimate.mockResolvedValue(
        mockRejectedEstimate as any
      );
      mockedRepository.getEstimateDetailForAction.mockResolvedValue(
        mockEstimateDetail
      );
      mockedActionService.createAction.mockResolvedValue({
        id: "action123",
        createdAt: new Date(),
        description: null,
        deletedAt: null,
        userId: "mover123",
        type: ActionType.DESIGNATED_ESTIMATE_REQUEST_REJECTED,
        entityId: "estimate123",
        entityType: "DESIGNATED_ESTIMATE",
        metadata: {},
      } as any);

      // Act
      const result = await moverEstimateService.rejectEstimate(mockRejectData);

      // Assert
      expect(mockedRepository.createEstimate).toHaveBeenCalledWith(
        mockRejectData.estimateRequestId,
        mockRejectData.moverId,
        0,
        mockRejectData.comment,
        ESTIMATE_STATUS.REJECTED,
        true
      );
      expect(mockedActionService.createAction).toHaveBeenCalledWith(
        "mover123",
        ActionType.DESIGNATED_ESTIMATE_REQUEST_REJECTED,
        "estimate123",
        "DESIGNATED_ESTIMATE",
        {
          moveType: "HOME",
          estimateRequestId: "estimateRequest123",
        }
      );
    });

    test("잘못된 입력값으로 반려 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateService.rejectEstimate({
          ...mockRejectData,
          moverId: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.rejectEstimate({
          ...mockRejectData,
          estimateRequestId: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.rejectEstimate({
          ...mockRejectData,
          comment: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.rejectEstimate({
          ...mockRejectData,
          comment: "   ",
        })
      ).rejects.toThrow(ServiceValidationError);
    });

    test("견적 요청이 존재하지 않을 때 MoverInvalidEstimateRequestError를 던진다", async () => {
      // Arrange
      mockedRepository.findEstimateRequestById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        moverEstimateService.rejectEstimate(mockRejectData)
      ).rejects.toThrow(MoverInvalidEstimateRequestError);
    });

    test("견적 요청 상태가 PENDING이 아닐 때 MoverInvalidEstimateRequestError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.COMPLETED,
        moveDate: new Date("2025-08-10"),
      };
      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        moverEstimateService.rejectEstimate(mockRejectData)
      ).rejects.toThrow(MoverInvalidEstimateRequestError);
    });

    test("이사일이 지났을 때 MoverExpiredEstimateRequestError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2024-01-01"), // 과거 날짜
      };
      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );

      // Act & Assert
      await expect(
        moverEstimateService.rejectEstimate(mockRejectData)
      ).rejects.toThrow(MoverExpiredEstimateRequestError);
    });

    test("이미 견적이 존재할 때 MoverEstimateDuplicateError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };
      const mockExistingEstimate = {
        id: "existingEstimate",
        status: ESTIMATE_STATUS.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "기존 견적",
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      };

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(
        mockExistingEstimate
      );

      // Act & Assert
      await expect(
        moverEstimateService.rejectEstimate(mockRejectData)
      ).rejects.toThrow(MoverEstimateDuplicateError);
    });

    test("견적 반려 실패 시 ServiceError를 던진다", async () => {
      // Arrange
      const mockEstimateRequest = {
        status: REQUEST_STATUS.PENDING,
        moveDate: new Date("2025-08-10"),
      };

      mockedRepository.findEstimateRequestById.mockResolvedValue(
        mockEstimateRequest
      );
      mockedRepository.findExistingEstimate.mockResolvedValue(null);
      mockedRepository.findDesignatedRequest.mockResolvedValue(null);
      mockedRepository.createEstimate.mockResolvedValue(null);

      // Act & Assert
      await expect(
        moverEstimateService.rejectEstimate(mockRejectData)
      ).rejects.toThrow(ServiceError);
    });

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      mockedRepository.findEstimateRequestById.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        moverEstimateService.rejectEstimate(mockRejectData)
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("견적 상태 업데이트", () => {
    const mockData = {
      estimateId: "estimate123",
      moverId: "mover123",
      status: ESTIMATE_STATUS.ACCEPTED,
    };

    test("성공적으로 견적 상태를 업데이트한다", async () => {
      // Arrange
      const mockUpdatedEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest1",
        price: 500000,
        comment: "합리적인 가격",
        status: ESTIMATE_STATUS.ACCEPTED,
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
          name: "김이사",
          moverImage: null,
          nickname: "김이사",
          shortIntro: "5년 경력의 전문 이사업체",
          detailIntro: "신중하고 안전한 이사 서비스",
          career: 5,
          workedCount: 120,
          averageRating: 4.8,
          totalReviewCount: 45,
          serviceTypes: ["HOME", "SMALL"],
        },
        estimateRequest: {
          id: "estimateRequest1",
          customerId: "customer1",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: REQUEST_STATUS.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL" as RegionType,
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: REGION_TYPE.SEOUL,
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: REGION_TYPE.SEOUL,
          },
        },
      };

      mockedRepository.checkEstimateOwnership.mockResolvedValue(true);
      mockedRepository.updateEstimateStatus.mockResolvedValue(
        mockUpdatedEstimate
      );

      // Act
      const result = await moverEstimateService.updateEstimateStatus(mockData);

      // Assert
      expect(result).toEqual({
        id: "estimate123",
        status: "ACCEPTED",
        updatedAt: mockUpdatedEstimate.updatedAt,
      });
      expect(mockedRepository.checkEstimateOwnership).toHaveBeenCalledWith(
        mockData.estimateId,
        mockData.moverId
      );
      expect(mockedRepository.updateEstimateStatus).toHaveBeenCalledWith(
        mockData.estimateId,
        mockData.status
      );
    });

    test("견적 소유권이 없을 때 MoverUnauthorizedAccessError를 던진다", async () => {
      // Arrange
      mockedRepository.checkEstimateOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(
        moverEstimateService.updateEstimateStatus(mockData)
      ).rejects.toThrow(MoverUnauthorizedAccessError);
    });

    test("잘못된 입력값으로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateService.updateEstimateStatus({
          ...mockData,
          moverId: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.updateEstimateStatus({
          ...mockData,
          estimateId: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.updateEstimateStatus({
          ...mockData,
          status: "INVALID_STATUS" as any,
        })
      ).rejects.toThrow(ServiceValidationError);
    });

    test("AUTO_REJECTED 상태로 업데이트 시 MoverUnauthorizedAccessError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateService.updateEstimateStatus({
          ...mockData,
          status: ESTIMATE_STATUS.AUTO_REJECTED,
        })
      ).rejects.toThrow(MoverUnauthorizedAccessError);
    });

    test("견적 상태 업데이트 실패 시 ServiceError를 던진다", async () => {
      // Arrange
      mockedRepository.checkEstimateOwnership.mockResolvedValue(true);
      mockedRepository.updateEstimateStatus.mockResolvedValue(null);

      // Act & Assert
      await expect(
        moverEstimateService.updateEstimateStatus(mockData)
      ).rejects.toThrow(ServiceError);
    });

    test("Repository 에러 발생 시 ServiceError로 래핑한다", async () => {
      // Arrange
      mockedRepository.checkEstimateOwnership.mockRejectedValue(
        new RepositoryError("Repository 에러")
      );

      // Act & Assert
      await expect(
        moverEstimateService.updateEstimateStatus(mockData)
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("견적서 업데이트", () => {
    const mockData = {
      estimateId: "estimate123",
      moverId: "mover123",
      price: 600000,
      comment: "업데이트된 견적 코멘트",
    };

    test("성공적으로 견적서를 업데이트한다", async () => {
      // Arrange
      const mockUpdatedEstimate = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest1",
        price: 600000,
        comment: "업데이트된 견적 코멘트",
        status: ESTIMATE_STATUS.PROPOSED,
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
          name: "김이사",
          moverImage: null,
          nickname: "김이사",
          shortIntro: "5년 경력의 전문 이사업체",
          detailIntro: "신중하고 안전한 이사 서비스",
          career: 5,
          workedCount: 120,
          averageRating: 4.8,
          totalReviewCount: 45,
          serviceTypes: ["HOME", "SMALL"],
        },
        estimateRequest: {
          id: "estimateRequest1",
          customerId: "customer1",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: REQUEST_STATUS.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL" as RegionType,
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: REGION_TYPE.SEOUL,
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: REGION_TYPE.SEOUL,
          },
        },
      };

      mockedRepository.checkEstimateOwnership.mockResolvedValue(true);
      mockedRepository.findExistingEstimate.mockResolvedValue({
        id: "estimate123",
        status: ESTIMATE_STATUS.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest1",
        price: 500000,
        comment: "기존 견적",
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      } as any);
      mockedRepository.updateEstimatePrice.mockResolvedValue(
        mockUpdatedEstimate
      );

      // Act
      const result = await moverEstimateService.updateEstimate(mockData);

      // Assert
      expect(result).toEqual({
        id: "estimate123",
        price: 600000,
        comment: "업데이트된 견적 코멘트",
        updatedAt: mockUpdatedEstimate.updatedAt,
      });
      expect(mockedRepository.checkEstimateOwnership).toHaveBeenCalledWith(
        mockData.estimateId,
        mockData.moverId
      );
      expect(mockedRepository.updateEstimatePrice).toHaveBeenCalledWith(
        mockData.estimateId,
        mockData.price,
        mockData.comment
      );
    });

    test("견적 소유권이 없을 때 MoverUnauthorizedAccessError를 던진다", async () => {
      // Arrange
      mockedRepository.checkEstimateOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(
        moverEstimateService.updateEstimate(mockData)
      ).rejects.toThrow(MoverUnauthorizedAccessError);
    });

    test("견적 상태가 PROPOSED가 아닐 때 MoverInvalidEstimateStatusError를 던진다", async () => {
      // Arrange
      mockedRepository.checkEstimateOwnership.mockResolvedValue(true);
      mockedRepository.findExistingEstimate.mockResolvedValue({
        id: "estimate123",
        status: ESTIMATE_STATUS.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        moverId: "mover123",
        estimateRequestId: "estimateRequest1",
        price: 500000,
        comment: "기존 견적",
        rejectReason: null,
        isDesignated: false,
        workingHours: null,
        includesPackaging: false,
        insuranceAmount: null,
        validUntil: null,
      } as any);

      // Act & Assert
      await expect(
        moverEstimateService.updateEstimate(mockData)
      ).rejects.toThrow(MoverInvalidEstimateStatusError);
    });

    test("잘못된 입력값으로 호출 시 ServiceValidationError를 던진다", async () => {
      // Act & Assert
      await expect(
        moverEstimateService.updateEstimate({
          ...mockData,
          moverId: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.updateEstimate({
          ...mockData,
          estimateId: "",
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.updateEstimate({
          ...mockData,
          price: 0,
        })
      ).rejects.toThrow(ServiceValidationError);

      await expect(
        moverEstimateService.updateEstimate({
          ...mockData,
          comment: "",
        })
      ).rejects.toThrow(ServiceValidationError);
    });
  });
});
