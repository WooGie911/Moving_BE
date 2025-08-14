import shareRepository from "../repositories/share.repository";
import shareService from "./share.service";
import { ServiceDataProcessingError } from "../types/errors.types";
import { MoveType, EstimateStatus } from "@prisma/client";

jest.mock("../repositories/share.repository");

describe("shareService", () => {
  const mockGetEstimateRequest =
    shareRepository.getEstimateRequest as jest.Mock;
  const mockGetEstimate = shareRepository.getEstimate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getShareData", () => {
    const mockEstimateRequestData = {
      id: "estimate-request-1",
      customerId: "customer-1",
      moveType: "HOME" as MoveType,
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
      status: "PROPOSED" as EstimateStatus,
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
      const estimateRequestId = "estimate-request-1";
      const estimateId = "estimate-1";

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);
      mockGetEstimate.mockResolvedValue(mockEstimateData);

      // Exercise
      const result = await shareService.getShareData(
        estimateRequestId,
        estimateId
      );

      // Assertion
      expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
      expect(mockGetEstimate).toHaveBeenCalledWith(estimateId);
      expect(result).toEqual({
        estimateRequest: mockEstimateRequestData,
        estimate: mockEstimateData,
      });
    });

    it("✅ 견적요청 ID만으로 공유 데이터를 성공적으로 조회한다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);

      // Exercise
      const result = await shareService.getShareData(estimateRequestId);

      // Assertion
      expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
      expect(mockGetEstimate).not.toHaveBeenCalled();
      expect(result).toEqual({
        estimateRequest: mockEstimateRequestData,
        estimate: null,
      });
    });

    it("✅ 존재하지 않는 견적요청에 대해 null 데이터를 반환한다", async () => {
      // Setup
      const estimateRequestId = "non-existent-request";

      mockGetEstimateRequest.mockResolvedValue(null);

      // Exercise
      const result = await shareService.getShareData(estimateRequestId);

      // Assertion
      expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
      expect(mockGetEstimate).not.toHaveBeenCalled();
      expect(result).toEqual({
        estimateRequest: null,
        estimate: null,
      });
    });

    it("✅ 존재하지 않는 견적에 대해 null 견적을 반환한다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const estimateId = "non-existent-estimate";

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);
      mockGetEstimate.mockResolvedValue(null);

      // Exercise
      const result = await shareService.getShareData(
        estimateRequestId,
        estimateId
      );

      // Assertion
      expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
      expect(mockGetEstimate).toHaveBeenCalledWith(estimateId);
      expect(result).toEqual({
        estimateRequest: mockEstimateRequestData,
        estimate: null,
      });
    });

    it("✅ 거부된 견적 데이터도 정상적으로 반환한다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const estimateId = "rejected-estimate";

      const rejectedEstimateData = {
        ...mockEstimateData,
        id: estimateId,
        status: "REJECTED" as EstimateStatus,
        rejectReason: "고객이 다른 업체를 선택했습니다.",
      };

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);
      mockGetEstimate.mockResolvedValue(rejectedEstimateData);

      // Exercise
      const result = await shareService.getShareData(
        estimateRequestId,
        estimateId
      );

      // Assertion
      expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
      expect(mockGetEstimate).toHaveBeenCalledWith(estimateId);
      expect(result).toEqual({
        estimateRequest: mockEstimateRequestData,
        estimate: rejectedEstimateData,
      });
      expect(result.estimate?.status).toBe("REJECTED");
      expect(result.estimate?.rejectReason).toBe(
        "고객이 다른 업체를 선택했습니다."
      );
    });

    it("✅ 지정된 견적 데이터도 정상적으로 반환한다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const estimateId = "designated-estimate";

      const designatedEstimateData = {
        ...mockEstimateData,
        id: estimateId,
        isDesignated: true,
        status: "ACCEPTED" as EstimateStatus,
      };

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);
      mockGetEstimate.mockResolvedValue(designatedEstimateData);

      // Exercise
      const result = await shareService.getShareData(
        estimateRequestId,
        estimateId
      );

      // Assertion
      expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
      expect(mockGetEstimate).toHaveBeenCalledWith(estimateId);
      expect(result).toEqual({
        estimateRequest: mockEstimateRequestData,
        estimate: designatedEstimateData,
      });
      expect(result.estimate?.isDesignated).toBe(true);
      expect(result.estimate?.status).toBe("ACCEPTED");
    });

    it("✅ 모든 견적 상태를 정상적으로 처리한다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const estimateStatuses: EstimateStatus[] = [
        "PROPOSED",
        "ACCEPTED",
        "REJECTED",
        "AUTO_REJECTED",
      ];

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);

      for (const status of estimateStatuses) {
        const estimateId = `estimate-${status.toLowerCase()}`;
        const estimateData = {
          ...mockEstimateData,
          id: estimateId,
          status,
        };
        mockGetEstimate.mockResolvedValue(estimateData);

        // Exercise
        const result = await shareService.getShareData(
          estimateRequestId,
          estimateId
        );

        // Assertion
        expect(mockGetEstimate).toHaveBeenCalledWith(estimateId);
        expect(result.estimate?.status).toBe(status);
      }
    });

    it("✅ 모든 이사 타입을 정상적으로 처리한다", async () => {
      // Setup
      const moveTypes: MoveType[] = ["SMALL", "HOME", "OFFICE"];

      mockGetEstimate.mockResolvedValue(mockEstimateData);

      for (const moveType of moveTypes) {
        const estimateRequestId = `estimate-request-${moveType.toLowerCase()}`;
        const estimateRequestData = {
          ...mockEstimateRequestData,
          id: estimateRequestId,
          moveType,
        };
        mockGetEstimateRequest.mockResolvedValue(estimateRequestData);

        // Exercise
        const result = await shareService.getShareData(estimateRequestId);

        // Assertion
        expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
        expect(result.estimateRequest?.moveType).toBe(moveType);
      }
    });

    it("❌ 견적요청 조회 시 오류가 발생하면 ServiceDataProcessingError를 던진다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const dbError = new Error("Database connection failed");
      mockGetEstimateRequest.mockRejectedValue(dbError);

      // Exercise & Assertion
      await expect(
        shareService.getShareData(estimateRequestId)
      ).rejects.toThrow(ServiceDataProcessingError);

      await expect(
        shareService.getShareData(estimateRequestId)
      ).rejects.toThrow("공유 데이터 조회 실패");
    });

    it("❌ 견적 조회 시 오류가 발생하면 ServiceDataProcessingError를 던진다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const estimateId = "estimate-1";
      const dbError = new Error("Database connection failed");

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);
      mockGetEstimate.mockRejectedValue(dbError);

      // Exercise & Assertion
      await expect(
        shareService.getShareData(estimateRequestId, estimateId)
      ).rejects.toThrow(ServiceDataProcessingError);

      await expect(
        shareService.getShareData(estimateRequestId, estimateId)
      ).rejects.toThrow("공유 데이터 조회 실패");
    });

    it("✅ 빈 문자열 estimateId로 호출해도 정상적으로 처리한다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const estimateId = "";

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);

      // Exercise
      const result = await shareService.getShareData(
        estimateRequestId,
        estimateId
      );

      // Assertion
      expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
      expect(mockGetEstimate).not.toHaveBeenCalled();
      expect(result).toEqual({
        estimateRequest: mockEstimateRequestData,
        estimate: null,
      });
    });

    it("✅ null estimateId로 호출해도 정상적으로 처리한다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const estimateId = null as any;

      mockGetEstimateRequest.mockResolvedValue(mockEstimateRequestData);

      // Exercise
      const result = await shareService.getShareData(
        estimateRequestId,
        estimateId
      );

      // Assertion
      expect(mockGetEstimateRequest).toHaveBeenCalledWith(estimateRequestId);
      expect(mockGetEstimate).not.toHaveBeenCalled();
      expect(result).toEqual({
        estimateRequest: mockEstimateRequestData,
        estimate: null,
      });
    });
  });
});
