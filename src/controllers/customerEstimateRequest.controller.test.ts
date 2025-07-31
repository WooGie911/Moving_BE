import { Request, Response, NextFunction } from "express";
import customerEstimateRequestController from "./customerEstimateRequest.controller";
import customerEstimateRequestService from "../services/customerEstimateRequest.service";
import { ControllerAuthError } from "../types/errors.types";
import { NotFoundError } from "../types/commonError.types";
import { MoveType, RequestStatus, EstimateStatus } from "@prisma/client";

// Service 모킹
jest.mock("../services/customerEstimateRequest.service");
const mockedService = customerEstimateRequestService as jest.Mocked<
  typeof customerEstimateRequestService
>;

describe("customerEstimateRequestController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        userId: "user123",
        name: "테스트 사용자",
        userType: "CUSTOMER" as const,
        hasProfile: true,
        iat: 1234567890,
        exp: 1234567890,
      },
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("getPendingEstimateRequest", () => {
    it("성공적으로 진행중인 견적요청을 조회한다", async () => {
      // Arrange
      const mockData = {
        estimateRequest: {
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
            status: "PROPOSED" as EstimateStatus,
            isDesignated: false,
            createdAt: new Date("2025-07-31"),
            mover: {
              id: "mover1",
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
              totalFavoriteCount: 10,
              isFavorite: true,
              Favorite: [{ id: "favorite1" }],
            },
          },
        ],
      };

      mockedService.getPendingEstimateRequest.mockResolvedValue(mockData);

      // Act
      await customerEstimateRequestController.getPendingEstimateRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockedService.getPendingEstimateRequest).toHaveBeenCalledWith(
        "user123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "진행중인 견적요청 조회 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 ControllerAuthError를 던진다", async () => {
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

    it("Service 에러가 발생했을 때 next로 에러를 전달한다", async () => {
      // Arrange
      const mockError = new Error("Service 에러");
      mockedService.getPendingEstimateRequest.mockRejectedValue(mockError);

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

  describe("getReceivedEstimateRequests", () => {
    it("성공적으로 완료된 견적요청 목록을 조회한다", async () => {
      // Arrange
      const mockData = [
        {
          estimateRequest: {
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
              status: "ACCEPTED" as EstimateStatus,
              isDesignated: true,
              createdAt: new Date("2024-01-11"),
              mover: {
                id: "mover1",
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
                totalFavoriteCount: 10,
                isFavorite: true,
                Favorite: [{ id: "favorite1" }],
              },
            },
          ],
        },
      ];

      mockedService.getReceivedEstimateRequests.mockResolvedValue(mockData);

      // Act
      await customerEstimateRequestController.getReceivedEstimateRequests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockedService.getReceivedEstimateRequests).toHaveBeenCalledWith(
        "user123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "완료된 견적요청 목록 조회 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 ControllerAuthError를 던진다", async () => {
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

    it("NotFoundError가 발생했을 때 404 응답을 반환한다", async () => {
      // Arrange
      const mockError = new NotFoundError("완료된 견적요청이 없습니다.");
      mockedService.getReceivedEstimateRequests.mockRejectedValue(mockError);

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
  });

  describe("confirmEstimate", () => {
    it("성공적으로 견적을 확정한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate1" };
      const mockData = {
        estimateRequest: {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "HOME" as MoveType,
          moveDate: new Date("2025-08-10"),
          createdAt: new Date("2024-07-30"),
          description: "이사 견적 요청",
          status: "APPROVED" as RequestStatus,
          updatedAt: new Date("2024-07-30"),
          deletedAt: null,
          fromAddressId: "address1",
          toAddressId: "address2",
        },
        estimate: {
          id: "estimate1",
          createdAt: new Date("2024-07-30"),
          status: "ACCEPTED" as EstimateStatus,
          moverId: "mover1",
          estimateRequestId: "estimateRequest1",
          price: 500000,
          comment: "합리적인 가격",
          rejectReason: null,
          workingHours: "4",
          includesPackaging: false,
          isDesignated: true,
          insuranceAmount: 100000,
          validUntil: new Date("2024-08-30"),
          updatedAt: new Date("2024-07-30"),
          deletedAt: null,
        },
      };

      mockedService.confirmEstimate.mockResolvedValue(mockData);

      // Act
      await customerEstimateRequestController.confirmEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockedService.confirmEstimate).toHaveBeenCalledWith(
        "user123",
        "estimate1"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 확정 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 ControllerAuthError를 던진다", async () => {
      // Arrange
      mockRequest.user = undefined;

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

    it("견적 ID가 없을 때 400 응답을 반환한다", async () => {
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

    it("견적 ID가 문자열이 아닐 때 400 응답을 반환한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: 123 as any };

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
  });

  describe("cancelEstimate", () => {
    it("성공적으로 견적을 취소한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate1" };
      const mockData = {
        id: "estimate1",
        createdAt: new Date("2025-07-10T01:00:00.000Z"),
        status: "REJECTED" as EstimateStatus,
        moverId: "mover1",
        estimateRequestId: "estimateRequest1",
        price: null,
        comment: "고객 요청으로 취소",
        rejectReason: null,
        workingHours: "4",
        includesPackaging: false,
        isDesignated: false,
        insuranceAmount: 100000,
        validUntil: new Date("2025-08-10"),
        updatedAt: new Date("2025-07-10T02:00:00.000Z"),
        deletedAt: null,
      };

      mockedService.cancelEstimate.mockResolvedValue(mockData);

      // Act
      await customerEstimateRequestController.cancelEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockedService.cancelEstimate).toHaveBeenCalledWith(
        "user123",
        "estimate1"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "견적 취소 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 ControllerAuthError를 던진다", async () => {
      // Arrange
      mockRequest.user = undefined;

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

    it("견적 ID가 없을 때 400 응답을 반환한다", async () => {
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
  });

  describe("completeEstimate", () => {
    it("성공적으로 이사를 완료한다", async () => {
      // Arrange
      mockRequest.query = { estimateId: "estimate1" };
      const mockData = {
        estimateRequest: {
          id: "estimateRequest1",
          customerId: "user123",
          moveType: "SMALL" as MoveType,
          moveDate: new Date("2025-07-10T00:33:16.456Z"),
          createdAt: new Date("2025-07-10T00:33:16.456Z"),
          description: "이사 요청 설명",
          status: "COMPLETED" as RequestStatus,
          updatedAt: new Date("2025-07-10T00:33:16.456Z"),
          deletedAt: null,
          fromAddressId: "address1",
          toAddressId: "address2",
        },
      };

      mockedService.completeEstimate.mockResolvedValue(mockData);

      // Act
      await customerEstimateRequestController.completeEstimate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockedService.completeEstimate).toHaveBeenCalledWith(
        "user123",
        "estimate1"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "이사완료 성공",
        data: mockData,
      });
    });

    it("사용자 정보가 없을 때 ControllerAuthError를 던진다", async () => {
      // Arrange
      mockRequest.user = undefined;

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

    it("견적 ID가 없을 때 400 응답을 반환한다", async () => {
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
  });
});
