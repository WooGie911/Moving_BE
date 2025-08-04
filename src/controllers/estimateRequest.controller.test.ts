import { Request, Response } from "express";
import EstimateRequestController from "./estimateRequest.controller";
import EstimateRequestService from "../services/estimateRequest.service";
import { convertRegionToKorean } from "../utils/addressUtils";
import { isBeforeKoreaToday, formatDateForAPI } from "../utils/dateUtils";

// Mock dependencies
jest.mock("../utils/addressUtils");
jest.mock("../utils/dateUtils");

const mockConvertRegionToKorean = convertRegionToKorean as jest.MockedFunction<typeof convertRegionToKorean>;
const mockIsBeforeKoreaToday = isBeforeKoreaToday as jest.MockedFunction<typeof isBeforeKoreaToday>;
const mockFormatDateForAPI = formatDateForAPI as jest.MockedFunction<typeof formatDateForAPI>;

// validateMoveDate 함수 모킹
const { validateMoveDate } = require("../utils/dateUtils");
const mockValidateMoveDate = validateMoveDate as jest.MockedFunction<typeof validateMoveDate>;

// Mock EstimateRequestService
jest.mock("../services/estimateRequest.service", () => {
  const mockMethods = {
    checkUserType: jest.fn(),
    hasPendingRequest: jest.fn(),
    createEstimateRequest: jest.fn(),
    getActiveEstimateRequestByUserId: jest.fn(),
    updateActiveEstimateRequest: jest.fn(),
    cancelActiveEstimateRequest: jest.fn(),
    hasEstimateFromMover: jest.fn(),
    checkCustomerProfile: jest.fn(),
    hasActiveRequestBeforeMoveDate: jest.fn(),
  };
  return jest.fn().mockImplementation(() => mockMethods);
});

// Get reference to mocked service after mocking
const mockEstimateRequestService = new (EstimateRequestService as any)();

