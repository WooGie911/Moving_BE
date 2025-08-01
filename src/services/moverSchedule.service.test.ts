import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import moverScheduleService from "../services/moverSchedule.service";
import moverScheduleRepository from "../repositories/moverSchedule.repository";
import { ServiceValidationError, ServiceError } from "../types/errors.types";

// Repository 모킹
jest.mock("../../repositories/moverSchedule.repository");

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
          movingType: "소형이사",
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
      expect(result[0].movingType).toBe("가정이사");
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
      expect(result[0].movingType).toBe("사무실이사");
      expect(result[0].status).toBe("confirmed");
    });
  });
});
