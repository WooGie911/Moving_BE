import shareRepository from "./share.repository";
import prisma from "../db/prisma/prisma";
import { RepositoryQueryError } from "../types/errors.types";
import { MoveType, EstimateStatus } from "@prisma/client";

jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    estimateRequest: {
      findUnique: jest.fn(),
    },
    estimate: {
      findUnique: jest.fn(),
    },
  },
}));

describe("shareRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getEstimateRequest", () => {
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
      customer: {
        id: "customer-1",
        nickname: "홍길동",
        name: "홍길동",
      },
    };

    it("✅ 견적요청 ID로 견적요청을 성공적으로 조회한다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      (prisma.estimateRequest.findUnique as jest.Mock).mockResolvedValue(
        mockEstimateRequestData
      );

      // Exercise
      const result =
        await shareRepository.getEstimateRequest(estimateRequestId);

      // Assertion
      expect(prisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: {
          id: estimateRequestId,
        },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          fromAddressId: true,
          toAddressId: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          fromAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          toAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          customer: {
            select: {
              id: true,
              nickname: true,
              name: true,
            },
          },
        },
      });

      expect(result).toEqual(mockEstimateRequestData);
    });

    it("✅ 존재하지 않는 견적요청 ID로 조회 시 null을 반환한다", async () => {
      // Setup
      const estimateRequestId = "non-existent-id";
      (prisma.estimateRequest.findUnique as jest.Mock).mockResolvedValue(null);

      // Exercise
      const result =
        await shareRepository.getEstimateRequest(estimateRequestId);

      // Assertion
      expect(prisma.estimateRequest.findUnique).toHaveBeenCalledWith({
        where: {
          id: estimateRequestId,
        },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          fromAddressId: true,
          toAddressId: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          fromAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          toAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          customer: {
            select: {
              id: true,
              nickname: true,
              name: true,
            },
          },
        },
      });

      expect(result).toBeNull();
    });

    it("❌ 견적요청 조회 시 데이터베이스 오류가 발생하면 RepositoryQueryError를 던진다", async () => {
      // Setup
      const estimateRequestId = "estimate-request-1";
      const dbError = new Error("Database connection failed");
      (prisma.estimateRequest.findUnique as jest.Mock).mockRejectedValue(
        dbError
      );

      // Exercise & Assertion
      await expect(
        shareRepository.getEstimateRequest(estimateRequestId)
      ).rejects.toThrow(RepositoryQueryError);

      await expect(
        shareRepository.getEstimateRequest(estimateRequestId)
      ).rejects.toThrow("견적요청 ID estimate-request-1 조회 실패");
    });
  });

  describe("getEstimate", () => {
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

    it("✅ 견적 ID로 견적을 성공적으로 조회한다", async () => {
      // Setup
      const estimateId = "estimate-1";
      (prisma.estimate.findUnique as jest.Mock).mockResolvedValue(
        mockEstimateData
      );

      // Exercise
      const result = await shareRepository.getEstimate(estimateId);

      // Assertion
      expect(prisma.estimate.findUnique).toHaveBeenCalledWith({
        where: {
          id: estimateId,
        },
        select: {
          id: true,
          moverId: true,
          estimateRequestId: true,
          price: true,
          comment: true,
          status: true,
          rejectReason: true,
          isDesignated: true,
          workingHours: true,
          includesPackaging: true,
          insuranceAmount: true,
          validUntil: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      expect(result).toEqual(mockEstimateData);
    });

    it("✅ 존재하지 않는 견적 ID로 조회 시 null을 반환한다", async () => {
      // Setup
      const estimateId = "non-existent-estimate";
      (prisma.estimate.findUnique as jest.Mock).mockResolvedValue(null);

      // Exercise
      const result = await shareRepository.getEstimate(estimateId);

      // Assertion
      expect(prisma.estimate.findUnique).toHaveBeenCalledWith({
        where: {
          id: estimateId,
        },
        select: {
          id: true,
          moverId: true,
          estimateRequestId: true,
          price: true,
          comment: true,
          status: true,
          rejectReason: true,
          isDesignated: true,
          workingHours: true,
          includesPackaging: true,
          insuranceAmount: true,
          validUntil: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      expect(result).toBeNull();
    });

    it("✅ 거부된 견적도 정상적으로 조회한다", async () => {
      // Setup
      const estimateId = "rejected-estimate";
      const rejectedEstimateData = {
        ...mockEstimateData,
        id: estimateId,
        status: "REJECTED" as EstimateStatus,
        rejectReason: "고객이 다른 업체를 선택했습니다.",
      };
      (prisma.estimate.findUnique as jest.Mock).mockResolvedValue(
        rejectedEstimateData
      );

      // Exercise
      const result = await shareRepository.getEstimate(estimateId);

      // Assertion
      expect(result).toEqual(rejectedEstimateData);
      expect(result?.status).toBe("REJECTED");
      expect(result?.rejectReason).toBe("고객이 다른 업체를 선택했습니다.");
    });

    it("✅ 지정된 견적도 정상적으로 조회한다", async () => {
      // Setup
      const estimateId = "designated-estimate";
      const designatedEstimateData = {
        ...mockEstimateData,
        id: estimateId,
        isDesignated: true,
        status: "ACCEPTED" as EstimateStatus,
      };
      (prisma.estimate.findUnique as jest.Mock).mockResolvedValue(
        designatedEstimateData
      );

      // Exercise
      const result = await shareRepository.getEstimate(estimateId);

      // Assertion
      expect(result).toEqual(designatedEstimateData);
      expect(result?.isDesignated).toBe(true);
      expect(result?.status).toBe("ACCEPTED");
    });

    it("❌ 견적 조회 시 데이터베이스 오류가 발생하면 RepositoryQueryError를 던진다", async () => {
      // Setup
      const estimateId = "estimate-1";
      const dbError = new Error("Database connection failed");
      (prisma.estimate.findUnique as jest.Mock).mockRejectedValue(dbError);

      // Exercise & Assertion
      await expect(shareRepository.getEstimate(estimateId)).rejects.toThrow(
        RepositoryQueryError
      );

      await expect(shareRepository.getEstimate(estimateId)).rejects.toThrow(
        "견적 ID estimate-1 조회 실패"
      );
    });

    it("✅ 모든 견적 상태를 정상적으로 조회한다", async () => {
      // Setup
      const estimateStatuses: EstimateStatus[] = [
        "PROPOSED",
        "ACCEPTED",
        "REJECTED",
        "AUTO_REJECTED",
      ];

      for (const status of estimateStatuses) {
        const estimateId = `estimate-${status.toLowerCase()}`;
        const estimateData = {
          ...mockEstimateData,
          id: estimateId,
          status,
        };
        (prisma.estimate.findUnique as jest.Mock).mockResolvedValue(
          estimateData
        );

        // Exercise
        const result = await shareRepository.getEstimate(estimateId);

        // Assertion
        expect(result?.status).toBe(status);
      }
    });
  });
});
