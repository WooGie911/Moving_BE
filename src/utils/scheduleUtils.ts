// 백엔드 스케줄 관련 유틸리티 함수들
import {
  TMoverScheduleWithDetails,
  TMoverScheduleResponse,
  MoveTypeMapping,
  StatusMapping,
  AddressFormatInput,
  ScheduleTransformInput,
  ValidationInput,
  ErrorHandlingInput,
} from "../types/moverSchedule";
import { convertRegionToKorean } from "./addressUtils";

// 상수 정의
export const moveTypeMapping: MoveTypeMapping = {
  SMALL: "small",
  HOME: "home",
  OFFICE: "office",
} as const;

export const statusMapping: StatusMapping = {
  APPROVED: "confirmed",
  PENDING: "pending",
  COMPLETED: "completed",
} as const;

export const validation = {
  minYear: 1900,
  minMonth: 1,
  maxMonth: 12,
} as const;

/**
 * 입력값 유효성 검사
 */
export const validateScheduleInput = (moverId: string, year: number, month: number): void => {
  if (!moverId || typeof moverId !== "string") {
    throw new Error("잘못된 기사 ID입니다");
  }

  if (!year || !month || year < validation.minYear || month < validation.minMonth || month > validation.maxMonth) {
    throw new Error("잘못된 년도 또는 월입니다");
  }
};

/**
 * 주소 포맷팅 함수
 */
export const formatAddressForTranslation = (address: AddressFormatInput): string => {
  const parts: string[] = [];

  // 리전 (시/도)
  if (address.region) {
    parts.push(convertRegionToKorean(address.region));
  }

  // 시/군
  if (address.city) {
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

  let result = parts.join(" ");

  // Korea 제거
  result = result.replace(/,?\s*Korea\s*$/, "");

  // Seoul을 한국어로 변환
  result = result.replace(/\bSeoul\b/g, "서울");

  return result;
};

/**
 * 스케줄 상세 정보를 응답 형식으로 변환
 */
export const transformToScheduleResponse = (detail: TMoverScheduleWithDetails): TMoverScheduleResponse => {
  return {
    id: detail.estimateRequestId,
    customerName: detail.customer.name,
    movingType: moveTypeMapping[detail.moveType] || "small",
    status: statusMapping[detail.requestStatus as keyof StatusMapping] || "pending",
    fromAddress: formatAddressForTranslation(detail.fromAddress),
    toAddress: formatAddressForTranslation(detail.toAddress),
    moveDate: detail.moveDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
  };
};

/**
 * 백엔드 이사 유형을 프론트엔드 형식으로 변환
 */
export const mapBackendMoveType = (backendType: string): string => {
  return moveTypeMapping[backendType as keyof typeof moveTypeMapping] || "small";
};

/**
 * 백엔드 상태를 프론트엔드 형식으로 변환
 */
export const mapBackendStatus = (backendStatus: string): string => {
  return statusMapping[backendStatus as keyof typeof statusMapping] || "pending";
};

/**
 * 에러 처리 헬퍼
 */
export const handleScheduleError = (error: unknown, defaultMessage: string): never => {
  if (error instanceof Error) {
    throw error;
  }

  console.error("스케줄 서비스 에러:", error);
  throw new Error(defaultMessage);
};
