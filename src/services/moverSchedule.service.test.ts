import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import moverScheduleService from "./moverSchedule.service";
import moverScheduleRepository from "../repositories/moverSchedule.repository";
import { ServiceValidationError, ServiceError } from "../types/errors.types";

// Repository 모킹
jest.mock("../repositories/moverSchedule.repository");

describe("MoverScheduleService", () => {
  let mockRepository: jest.Mocked<typeof moverScheduleRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = moverScheduleRepository as jest.Mocked<typeof moverScheduleRepository>;
  });

  describe("getMonthlySchedules", () => {
    it("should return transformed monthly schedules", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "APPROVED",
            moveType: "SMALL",
            customer: {
              id: "customer-1",
              name: "테스트 고객",
            },
            fromAddress: {
              id: "address-1",
              city: "",
              district: "강남구",
              detail: "역삼동 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-2",
              city: "",
              district: "강남구",
              detail: "삼성동 456",
              region: "SEOUL",
            },
          },
        },
      ];

      const expectedTransformedData = [
        {
          id: "request-1",
          customerName: "테스트 고객",
          movingType: "small",
          status: "confirmed",
          fromAddress: "서울 강남구 역삼동 123",
          toAddress: "서울 강남구 삼성동 456",
          moveDate: "2025-07-15",
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(mockRepository.getMonthlySchedules).toHaveBeenCalledWith(moverId, year, month);
      expect(result).toEqual(expectedTransformedData);
    });

    it("should throw ServiceValidationError for invalid mover ID", async () => {
      // Given
      const invalidMoverId = "";
      const year = 2025;
      const month = 7;

      // When & Then
      await expect(moverScheduleService.getMonthlySchedules(invalidMoverId, year, month)).rejects.toThrow(
        ServiceValidationError,
      );
      await expect(moverScheduleService.getMonthlySchedules(invalidMoverId, year, month)).rejects.toThrow(
        "잘못된 기사 ID입니다",
      );
    });

    it("should throw ServiceValidationError for invalid year", async () => {
      // Given
      const moverId = "test-mover-id";
      const invalidYear = 1800; // 1900 미만
      const month = 7;

      // When & Then
      await expect(moverScheduleService.getMonthlySchedules(moverId, invalidYear, month)).rejects.toThrow(
        ServiceValidationError,
      );
      await expect(moverScheduleService.getMonthlySchedules(moverId, invalidYear, month)).rejects.toThrow(
        "잘못된 년도 또는 월입니다",
      );
    });

    it("should throw ServiceValidationError for invalid month", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const invalidMonth = 13; // 12 초과

      // When & Then
      await expect(moverScheduleService.getMonthlySchedules(moverId, year, invalidMonth)).rejects.toThrow(
        ServiceValidationError,
      );
      await expect(moverScheduleService.getMonthlySchedules(moverId, year, invalidMonth)).rejects.toThrow(
        "잘못된 년도 또는 월입니다",
      );
    });

    it("should handle repository errors", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const repositoryError = new Error("Repository error");

      mockRepository.getMonthlySchedules.mockRejectedValue(repositoryError);

      // When & Then
      await expect(moverScheduleService.getMonthlySchedules(moverId, year, month)).rejects.toThrow(ServiceError);
      await expect(moverScheduleService.getMonthlySchedules(moverId, year, month)).rejects.toThrow(
        "월별 스케줄 조회 중 예상치 못한 오류가 발생했습니다",
      );
    });

    it("should transform address correctly for translation", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "APPROVED",
            moveType: "HOME",
            customer: {
              id: "customer-1",
              name: "테스트 고객",
            },
            fromAddress: {
              id: "address-1",
              city: "",
              district: "역삼동",
              detail: "테헤란로 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-2",
              city: "",
              district: "삼성동",
              detail: "영동대로 456",
              region: "SEOUL",
            },
          },
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].fromAddress).toBe("서울 역삼동 테헤란로 123");
      expect(result[0].toAddress).toBe("서울 삼성동 영동대로 456");
      expect(result[0].movingType).toBe("home");
    });

    it("should handle different move types correctly", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "APPROVED",
            moveType: "OFFICE",
            customer: {
              id: "customer-1",
              name: "테스트 고객",
            },
            fromAddress: {
              id: "address-1",
              city: "",
              district: "강남구",
              detail: "역삼동 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-2",
              city: "",
              district: "강남구",
              detail: "삼성동 456",
              region: "SEOUL",
            },
          },
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].movingType).toBe("office");
      expect(result[0].status).toBe("confirmed");
    });

    it("should handle empty schedule list", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;

      mockRepository.getMonthlySchedules.mockResolvedValue([]);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result).toEqual([]);
      expect(mockRepository.getMonthlySchedules).toHaveBeenCalledWith(moverId, year, month);
    });

    it("should handle multiple schedules", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "APPROVED",
            moveType: "SMALL",
            customer: {
              id: "customer-1",
              name: "고객1",
            },
            fromAddress: {
              id: "address-1",
              city: "",
              district: "강남구",
              detail: "역삼동 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-2",
              city: "",
              district: "강남구",
              detail: "삼성동 456",
              region: "SEOUL",
            },
          },
        },
        {
          id: "estimate-2",
          estimateRequestId: "request-2",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-2",
            customerId: "customer-2",
            moveDate: new Date("2025-07-20"),
            status: "PENDING",
            moveType: "HOME",
            customer: {
              id: "customer-2",
              name: "고객2",
            },
            fromAddress: {
              id: "address-3",
              city: "",
              district: "서초구",
              detail: "서초동 789",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-4",
              city: "",
              district: "서초구",
              detail: "반포동 101",
              region: "SEOUL",
            },
          },
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].customerName).toBe("고객1");
      expect(result[0].movingType).toBe("small");
      expect(result[0].status).toBe("confirmed");
      expect(result[1].customerName).toBe("고객2");
      expect(result[1].movingType).toBe("home");
      expect(result[1].status).toBe("pending");
    });

    it("should handle different status types", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "COMPLETED",
            moveType: "OFFICE",
            customer: {
              id: "customer-1",
              name: "테스트 고객",
            },
            fromAddress: {
              id: "address-1",
              city: "",
              district: "강남구",
              detail: "역삼동 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-2",
              city: "",
              district: "강남구",
              detail: "삼성동 456",
              region: "SEOUL",
            },
          },
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].status).toBe("completed");
    });

    it("should handle address with missing region", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "APPROVED",
            moveType: "SMALL",
            customer: {
              id: "customer-1",
              name: "테스트 고객",
            },
            fromAddress: {
              id: "address-1",
              city: "부산",
              district: "해운대구",
              detail: "우동 123",
              region: null,
            },
            toAddress: {
              id: "address-2",
              city: "부산",
              district: "동래구",
              detail: "온천동 456",
              region: null,
            },
          },
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].fromAddress).toBe("부산 해운대구 우동 123");
      expect(result[0].toAddress).toBe("부산 동래구 온천동 456");
    });

    it("should handle address with Korea suffix", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "APPROVED",
            moveType: "SMALL",
            customer: {
              id: "customer-1",
              name: "테스트 고객",
            },
            fromAddress: {
              id: "address-1",
              city: "",
              district: "강남구",
              detail: "역삼동 123, Korea",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-2",
              city: "",
              district: "강남구",
              detail: "삼성동 456, Korea",
              region: "SEOUL",
            },
          },
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].fromAddress).toBe("서울 강남구 역삼동 123");
      expect(result[0].toAddress).toBe("서울 강남구 삼성동 456");
    });

    it("should handle unknown move type", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "APPROVED",
            moveType: "UNKNOWN_TYPE",
            customer: {
              id: "customer-1",
              name: "테스트 고객",
            },
            fromAddress: {
              id: "address-1",
              city: "",
              district: "강남구",
              detail: "역삼동 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-2",
              city: "",
              district: "강남구",
              detail: "삼성동 456",
              region: "SEOUL",
            },
          },
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].movingType).toBe("small"); // 기본값
    });

    it("should handle unknown status", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          id: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          status: "ACCEPTED",
          estimateRequest: {
            id: "request-1",
            customerId: "customer-1",
            moveDate: new Date("2025-07-15"),
            status: "UNKNOWN_STATUS",
            moveType: "SMALL",
            customer: {
              id: "customer-1",
              name: "테스트 고객",
            },
            fromAddress: {
              id: "address-1",
              city: "",
              district: "강남구",
              detail: "역삼동 123",
              region: "SEOUL",
            },
            toAddress: {
              id: "address-2",
              city: "",
              district: "강남구",
              detail: "삼성동 456",
              region: "SEOUL",
            },
          },
        },
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].status).toBe("pending"); // 기본값
    });
  });
});