describe("EstimateRequest 유저 플로우 테스트", () => {
  let controller: EstimateRequestController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new EstimateRequestController();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();

    // Mock console.error to prevent logs during testing
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Default mock implementations
    mockConvertRegionToKorean.mockReturnValue("서울특별시");
    mockIsBeforeKoreaToday.mockReturnValue(false);
    mockFormatDateForAPI.mockReturnValue("2024-12-25");
    mockValidateMoveDate.mockReturnValue({ isValid: true });

    // Default service mock implementations
    mockEstimateRequestService.checkCustomerProfile.mockResolvedValue(true);
    mockEstimateRequestService.hasActiveRequestBeforeMoveDate.mockResolvedValue(false);
  });

  afterEach(() => {
    // Restore console.error after each test
    jest.restoreAllMocks();
  });

  // 1. 기사님은 견적요청을 보낼 수 없다 - 일반 유저만 견적요청을 보낼 수 있다
  it("1. 기사님은 견적요청을 보낼 수 없다", async () => {
    // Arrange - 기사님 유저로 설정
    mockRequest = {
      user: {
        userId: "mover-user-id",
        name: "기사님",
        userType: "MOVER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
      body: {
        movingType: "home",
        movingDate: "2024-12-25",
        departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
        arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
      },
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: false, isMover: true });

    // Act
    await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "기사님은 견적 요청을 생성할 수 없습니다. 일반 고객으로 로그인해주세요.",
    });
  });

  // 2. 일반 유저는 이사유형 이사날 출발지 도착지를 입력해야만 견적요청을 보낼 수 있다
  it("2. 일반 유저는 필수 정보(이사유형, 이사날, 출발지, 도착지)를 모두 입력해야 한다", async () => {
    // Arrange - 출발지 주소가 누락된 경우
    mockRequest = {
      user: {
        userId: "customer-user-id",
        name: "고객",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
      body: {
        movingType: "home",
        movingDate: "2024-12-25",
        departure: { roadAddress: "", detailAddress: "123", zoneCode: "06123" }, // 빈 주소
        arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
      },
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
    mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);

    // Act
    await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "출발지 주소는 필수입니다.",
    });
  });

  // 3. 이사날이 과거일 수 없다
  it("3. 이사날은 과거일 수 없다", async () => {
    // Arrange - 과거 날짜로 설정
    mockRequest = {
      user: {
        userId: "customer-user-id",
        name: "고객",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
      body: {
        movingType: "home",
        movingDate: "2023-01-01", // 과거 날짜
        departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
        arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
      },
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
    mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);
    mockValidateMoveDate.mockReturnValue({
      isValid: false,
      errorMessage: "이사일은 오늘 이후로 설정해주세요.",
    });

    // Act
    await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "이사일은 오늘 이후로 설정해주세요.",
    });
  });

  // 4. 출발지와 도착지가 같을 수 없다
  it("4. 출발지와 도착지는 같을 수 없다", async () => {
    // Arrange - 같은 주소로 설정
    const sameAddress = { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" };
    mockRequest = {
      user: {
        userId: "customer-user-id",
        name: "고객",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
      body: {
        movingType: "home",
        movingDate: "2024-12-25",
        departure: sameAddress,
        arrival: sameAddress, // 같은 주소
      },
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
    mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);

    // Act
    await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "출발지와 도착지는 달라야 합니다.",
    });
  });

  // 5. 보낸 견적요청을 수정하거나 삭제할 수 있다
  it("5. 보낸 견적요청을 수정할 수 있다", async () => {
    // Arrange
    mockRequest = {
      user: {
        userId: "customer-user-id",
        name: "고객",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
      body: {
        movingType: "office",
        movingDate: "2024-12-26",
        departure: { roadAddress: "서울특별시 강남구 수정", detailAddress: "456", zoneCode: "06125" },
        arrival: { roadAddress: "서울특별시 서초구 수정", detailAddress: "789", zoneCode: "06126" },
        description: "수정된 이사",
      },
    };

    const mockActiveRequest = {
      id: "request-id",
      customerId: "customer-user-id",
      status: "PENDING",
      // ... other fields
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
    mockEstimateRequestService.hasPendingRequest.mockResolvedValue(true);
    mockEstimateRequestService.hasEstimateFromMover.mockResolvedValue(false);
    mockEstimateRequestService.getActiveEstimateRequestByUserId.mockResolvedValue(mockActiveRequest);
    mockEstimateRequestService.updateActiveEstimateRequest.mockResolvedValue(undefined);

    // Act
    await controller.updateActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockEstimateRequestService.updateActiveEstimateRequest).toHaveBeenCalledWith("request-id", mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "견적 요청이 성공적으로 수정되었습니다.",
      data: expect.any(Object),
    });
  });

  it("5. 보낸 견적요청을 삭제할 수 있다", async () => {
    // Arrange
    mockRequest = {
      user: {
        userId: "customer-user-id",
        name: "고객",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
    };

    const mockActiveRequest = {
      id: "request-id",
      customerId: "customer-user-id",
      status: "PENDING",
      // ... other fields
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
    mockEstimateRequestService.hasPendingRequest.mockResolvedValue(true);
    mockEstimateRequestService.hasEstimateFromMover.mockResolvedValue(false);
    mockEstimateRequestService.getActiveEstimateRequestByUserId.mockResolvedValue(mockActiveRequest);
    mockEstimateRequestService.cancelActiveEstimateRequest.mockResolvedValue(undefined);

    // Act
    await controller.cancelActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockEstimateRequestService.cancelActiveEstimateRequest).toHaveBeenCalledWith("request-id");
    expect(mockResponse.status).toHaveBeenCalledWith(204);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  // 6. 견적 요청에 기사님이 보낸 견적이 있을 경우 수정이나 삭제가 불가능하다
  it("6. 기사님이 견적을 보낸 경우 수정이 불가능하다", async () => {
    // Arrange
    mockRequest = {
      user: {
        userId: "customer-user-id",
        name: "고객",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
      body: {
        movingType: "office",
        movingDate: "2024-12-26",
      },
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
    mockEstimateRequestService.hasPendingRequest.mockResolvedValue(true);
    mockEstimateRequestService.hasEstimateFromMover.mockResolvedValue(true); // 기사님이 견적을 보냄

    // Act
    await controller.updateActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "기사님이 견적을 제출한 경우 수정할 수 없습니다. 견적을 확인한 후 결정해주세요.",
    });
  });

  it("6. 기사님이 견적을 보낸 경우 삭제가 불가능하다", async () => {
    // Arrange
    mockRequest = {
      user: {
        userId: "customer-user-id",
        name: "고객",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
    mockEstimateRequestService.hasPendingRequest.mockResolvedValue(true);
    mockEstimateRequestService.hasEstimateFromMover.mockResolvedValue(true); // 기사님이 견적을 보냄

    // Act
    await controller.cancelActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "기사님이 견적을 제출한 경우 취소할 수 없습니다. 견적을 확인한 후 결정해주세요.",
    });
  });

  // 7. 기사님은 견적요청을 조회할 수 없다
  it("7. 기사님은 견적요청을 조회할 수 없다", async () => {
    // Arrange
    mockRequest = {
      user: {
        userId: "mover-user-id",
        name: "기사님",
        userType: "MOVER" as const,
        hasProfile: true,
        iat: 1640995200,
        exp: 1641081600,
      },
    };

    mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: false, isMover: true });

    // Act
    await controller.getActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "기사님은 견적 요청을 생성할 수 없습니다. 일반 고객으로 로그인해주세요.",
    });
  });

  // 추가 테스트 케이스들 - 커버리지 향상을 위해
  describe("추가 테스트 케이스", () => {
    it("인증되지 않은 사용자 요청 처리", async () => {
      // Arrange - user가 없는 경우
      mockRequest = {
        body: {
          movingType: "home",
          movingDate: "2024-12-25",
          departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
          arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
        },
      };

      // Act
      await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "인증이 필요합니다.",
      });
    });

    it("빈 userId 처리", async () => {
      // Arrange - 빈 userId
      mockRequest = {
        user: {
          userId: "",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "home",
          movingDate: "2024-12-25",
          departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
          arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
        },
      };

      // Act
      await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "인증이 필요합니다.",
      });
    });

    it("잘못된 날짜 형식 처리", async () => {
      // Arrange - 잘못된 날짜 형식
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "home",
          movingDate: "invalid-date",
          departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
          arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);
      mockValidateMoveDate.mockReturnValue({
        isValid: false,
        errorMessage: "올바른 날짜 형식이 아닙니다. (YYYY-MM-DD 형식으로 입력해주세요)",
      });

      // Act
      await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "올바른 날짜 형식이 아닙니다. (YYYY-MM-DD 형식으로 입력해주세요)",
      });
    });

    it("잘못된 이사 유형 처리", async () => {
      // Arrange - 잘못된 이사 유형
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "invalid-type",
          movingDate: "2024-12-25",
          departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
          arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);

      // Act
      await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "이사 종류는 small, home, office 중 하나여야 합니다.",
      });
    });

    it("도착지 주소 누락 처리", async () => {
      // Arrange - 도착지 주소 누락
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "home",
          movingDate: "2024-12-25",
          departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
          arrival: { roadAddress: "", detailAddress: "456", zoneCode: "06124" }, // 빈 도착지 주소
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);

      // Act
      await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "도착지 주소는 필수입니다.",
      });
    });

    it("이미 진행중인 견적 요청이 있는 경우", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "home",
          movingDate: "2024-12-25",
          departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
          arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasActiveRequestBeforeMoveDate.mockResolvedValue(true); // 이미 진행중인 요청

      // Act
      await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "이사일이 지나지 않은 견적 요청이 있습니다.",
      });
    });

    it("성공적인 견적 요청 생성", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "home",
          movingDate: "2024-12-25",
          departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
          arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
          description: "이사 요청",
        },
      };

      const mockCreatedRequest = {
        id: "request-id",
        customerId: "customer-user-id",
        moveType: "HOME",
        moveDate: new Date("2024-12-25"),
        status: "PENDING",
        fromAddress: {
          region: "SEOUL",
          city: "강남구",
          district: "테헤란로",
          detail: "123",
          zoneCode: "06123",
        },
        toAddress: {
          region: "SEOUL",
          city: "서초구",
          district: "서초동",
          detail: "456",
          zoneCode: "06124",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);
      mockEstimateRequestService.createEstimateRequest.mockResolvedValue(undefined);
      mockEstimateRequestService.getActiveEstimateRequestByUserId.mockResolvedValue(mockCreatedRequest);

      // Act
      await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 요청이 성공적으로 생성되었습니다.",
        data: expect.any(Object),
      });
    });

    it("활성 견적 요청이 없는 경우 조회", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.getActiveEstimateRequestByUserId.mockResolvedValue(null);

      // Act
      await controller.getActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        hasActive: false,
        hasEstimate: false,
      });
    });

    it("진행중인 요청이 없는 경우 수정 시도", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "office",
          movingDate: "2024-12-26",
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);

      // Act
      await controller.updateActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "진행중(PENDING) 상태에서만 수정할 수 있습니다.",
      });
    });

    it("활성 견적 요청이 없는 경우 수정 시도", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "office",
          movingDate: "2024-12-26",
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(true);
      mockEstimateRequestService.hasEstimateFromMover.mockResolvedValue(false);
      mockEstimateRequestService.getActiveEstimateRequestByUserId.mockResolvedValue(null);

      // Act
      await controller.updateActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "활성 견적 요청이 없습니다.",
      });
    });

    it("PENDING이 아닌 상태의 요청 수정 시도", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "office",
          movingDate: "2024-12-26",
        },
      };

      const mockActiveRequest = {
        id: "request-id",
        customerId: "customer-user-id",
        status: "COMPLETED", // PENDING이 아닌 상태
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(true);
      mockEstimateRequestService.hasEstimateFromMover.mockResolvedValue(false);
      mockEstimateRequestService.getActiveEstimateRequestByUserId.mockResolvedValue(mockActiveRequest);

      // Act
      await controller.updateActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "진행중(PENDING) 상태에서만 수정할 수 있습니다.",
      });
    });

    it("진행중인 요청이 없는 경우 취소 시도", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(false);

      // Act
      await controller.cancelActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "진행중(PENDING) 상태에서만 취소할 수 있습니다.",
      });
    });

    it("활성 견적 요청이 없는 경우 취소 시도", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(true);
      mockEstimateRequestService.hasEstimateFromMover.mockResolvedValue(false);
      mockEstimateRequestService.getActiveEstimateRequestByUserId.mockResolvedValue(null);

      // Act
      await controller.cancelActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "활성 견적 요청이 없습니다.",
      });
    });

    it("PENDING이 아닌 상태의 요청 취소 시도", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
      };

      const mockActiveRequest = {
        id: "request-id",
        customerId: "customer-user-id",
        status: "COMPLETED", // PENDING이 아닌 상태
      };

      mockEstimateRequestService.checkUserType.mockResolvedValue({ isCustomer: true, isMover: false });
      mockEstimateRequestService.hasPendingRequest.mockResolvedValue(true);
      mockEstimateRequestService.hasEstimateFromMover.mockResolvedValue(false);
      mockEstimateRequestService.getActiveEstimateRequestByUserId.mockResolvedValue(mockActiveRequest);

      // Act
      await controller.cancelActiveEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "진행중(PENDING) 상태에서만 취소할 수 있습니다.",
      });
    });

    it("서비스 에러 처리", async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: "customer-user-id",
          name: "고객",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1640995200,
          exp: 1641081600,
        },
        body: {
          movingType: "home",
          movingDate: "2024-12-25",
          departure: { roadAddress: "서울특별시 강남구", detailAddress: "123", zoneCode: "06123" },
          arrival: { roadAddress: "서울특별시 서초구", detailAddress: "456", zoneCode: "06124" },
        },
      };

      mockEstimateRequestService.checkUserType.mockRejectedValue(new Error("서비스 에러"));

      // Act
      await controller.createEstimateRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "서비스 에러",
      });
    });
  });
});
