import { Request, Response, NextFunction } from "express";
import customerEstimateRequestController from "./customerEstimateRequest.controller";
import customerEstimateRequestService from "../services/customerEstimateRequest.service";
import { ControllerAuthError } from "../types/errors.types";
import { NotFoundError } from "../types/commonError.types";

// Service 모킹
jest.mock("../services/customerEstimateRequest.service");

const mockCustomerEstimateRequestService =
  customerEstimateRequestService as jest.Mocked<
    typeof customerEstimateRequestService
  >;

describe("고객 견적 요청 컨트롤러", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        userId: "user123",
        name: "테스트유저",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      },
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe("진행중인 견적 요청 조회", () => {
    it("성공적으로 진행중인 견적요청을 조회한다", async () => {
      // Arrange
      const mockData = {
        estimateRequest: {
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
        },
        estimates: [],
      };

      mockCustomerEstimateRequestService.getPendingEstimateRequest.mockResolvedValue(
        mockData
      );

      // Act
      await customerEstimateRequestController.getPendingEstimateRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(
        mockCustomerEstimateRequestService.getPendingEstimateRequest
      ).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "진행중인 견적요청 조회 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 401 에러를 반환한다", async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await customerEstimateRequestController.getPendingEstimateRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message:
          "[Controller 오류] 인증 실패: 유효하지 않은 사용자 정보입니다.",
        code: "CTRL_3003",
        layer: "CONTROLLER",
      });
    });

    it("userId가 문자열이 아닐 때 401 에러를 반환한다", async () => {
      // Arrange
      mockRequest.user = {
        userId: 123 as unknown as string,
        name: "테스트유저",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      };

      // Act
      await customerEstimateRequestController.getPendingEstimateRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message:
          "[Controller 오류] 인증 실패: 유효하지 않은 사용자 정보입니다.",
        code: "CTRL_3003",
        layer: "CONTROLLER",
      });
    });

    it("Service에서 에러가 발생했을 때 next()를 호출한다", async () => {
      // Arrange
      const mockError = new Error("Service error");
      mockCustomerEstimateRequestService.getPendingEstimateRequest.mockRejectedValue(
        mockError
      );

      // Act
      await customerEstimateRequestController.getPendingEstimateRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("완료된 견적 요청 목록 조회", () => {
    it("성공적으로 완료된 견적요청 목록을 조회한다", async () => {
      // Arrange
      const mockData = [
        {
          estimateRequest: {
            id: "estimateRequest123",
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
          },
          estimates: [],
        },
      ];

      mockCustomerEstimateRequestService.getReceivedEstimateRequests.mockResolvedValue(
        mockData
      );

      // Act
      await customerEstimateRequestController.getReceivedEstimateRequests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(
        mockCustomerEstimateRequestService.getReceivedEstimateRequests
      ).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "완료된 견적요청 목록 조회 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 401 에러를 반환한다", async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await customerEstimateRequestController.getReceivedEstimateRequests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message:
          "[Controller 오류] 인증 실패: 유효하지 않은 사용자 정보입니다.",
        code: "CTRL_3003",
        layer: "CONTROLLER",
      });
    });

    it("userId가 문자열이 아닐 때 401 에러를 반환한다", async () => {
      // Arrange
      mockRequest.user = {
        userId: 123 as unknown as string,
        name: "테스트유저",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      };

      // Act
      await customerEstimateRequestController.getReceivedEstimateRequests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message:
          "[Controller 오류] 인증 실패: 유효하지 않은 사용자 정보입니다.",
        code: "CTRL_3003",
        layer: "CONTROLLER",
      });
    });

    it("NotFoundError가 발생했을 때 404 에러를 반환한다", async () => {
      // Arrange
      mockCustomerEstimateRequestService.getReceivedEstimateRequests.mockRejectedValue(
        new NotFoundError("완료된 견적요청이 없습니다.")
      );

      // Act
      await customerEstimateRequestController.getReceivedEstimateRequests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "완료된 견적요청이 없습니다.",
        code: 404,
        layer: "SERVICE",
      });
    });

    it("code가 없는 NotFoundError가 발생했을 때 기본 코드를 사용한다", async () => {
      // Arrange
      const notFoundError = new NotFoundError("완료된 견적요청이 없습니다.");
      notFoundError.code = undefined; // code를 undefined로 설정
      mockCustomerEstimateRequestService.getReceivedEstimateRequests.mockRejectedValue(
        notFoundError
      );

      // Act
      await customerEstimateRequestController.getReceivedEstimateRequests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "완료된 견적요청이 없습니다.",
        code: "NOT_FOUND",
        layer: "SERVICE",
      });
    });

    it("Service에서 에러가 발생했을 때 next()를 호출한다", async () => {
      // Arrange
      const mockError = new Error("Service error");
      mockCustomerEstimateRequestService.getReceivedEstimateRequests.mockRejectedValue(
        mockError
      );

      // Act
      await customerEstimateRequestController.getReceivedEstimateRequests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("견적 확정", () => {
    it("성공적으로 견적을 확정한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      const mockData = {
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

      mockCustomerEstimateRequestService.confirmEstimate.mockResolvedValue(
        mockData
      );

      // Act
      await customerEstimateRequestController.confirmEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(
        mockCustomerEstimateRequestService.confirmEstimate
      ).toHaveBeenCalledWith("user123", "estimate123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 확정 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 401 에러를 반환한다", async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.query = { estimateId: "estimate123" };

      // Act
      await customerEstimateRequestController.confirmEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message:
          "[Controller 오류] 인증 실패: 유효하지 않은 사용자 정보입니다.",
        code: "CTRL_3003",
        layer: "CONTROLLER",
      });
    });

    it("estimateId가 없을 때 400 에러를 반환한다", async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await customerEstimateRequestController.confirmEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적 ID입니다.",
      });
    });

    it("estimateId가 문자열이 아닐 때 400 에러를 반환한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: 123 as unknown as string };

      // Act
      await customerEstimateRequestController.confirmEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적 ID입니다.",
      });
    });

    it("Service에서 에러가 발생했을 때 next()를 호출한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      const mockError = new Error("Service error");
      mockCustomerEstimateRequestService.confirmEstimate.mockRejectedValue(
        mockError
      );

      // Act
      await customerEstimateRequestController.confirmEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("견적 취소", () => {
    it("성공적으로 견적을 취소한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      const mockData = {
        id: "estimate123",
        estimateRequestId: "estimateRequest123",
        price: null,
        comment: "고객 요청으로 취소",
        status: "REJECTED",
        isDesignated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerEstimateRequestService.cancelEstimate.mockResolvedValue(
        mockData
      );

      // Act
      await customerEstimateRequestController.cancelEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(
        mockCustomerEstimateRequestService.cancelEstimate
      ).toHaveBeenCalledWith("user123", "estimate123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 취소 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 401 에러를 반환한다", async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.query = { estimateId: "estimate123" };

      // Act
      await customerEstimateRequestController.cancelEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message:
          "[Controller 오류] 인증 실패: 유효하지 않은 사용자 정보입니다.",
        code: "CTRL_3003",
        layer: "CONTROLLER",
      });
    });

    it("estimateId가 없을 때 400 에러를 반환한다", async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await customerEstimateRequestController.cancelEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적 ID입니다.",
      });
    });

    it("estimateId가 문자열이 아닐 때 400 에러를 반환한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: 123 as unknown as string };

      // Act
      await customerEstimateRequestController.cancelEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적 ID입니다.",
      });
    });

    it("Service에서 에러가 발생했을 때 next()를 호출한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      const mockError = new Error("Service error");
      mockCustomerEstimateRequestService.cancelEstimate.mockRejectedValue(
        mockError
      );

      // Act
      await customerEstimateRequestController.cancelEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("이사 완료", () => {
    it("성공적으로 이사를 완료한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      const mockData = {
        estimateRequest: {
          id: "estimateRequest123",
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
        },
      };

      mockCustomerEstimateRequestService.completeEstimate.mockResolvedValue(
        mockData
      );

      // Act
      await customerEstimateRequestController.completeEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(
        mockCustomerEstimateRequestService.completeEstimate
      ).toHaveBeenCalledWith("user123", "estimate123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "이사완료 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 401 에러를 반환한다", async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.query = { estimateId: "estimate123" };

      // Act
      await customerEstimateRequestController.completeEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message:
          "[Controller 오류] 인증 실패: 유효하지 않은 사용자 정보입니다.",
        code: "CTRL_3003",
        layer: "CONTROLLER",
      });
    });

    it("estimateId가 없을 때 400 에러를 반환한다", async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await customerEstimateRequestController.completeEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적 ID입니다.",
      });
    });

    it("estimateId가 문자열이 아닐 때 400 에러를 반환한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: 123 as unknown as string };

      // Act
      await customerEstimateRequestController.completeEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "유효하지 않은 견적 ID입니다.",
      });
    });

    it("Service에서 에러가 발생했을 때 next()를 호출한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate123" };
      const mockError = new Error("Service error");
      mockCustomerEstimateRequestService.completeEstimate.mockRejectedValue(
        mockError
      );

      // Act
      await customerEstimateRequestController.completeEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
