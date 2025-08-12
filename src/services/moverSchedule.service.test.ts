import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import moverScheduleService from "./moverSchedule.service";
import moverScheduleRepository from "../repositories/moverSchedule.repository";
import { ServiceValidationError, RepositoryError, ServiceError } from "../types/errors.types";

// Repository 모킹
jest.mock("../repositories/moverSchedule.repository");

describe("MoverScheduleService", () => {
  let mockRepository: jest.Mocked<typeof moverScheduleRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = moverScheduleRepository as jest.Mocked<typeof moverScheduleRepository>;
  });

  describe("getMonthlySchedules", () => {
    it("월별 스케줄을 변환하여 반환한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "SMALL",
          requestStatus: "APPROVED",
          customer: { id: "customer-1", name: "테스트 고객", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "역삼동 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "삼성동 456",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
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

    it("잘못된 기사 ID면 에러를 던진다", async () => {
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

    it("유효하지 않은 연도면 에러를 던진다", async () => {
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

    it("유효하지 않은 월이면 에러를 던진다", async () => {
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

    it("레포지토리 에러를 전달한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const repositoryError = new Error("Repository error");

      mockRepository.getMonthlySchedules.mockRejectedValue(repositoryError);

      // When & Then
      await expect(moverScheduleService.getMonthlySchedules(moverId, year, month)).rejects.toThrow("Repository error");
    });

    it("레포지토리 오류 클래스면 ServiceError로 변환한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const repoErrorInstance = new RepositoryError("레포지토리 오류");

      mockRepository.getMonthlySchedules.mockRejectedValue(repoErrorInstance);

      // When & Then
      await expect(moverScheduleService.getMonthlySchedules(moverId, year, month)).rejects.toThrow(ServiceError);
      await expect(moverScheduleService.getMonthlySchedules(moverId, year, month)).rejects.toThrow(
        "월별 스케줄 조회 중 오류가 발생했습니다",
      );
    });

    it("주소를 한국어 포맷으로 변환한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "HOME",
          requestStatus: "APPROVED",
          customer: { id: "customer-1", name: "테스트 고객", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "",
            district: "역삼동",
            detail: "테헤란로 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "",
            district: "삼성동",
            detail: "영동대로 456",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].fromAddress).toBe("서울 역삼동 테헤란로 123");
      expect(result[0].toAddress).toBe("서울 삼성동 영동대로 456");
      expect(result[0].movingType).toBe("home");
    });

    it("MOVE 타입을 올바르게 매핑한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "OFFICE",
          requestStatus: "APPROVED",
          customer: { id: "customer-1", name: "테스트 고객", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "역삼동 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "삼성동 456",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].movingType).toBe("office");
      expect(result[0].status).toBe("confirmed");
    });

    it("빈 스케줄 목록을 처리한다", async () => {
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

    it("여러 스케줄을 처리한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "SMALL",
          requestStatus: "APPROVED",
          customer: { id: "customer-1", name: "고객1", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "역삼동 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "삼성동 456",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        {
          estimateId: "estimate-2",
          estimateRequestId: "request-2",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-20"),
          moveType: "HOME",
          requestStatus: "PENDING",
          customer: { id: "customer-2", name: "고객2", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-3",
            zoneCode: "",
            city: "",
            district: "서초구",
            detail: "서초동 789",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-4",
            zoneCode: "",
            city: "",
            district: "서초구",
            detail: "반포동 101",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
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

    it("요청 상태를 올바르게 매핑한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "OFFICE",
          requestStatus: "COMPLETED",
          customer: { id: "customer-1", name: "테스트 고객", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "역삼동 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "삼성동 456",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].status).toBe("completed");
    });

    it("region 누락 주소를 처리한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "SMALL",
          requestStatus: "APPROVED",
          customer: { id: "customer-1", name: "테스트 고객", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "부산",
            district: "해운대구",
            detail: "우동 123",
            region: null as any,
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "부산",
            district: "동래구",
            detail: "온천동 456",
            region: null as any,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].fromAddress).toBe("부산 해운대구 우동 123");
      expect(result[0].toAddress).toBe("부산 동래구 온천동 456");
    });

    it("주소 detail의 Korea 접미사를 제거한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "SMALL",
          requestStatus: "APPROVED",
          customer: { id: "customer-1", name: "테스트 고객", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "역삼동 123, Korea",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "삼성동 456, Korea",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].fromAddress).toBe("서울 강남구 역삼동 123");
      expect(result[0].toAddress).toBe("서울 강남구 삼성동 456");
    });

    it("알 수 없는 MOVE 타입은 기본값으로 처리한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "UNKNOWN_TYPE" as any,
          requestStatus: "APPROVED",
          customer: { id: "customer-1", name: "테스트 고객", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "역삼동 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "삼성동 456",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].movingType).toBe("small"); // 기본값
    });

    it("알 수 없는 상태는 기본값으로 처리한다", async () => {
      // Given
      const moverId = "test-mover-id";
      const year = 2025;
      const month = 7;
      const mockRepositoryData = [
        {
          estimateId: "estimate-1",
          estimateRequestId: "request-1",
          moverId: "test-mover-id",
          moveDate: new Date("2025-07-15"),
          moveType: "SMALL",
          requestStatus: "UNKNOWN_STATUS" as any,
          customer: { id: "customer-1", name: "테스트 고객", customerImage: null, nickname: null },
          fromAddress: {
            id: "address-1",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "역삼동 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "address-2",
            zoneCode: "",
            city: "",
            district: "강남구",
            detail: "삼성동 456",
            region: "SEOUL",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      mockRepository.getMonthlySchedules.mockResolvedValue(mockRepositoryData as any);

      // When
      const result = await moverScheduleService.getMonthlySchedules(moverId, year, month);

      // Then
      expect(result[0].status).toBe("pending"); // 기본값
    });
  });
});
