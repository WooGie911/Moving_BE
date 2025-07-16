import { TServiceId } from "../types/user.types";

// 프로필 기본값들
export const PROFILE_DEFAULTS = {
  CUSTOMER_EXPERIENCE: 0,
  MOVER_EXPERIENCE: 0,
  EMPTY_INTRODUCTION: "",
  EMPTY_DESCRIPTION: "",
  HAS_PROFILE_TRUE: true,
} as const;

// UUID 닉네임 생성 설정
export const NICKNAME_CONFIG = {
  UUID_LENGTH: 12, // UUID에서 사용할 자릿수
  PREFIX: "user_", // 닉네임 접두사
} as const;

// 유효한 서비스 ID 목록
export const VALID_SERVICE_IDS: TServiceId[] = [1, 2, 3];

// 서비스 정보 (에러 메시지용)
export const SERVICE_INFO = {
  1: "소형이사",
  2: "가정이사",
  3: "사무실이사",
} as const;

// 에러 메시지들
export const PROFILE_ERROR_MESSAGES = {
  USER_NOT_FOUND: "존재하지 않는 유저입니다",
  PROFILE_ALREADY_EXISTS: "이미 프로필이 등록되어 있습니다",
  NICKNAME_REQUIRED: "닉네임을 입력해주세요",
  NICKNAME_ALREADY_EXISTS: "이미 사용중인 닉네임입니다",
  EXPERIENCE_REQUIRED: "경력을 입력해주세요",
  INTRODUCTION_REQUIRED: "한줄 소개를 입력해주세요",
  DESCRIPTION_REQUIRED: "상세 설명을 입력해주세요",
  CURRENT_REGION_REQUIRED: "현재 거주 지역을 선택해주세요",
  USER_SERVICES_REQUIRED: "이용할 서비스를 하나 이상 선택해주세요",
  SERVICE_REGIONS_REQUIRED: "서비스 가능 지역을 하나 이상 선택해주세요",
  SERVICE_TYPES_REQUIRED: "제공할 서비스를 하나 이상 선택해주세요",
  INVALID_SERVICE_ID: `유효하지 않은 서비스 ID입니다. ${Object.entries(
    SERVICE_INFO
  )
    .map(([id, name]) => `${id}(${name})`)
    .join(", ")}만 사용 가능합니다`,
  INVALID_REGION: "유효하지 않은 지역입니다",
  INVALID_REGIONS: "유효하지 않은 지역입니다", // 복수형은 동적으로 생성
  DATABASE_ERROR: "DB 프로필 등록 중 오류가 발생했습니다",
  INVALID_USER_ROLE: "유효하지 않은 사용자 역할입니다",
  PROFILE_CREATION_FALLBACK: "프로필 등록 중 오류가 발생했습니다",
} as const;

// 성공 메시지들
export const PROFILE_SUCCESS_MESSAGES = {
  CUSTOMER_PROFILE_CREATED:
    "프로필이 성공적으로 등록되었습니다 (UUID 닉네임 자동 생성)",
  MOVER_PROFILE_CREATED: "프로필이 성공적으로 등록되었습니다",
} as const;

// 유효성 검사 설정
export const VALIDATION_CONFIG = {
  MIN_NICKNAME_LENGTH: 1,
  MIN_EXPERIENCE: 0,
  MIN_INTRODUCTION_LENGTH: 8,
  MIN_DESCRIPTION_LENGTH: 10,
  MIN_SERVICE_COUNT: 1,
  MIN_REGION_COUNT: 1,
} as const;
