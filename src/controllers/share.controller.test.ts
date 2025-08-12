import { Request, Response } from "express";
import shareService from "../services/share.service";
import shareController from "./share.controller";
import { ControllerError } from "../types/errors.types";

jest.mock("../services/share.service");

describe("shareController", () => {
  const mockGetShareData = shareService.getShareData as jest.Mock;

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response> as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getShareData", () => {
    const mockEstimateRequestData = {
      id: "estimate-request-1",
      customerId: "customer-1",
      moveType: "HOME" as const,
      moveDate: new Date("2024-01-15"),
      fromAddressId: "address-1",
      toAddressId: "address-2",
      description: "이사 견적 요청입니다.",
      status: "PENDING",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      customer: {
        id: "customer-1",
        nickname: "홍길동",
        name: "홍길동",
      },
      fromAddress: {
        zoneCode: "12345",
        city: "서울특별시",
        district: "강남구",
        detail: "테헤란로 123",
        region: "강남",
      },
      toAddress: {
        zoneCode: "67890",
        city: "서울특별시",
        district: "서초구",
        detail: "서초대로 456",
        region: "서초",
      },
    };

    const mockEstimateData = {
      id: "estimate-1",
      moverId: "mover-1",
      estimateRequestId: "estimate-request-1",
      price: 150000,
      comment: "안전하고 신속한 이사 서비스를 제공합니다.",
      status: "PROPOSED" as const,
      rejectReason: null,
      isDesignated: false,
      workingHours: "4시간",
      includesPackaging: true,
      insuranceAmount: 1000000,
      validUntil: new Date("2024-01-31T23:59:59Z"),
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      deletedAt: null,
    };

    it("✅ 견적요청 ID와 견적 ID로 공유 데이터를 성공적으로 조회한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: "estimate-request-1",
          estimateId: "estimate-1",
        },
      } as Partial<Request> as Request;

      const mockShareData = {
        estimateRequest: mockEstimateRequestData,
        estimate: mockEstimateData,
      };

      mockGetShareData.mockResolvedValue(mockShareData);

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).toHaveBeenCalledWith(
        "estimate-request-1",
        "estimate-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockShareData,
      });
    });

    it("✅ 견적요청 ID만으로 공유 데이터를 성공적으로 조회한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: "estimate-request-1",
        },
      } as Partial<Request> as Request;

      const mockShareData = {
        estimateRequest: mockEstimateRequestData,
        estimate: null,
      };

      mockGetShareData.mockResolvedValue(mockShareData);

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).toHaveBeenCalledWith(
        "estimate-request-1",
        undefined
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockShareData,
      });
    });

    it("❌ 견적요청 ID가 없으면 400 에러를 반환한다", async () => {
      // Setup
      const mockReq = {
        params: {},
      } as Partial<Request> as Request;

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "견적요청 ID가 필요합니다.",
      });
    });

    it("❌ 견적요청 ID가 빈 문자열이면 400 에러를 반환한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: "",
        },
      } as Partial<Request> as Request;

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "견적요청 ID가 필요합니다.",
      });
    });

    it("❌ 견적요청 ID가 null이면 400 에러를 반환한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: null as any,
        },
      } as Partial<Request> as Request;

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "견적요청 ID가 필요합니다.",
      });
    });

    it("❌ ControllerError가 발생하면 400 에러를 반환한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: "estimate-request-1",
          estimateId: "estimate-1",
        },
      } as Partial<Request> as Request;

      const controllerError = new ControllerError(
        "견적요청을 찾을 수 없습니다."
      );
      mockGetShareData.mockRejectedValue(controllerError);

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).toHaveBeenCalledWith(
        "estimate-request-1",
        "estimate-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "[Controller 오류] 견적요청을 찾을 수 없습니다.",
      });
    });

    it("❌ 일반 Error가 발생하면 500 에러를 반환한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: "estimate-request-1",
          estimateId: "estimate-1",
        },
      } as Partial<Request> as Request;

      const generalError = new Error("데이터베이스 연결 오류");
      mockGetShareData.mockRejectedValue(generalError);

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).toHaveBeenCalledWith(
        "estimate-request-1",
        "estimate-1"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    });

    it("✅ 존재하지 않는 견적요청에 대해 null 데이터를 반환한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: "non-existent-request",
        },
      } as Partial<Request> as Request;

      const mockShareData = {
        estimateRequest: null,
        estimate: null,
      };

      mockGetShareData.mockResolvedValue(mockShareData);

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).toHaveBeenCalledWith(
        "non-existent-request",
        undefined
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockShareData,
      });
    });

    it("✅ 거부된 견적 데이터도 정상적으로 반환한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: "estimate-request-1",
          estimateId: "rejected-estimate",
        },
      } as Partial<Request> as Request;

      const rejectedEstimateData = {
        ...mockEstimateData,
        id: "rejected-estimate",
        status: "REJECTED" as const,
        rejectReason: "고객이 다른 업체를 선택했습니다.",
      };

      const mockShareData = {
        estimateRequest: mockEstimateRequestData,
        estimate: rejectedEstimateData,
      };

      mockGetShareData.mockResolvedValue(mockShareData);

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).toHaveBeenCalledWith(
        "estimate-request-1",
        "rejected-estimate"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockShareData,
      });
    });

    it("✅ 지정된 견적 데이터도 정상적으로 반환한다", async () => {
      // Setup
      const mockReq = {
        params: {
          estimateRequestId: "estimate-request-1",
          estimateId: "designated-estimate",
        },
      } as Partial<Request> as Request;

      const designatedEstimateData = {
        ...mockEstimateData,
        id: "designated-estimate",
        isDesignated: true,
        status: "ACCEPTED" as const,
      };

      const mockShareData = {
        estimateRequest: mockEstimateRequestData,
        estimate: designatedEstimateData,
      };

      mockGetShareData.mockResolvedValue(mockShareData);

      // Exercise
      await shareController.getShareData(mockReq, mockRes);

      // Assertion
      expect(mockGetShareData).toHaveBeenCalledWith(
        "estimate-request-1",
        "designated-estimate"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockShareData,
      });
    });
  });
});
