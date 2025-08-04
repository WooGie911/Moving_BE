import { Request, Response, NextFunction } from "express";
import moverEstimateController from "./moverEstimate.controller";
import moverEstimateService from "../services/moverEstimate.service";
import { ControllerAuthError, ErrorCode } from "../types/errors.types";
import { NotFoundError } from "../types/commonError.types";
import {
  TEstimateResponse,
  TEstimateRequestResponse,
  TMyEstimateResponse,
  TMyRejectedEstimateResponse,
  TCreateEstimateRequest,
  TRejectEstimateRequest,
  TUpdateEstimateRequest,
  TUpdateEstimateStatusRequest,
  TCreateEstimateResponse,
  TRejectEstimateResponse,
} from "../types/moverEstimate";

// Service 모킹
jest.mock("../services/moverEstimate.service");
const mockedService = moverEstimateService as jest.Mocked<
  typeof moverEstimateService
>;

describe("이사업체 견적 컨트롤러", () => {
  // 타입 안전한 테스트 헬퍼 함수들
  const createMockRequest = (overrides: Partial<Request> = {}): Request =>
    ({
      cookies: {},
      signedCookies: {},
      get: jest.fn(),
      headers: {},
      method: "GET",
      url: "/",
      params: {},
      query: {},
      body: {},
      user: {
        userId: "mover123",
        name: "김이사" as string | null,
        userType: "MOVER",
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      },
      ...overrides,
    }) as Request;

  const createMockResponse = (): Response =>
    ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }) as unknown as Response;

  const createMockNext = (): NextFunction => jest.fn();

  // 타입 정의들
  type MockUser = {
    userId: string;
    name: string | null;
    userType: "CUSTOMER" | "MOVER";
    hasProfile: boolean;
    iat: number;
    exp: number;
  };

  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = createMockRequest({
      user: {
        userId: "mover123",
        name: "김이사",
        userType: "MOVER",
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      },
      body: {},
      query: {},
    });

    mockResponse = createMockResponse();
    mockNext = createMockNext();
  });

  describe("견적 생성", () => {
    it("성공적으로 견적을 생성한다", async () => {
      // Arrange
      mockRequest.body = {
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격으로 안전한 이사 서비스 제공",
      } as TCreateEstimateRequest;

      const mockData: TCreateEstimateResponse = {
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        price: 500000,
        comment: "합리적인 가격으로 안전한 이사 서비스 제공",
        status: "PROPOSED",
        createdAt: new Date(),
      };

      mockedService.createEstimate.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.createEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.createEstimate).toHaveBeenCalledWith({
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        price: 500000,
        comment: "합리적인 가격으로 안전한 이사 서비스 제공",
      } as TCreateEstimateRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 생성 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 ControllerAuthError를 던진다", async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await moverEstimateController.createEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "[Controller 오류] 인증 실패: 유효하지 않은 사용자 정보입니다",
        code: ErrorCode.CONTROLLER_AUTH_ERROR,
      });
    });

    it("무버가 아닌 사용자가 요청할 때 403 응답을 반환한다", async () => {
      // Arrange
      mockRequest.user = {
        userId: "customer123",
        name: "김고객",
        userType: "CUSTOMER",
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      } as any;

      // Act
      await moverEstimateController.createEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "[기사 오류] 현재 유저타입이 기사가 아닙니다",
        code: ErrorCode.MOVER_UNAUTHORIZED_ACCESS,
      });
    });

    it("서비스 에러 시 next(error)를 호출한다", async () => {
      // Arrange
      mockRequest.body = {
        estimateRequestId: "estimateRequest123",
        price: 500000,
        comment: "합리적인 가격으로 안전한 이사 서비스 제공",
      } as TCreateEstimateRequest;
      const error = new Error("Service error");
      mockedService.createEstimate.mockRejectedValue(error);

      // Act
      await moverEstimateController.createEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("견적 반려", () => {
    it("성공적으로 견적을 반려한다", async () => {
      // Arrange
      mockRequest.body = {
        estimateRequestId: "estimateRequest123",
        comment: "일정이 맞지 않아 반려합니다",
      } as TRejectEstimateRequest;

      const mockData: TRejectEstimateResponse = {
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        price: null,
        comment: "일정이 맞지 않아 반려합니다",
        status: "REJECTED",
        createdAt: new Date(),
      };

      mockedService.rejectEstimate.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.rejectEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.rejectEstimate).toHaveBeenCalledWith({
        estimateRequestId: "estimateRequest123",
        moverId: "mover123",
        comment: "일정이 맞지 않아 반려합니다",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 반려 성공",
        data: mockData,
      });
    });

    it("견적 요청 ID가 없을 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.body = {
        comment: "반려 사유",
      };

      // Act
      await moverEstimateController.rejectEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적 요청 ID입니다.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("반려 사유가 없을 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.body = {
        estimateRequestId: "estimateRequest123",
        comment: "",
      };

      // Act
      await moverEstimateController.rejectEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "반려 사유를 입력해주세요.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("반려 사유가 500자를 초과할 때 400 응답을 반환한다", async () => {
      // Arrange
      const longComment = "a".repeat(501);
      mockRequest.body = {
        estimateRequestId: "estimateRequest123",
        comment: longComment,
      };

      // Act
      await moverEstimateController.rejectEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "반려 사유는 500자 이내로 입력해주세요.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("서비스 에러 시 next(error)를 호출한다", async () => {
      // Arrange
      mockRequest.body = {
        estimateRequestId: "estimateRequest123",
        comment: "일정이 맞지 않아 반려합니다",
      } as TRejectEstimateRequest;
      const error = new Error("Service error");
      mockedService.rejectEstimate.mockRejectedValue(error);

      // Act
      await moverEstimateController.rejectEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("지역 견적 요청 조회", () => {
    it("성공적으로 서비스 가능 지역 견적을 조회한다", async () => {
      // Arrange
      mockRequest.query = {
        sortBy: "createdAt",
        customerName: "김고객",
        movingType: "HOME",
      };

      const mockData = [
        {
          id: "estimateRequest1",
          customerId: "customer1",
          moveType: "HOME" as const,
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: "SEOUL",
          },
          estimates: [],
        },
      ];

      mockedService.getRegionEstimateRequest.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.getRegionEstimateRequest(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.getRegionEstimateRequest).toHaveBeenCalledWith(
        "mover123",
        "createdAt",
        "김고객",
        "HOME"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "서비스 가능 지역 견적 조회 성공",
        data: mockData,
      });
    });

    it("잘못된 정렬 옵션일 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.query = {
        sortBy: "invalidSort" as any,
      };

      // Act
      await moverEstimateController.getRegionEstimateRequest(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 정렬 옵션입니다.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("잘못된 이사 타입일 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.query = {
        movingType: "INVALID_TYPE" as any,
      };

      // Act
      await moverEstimateController.getRegionEstimateRequest(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 이사 타입입니다.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("서비스 에러 시 next(error)를 호출한다", async () => {
      // Arrange
      mockRequest.query = {
        sortBy: "createdAt",
        customerName: "김고객",
        movingType: "HOME",
      };
      const error = new Error("Service error");
      mockedService.getRegionEstimateRequest.mockRejectedValue(error);

      // Act
      await moverEstimateController.getRegionEstimateRequest(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("지정 견적 요청 조회", () => {
    it("성공적으로 지정 견적을 조회한다", async () => {
      // Arrange
      mockRequest.query = {
        sortBy: "moveDate",
        customerName: "김고객",
        movingType: "SMALL",
      };

      const mockData: TEstimateRequestResponse[] = [
        {
          id: "estimateRequest1",
          customerId: "customer1",
          moveType: "SMALL",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "소형 이사",
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: "SEOUL",
          },
          estimates: [],
        },
      ];

      mockedService.getDesignatedEstimateRequest.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.getDesignatedEstimateRequest(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.getDesignatedEstimateRequest).toHaveBeenCalledWith(
        "mover123",
        "moveDate",
        "김고객",
        "SMALL"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "지정 견적 조회 성공",
        data: mockData,
      });
    });
  });

  describe("전체 견적 요청 조회", () => {
    it("성공적으로 통합 견적을 조회한다", async () => {
      // Arrange
      mockRequest.query = {
        region: "true",
        designated: "false",
        sortBy: "createdAt",
        customerName: "김고객",
        movingType: "HOME",
      };

      const mockData = {
        regionEstimateRequests: [
          {
            id: "estimateRequest1",
            customerId: "customer1",
            moveType: "HOME" as const,
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "1인가구 이사",
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer1",
              name: "김고객",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: "김고객",
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "06123",
              city: "서울특별시",
              district: "강남구",
              detail: "테헤란로 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "06621",
              city: "서울특별시",
              district: "서초구",
              detail: "서초대로 456",
              region: "SEOUL",
            },
            estimates: [],
          },
        ],
        designatedEstimateRequests: [],
      };

      mockedService.getAllEstimateRequests.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.getAllEstimateRequests(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.getAllEstimateRequests).toHaveBeenCalledWith(
        "mover123",
        {
          region: true,
          designated: false,
          sortBy: "createdAt",
          customerName: "김고객",
          movingType: "HOME",
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 통합 조회 성공",
        data: mockData,
      });
    });

    it("region과 designated가 모두 false일 때 빈 결과를 반환한다", async () => {
      // Arrange
      mockRequest.query = {
        region: "false",
        designated: "false",
      };

      // Act
      await moverEstimateController.getAllEstimateRequests(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "조회 결과 없음",
        data: { regionEstimateRequests: [], designatedEstimateRequests: [] },
      });
    });
  });

  describe("내 견적서 조회", () => {
    it("성공적으로 내가 보낸 견적서를 조회한다", async () => {
      // Arrange
      const mockData: TMyEstimateResponse[] = [
        {
          id: "estimate1",
          moverId: "mover123",
          estimateRequestId: "estimateRequest1",
          price: 500000,
          comment: "합리적인 가격",
          status: "PROPOSED",
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
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "1인가구 이사",
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer1",
              name: "김고객",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: "김고객",
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "06123",
              city: "서울특별시",
              district: "강남구",
              detail: "테헤란로 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "06621",
              city: "서울특별시",
              district: "서초구",
              detail: "서초대로 456",
              region: "SEOUL",
            },
          },
        },
      ];

      mockedService.getMyEstimate.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.getMyEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.getMyEstimate).toHaveBeenCalledWith("mover123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "내가 보낸 견적서 조회 성공",
        data: mockData,
      });
    });
  });

  describe("내 반려 견적 조회", () => {
    it("성공적으로 내가 반려한 견적을 조회한다", async () => {
      // Arrange
      const mockData: TMyRejectedEstimateResponse[] = [
        {
          id: "estimate1",
          moverId: "mover123",
          estimateRequestId: "estimateRequest1",
          price: null,
          comment: "일정이 맞지 않아 반려합니다",
          status: "REJECTED",
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
            moveType: "HOME",
            moveDate: new Date("2025-08-10"),
            fromAddressId: "addr1",
            toAddressId: "addr2",
            description: "1인가구 이사",
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
            customer: {
              id: "customer1",
              name: "김고객",
              currentArea: "SEOUL",
              customerImage: null,
              nickname: "김고객",
            },
            fromAddress: {
              id: "addr1",
              zoneCode: "06123",
              city: "서울특별시",
              district: "강남구",
              detail: "테헤란로 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "addr2",
              zoneCode: "06621",
              city: "서울특별시",
              district: "서초구",
              detail: "서초대로 456",
              region: "SEOUL",
            },
          },
        },
      ];

      mockedService.getMyRejectedEstimates.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.getMyRejectedEstimates(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.getMyRejectedEstimates).toHaveBeenCalledWith(
        "mover123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "내가 반려한 견적 조회 성공",
        data: mockData,
      });
    });
  });

  describe("견적 상태 업데이트", () => {
    it("성공적으로 견적 상태를 업데이트한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = { status: "ACCEPTED" };

      const mockData: TEstimateResponse = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest1",
        price: 500000,
        comment: "합리적인 가격",
        status: "ACCEPTED",
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
          moveType: "HOME",
          moveDate: new Date("2025-08-10"),
          fromAddressId: "addr1",
          toAddressId: "addr2",
          description: "1인가구 이사",
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: "SEOUL",
          },
        },
      };

      mockedService.updateEstimateStatus.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.updateEstimateStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.updateEstimateStatus).toHaveBeenCalledWith({
        estimateId: "estimate123",
        moverId: "mover123",
        status: "ACCEPTED",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 상태 업데이트 성공",
        data: mockData,
      });
    });

    it("견적 ID가 없을 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.query = {};
      mockRequest.body = { status: "ACCEPTED" };

      // Act
      await moverEstimateController.updateEstimateStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적서 ID입니다.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("잘못된 견적 상태일 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = { status: "INVALID_STATUS" };

      // Act
      await moverEstimateController.updateEstimateStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적 상태입니다.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("사용자 정보가 없을 때 401 응답을 반환한다", async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = { status: "ACCEPTED" };

      // Act
      await moverEstimateController.updateEstimateStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 사용자 정보입니다.",
        code: ErrorCode.CONTROLLER_AUTH_ERROR,
      });
    });

    it("무버가 아닌 사용자가 요청할 때 403 응답을 반환한다", async () => {
      // Arrange
      mockRequest.user = {
        userId: "customer123",
        name: "김고객",
        userType: "CUSTOMER",
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      } as any;
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = { status: "ACCEPTED" };

      // Act
      await moverEstimateController.updateEstimateStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "현재 유저타입이 기사가 아닙니다.",
        code: ErrorCode.MOVER_UNAUTHORIZED_ACCESS,
      });
    });

    it("서비스 에러 시 next(error)를 호출한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = { status: "ACCEPTED" };
      const error = new Error("Service error");
      mockedService.updateEstimateStatus.mockRejectedValue(error);

      // Act
      await moverEstimateController.updateEstimateStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("견적서 업데이트", () => {
    it("성공적으로 견적서를 업데이트한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = {
        price: 600000,
        comment: "업데이트된 견적 코멘트",
      };

      const mockData = {
        id: "estimate123",
        moverId: "mover123",
        estimateRequestId: "estimateRequest1",
        price: 600000,
        comment: "업데이트된 견적 코멘트",
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
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: "customer1",
            name: "김고객",
            currentArea: "SEOUL",
            customerImage: null,
            nickname: "김고객",
          },
          fromAddress: {
            id: "addr1",
            zoneCode: "06123",
            city: "서울특별시",
            district: "강남구",
            detail: "테헤란로 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "addr2",
            zoneCode: "06621",
            city: "서울특별시",
            district: "서초구",
            detail: "서초대로 456",
            region: "SEOUL",
          },
        },
      };

      mockedService.updateEstimate.mockResolvedValue(mockData);

      // Act
      await moverEstimateController.updateEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockedService.updateEstimate).toHaveBeenCalledWith({
        estimateId: "estimate123",
        moverId: "mover123",
        price: 600000,
        comment: "업데이트된 견적 코멘트",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적서 업데이트 성공",
        data: mockData,
      });
    });

    it("견적 ID가 없을 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.query = {};
      mockRequest.body = {
        price: 600000,
        comment: "업데이트된 견적 코멘트",
      };

      // Act
      await moverEstimateController.updateEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적서 ID입니다.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("잘못된 가격일 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = {
        price: -1000,
        comment: "업데이트된 견적 코멘트",
      };

      // Act
      await moverEstimateController.updateEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 가격입니다.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("견적 코멘트가 없을 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = {
        price: 600000,
        comment: "",
      };

      // Act
      await moverEstimateController.updateEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "견적 코멘트를 입력해주세요.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("견적 코멘트가 1000자를 초과할 때 400 응답을 반환한다", async () => {
      // Arrange
      const longComment = "a".repeat(1001);
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = {
        price: 600000,
        comment: longComment,
      };

      // Act
      await moverEstimateController.updateEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "견적 코멘트는 1000자 이내로 입력해주세요.",
        code: ErrorCode.CONTROLLER_VALIDATION_ERROR,
      });
    });

    it("사용자 정보가 없을 때 401 응답을 반환한다", async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = {
        price: 600000,
        comment: "업데이트된 견적 코멘트",
      };

      // Act
      await moverEstimateController.updateEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 사용자 정보입니다.",
        code: ErrorCode.CONTROLLER_AUTH_ERROR,
      });
    });

    it("무버가 아닌 사용자가 요청할 때 403 응답을 반환한다", async () => {
      // Arrange
      mockRequest.user = {
        userId: "customer123",
        name: "김고객",
        userType: "CUSTOMER",
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      } as any;
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = {
        price: 600000,
        comment: "업데이트된 견적 코멘트",
      };

      // Act
      await moverEstimateController.updateEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "현재 유저타입이 기사가 아닙니다.",
        code: ErrorCode.MOVER_UNAUTHORIZED_ACCESS,
      });
    });

    it("서비스 에러 시 next(error)를 호출한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      mockRequest.body = {
        price: 600000,
        comment: "업데이트된 견적 코멘트",
      };
      const error = new Error("Service error");
      mockedService.updateEstimate.mockRejectedValue(error);

      // Act
      await moverEstimateController.updateEstimate(
        mockRequest,
        mockResponse,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
