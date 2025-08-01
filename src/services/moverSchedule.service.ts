import moverScheduleRepository from "../repositories/moverSchedule.repository";
import {
  TMoverScheduleResponse,
  TMoverScheduleWithDetails,
  MoveTypeMapping,
  StatusMapping,
} from "../types/moverSchedule";
import { ServiceError, ServiceValidationError, RepositoryError } from "../types/errors.types";
import { convertRegionToKorean } from "../utils/addressUtils";

// 상수 정의
const VALIDATION = {
  MIN_YEAR: 1900,
  MIN_MONTH: 1,
  MAX_MONTH: 12,
} as const;

const MOVE_TYPE_MAPPING: MoveTypeMapping = {
  SMALL: "소형이사",
  HOME: "가정이사",
  OFFICE: "사무실이사",
} as const;

const STATUS_MAPPING: StatusMapping = {
  APPROVED: "confirmed",
  PENDING: "pending",
} as const;

// 유틸리티 함수들
const validateInput = (moverId: string, year: number, month: number): void => {
  if (!moverId || typeof moverId !== "string") {
    throw new ServiceValidationError("잘못된 기사 ID입니다");
  }

  if (!year || !month || year < VALIDATION.MIN_YEAR || month < VALIDATION.MIN_MONTH || month > VALIDATION.MAX_MONTH) {
    throw new ServiceValidationError("잘못된 년도 또는 월입니다");
  }
};

const formatAddressForTranslation = (address: {
  city: string;
  district: string;
  detail: string | null;
  region: string;
}): string => {
  const parts: string[] = [];

  // 리전 (시/도) - region이 있으면 region을 사용, 없으면 city 사용
  if (address.region) {
    parts.push(convertRegionToKorean(address.region));
  } else if (address.city) {
    parts.push(address.city);
  }

  // 구/군
  if (address.district) {
    parts.push(address.district);
  }

  // 상세주소
  if (address.detail) {
    parts.push(address.detail);
  }

  return parts.join(" ");
};

const transformToScheduleResponse = (detail: TMoverScheduleWithDetails): TMoverScheduleResponse => {
  return {
    id: detail.estimateRequestId,
    customerName: detail.customer.name,
    movingType: MOVE_TYPE_MAPPING[detail.moveType] || "소형이사",
    status: (STATUS_MAPPING as any)[detail.requestStatus] || "pending",
    fromAddress: formatAddressForTranslation(detail.fromAddress),
    toAddress: formatAddressForTranslation(detail.toAddress),
    moveDate: detail.moveDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
  };
};

const handleServiceError = (error: unknown): never => {
  if (error instanceof ServiceValidationError) {
    throw error;
  }

  if (error instanceof RepositoryError) {
    throw new ServiceError("월별 스케줄 조회 중 오류가 발생했습니다");
  }

  console.error("moverScheduleService.getMonthlySchedules 에러:", error);
  throw new ServiceError("월별 스케줄 조회 중 예상치 못한 오류가 발생했습니다");
};

// 메인 서비스 객체
const moverScheduleService = {
  /**
   * 월별 스케줄 조회 (캘린더용)
   */
  getMonthlySchedules: async (moverId: string, year: number, month: number): Promise<TMoverScheduleResponse[]> => {
    try {
      validateInput(moverId, year, month);

      const scheduleDetails = await moverScheduleRepository.getMonthlySchedules(moverId, year, month);
      return scheduleDetails.map(transformToScheduleResponse);
    } catch (error) {
      return handleServiceError(error);
    }
  },
};

export default moverScheduleService;
