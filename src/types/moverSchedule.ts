// 기사님 스케줄 관련 타입 정의

/**
 * 스케줄 조회 필터링 옵션 타입
 */
export type TMoverScheduleFilterOptions = {
  moverId: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: "moveDate" | "createdAt";
};

/**
 * 스케줄 응답 타입 (프론트엔드 Schedule 인터페이스와 매핑)
 */
export type TMoverScheduleResponse = {
  id: string;
  customerName: string;
  movingType: "small" | "home" | "office";
  status: "confirmed" | "pending" | "completed";
  fromAddress: string;
  toAddress: string;
  moveDate: string; // YYYY-MM-DD 형식
};

/**
 * 기사님 스케줄 상세 정보 (내부 처리용)
 */
export type TMoverScheduleWithDetails = {
  estimateId: string;
  estimateRequestId: string;
  moverId: string;
  moveDate: Date;
  moveType: "SMALL" | "HOME" | "OFFICE";
  requestStatus: string;
  customer: {
    id: string;
    name: string | null;
    customerImage: string | null;
    nickname: string | null;
  };
  fromAddress: {
    id: string;
    zoneCode: string;
    city: string;
    district: string;
    detail: string | undefined;
    region: string;
  };
  toAddress: {
    id: string;
    zoneCode: string;
    city: string;
    district: string;
    detail: string | undefined;
    region: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 이사 타입 변환 유틸리티 타입
 */
export type MoveTypeMapping = {
  SMALL: "small";
  HOME: "home";
  OFFICE: "office";
};

/**
 * 상태 변환 유틸리티 타입
 */
export type StatusMapping = {
  APPROVED: "confirmed";
  PENDING: "pending";
  COMPLETED: "completed";
};

/**
 * API 응답 타입
 */
export interface ScheduleApiResponse {
  success: boolean;
  message: string;
  data: TMoverScheduleResponse[];
}

/**
 * API 에러 응답 타입
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
}

/**
 * 주소 정보 타입
 */
export interface AddressInfo {
  id: string;
  zoneCode: string;
  city: string;
  district: string;
  detail: string | undefined;
  region: string;
}

/**
 * 고객 정보 타입
 */
export interface CustomerInfo {
  id: string;
  name: string;
  customerImage: string | undefined;
  nickname: string | undefined;
}

/**
 * 서비스 에러 타입
 */
export interface ServiceErrorType {
  message: string;
  code?: string;
}

/**
 * 유효성 검사 결과 타입
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 주소 포맷팅 입력 타입
 */
export interface AddressFormatInput {
  city: string;
  district: string;
  detail: string | undefined;
  region: string;
}

/**
 * 스케줄 변환 입력 타입
 */
export interface ScheduleTransformInput {
  estimateRequestId: string;
  customer: {
    name: string;
  };
  moveType: "SMALL" | "HOME" | "OFFICE";
  requestStatus: string;
  fromAddress: AddressFormatInput;
  toAddress: AddressFormatInput;
  moveDate: Date;
}

/**
 * 유효성 검사 입력 타입
 */
export interface ValidationInput {
  moverId: string;
  year: number;
  month: number;
}

/**
 * 에러 처리 입력 타입
 */
export interface ErrorHandlingInput {
  error: unknown;
  defaultMessage: string;
}
