import { VALID_REGIONS } from "../../constants/regions.constants";
import {
  VALID_SERVICE_IDS,
  PROFILE_ERROR_MESSAGES,
  VALIDATION_CONFIG,
} from "../../constants/profile.constants";
import { ValidationError, ForbiddenError } from "../../types/commonError.types";
import {
  TServiceId,
  TCustomerProfileInput,
  TMoverProfileInput,
} from "../../types/user.types";
import {
  checkProfileExists,
  checkNicknameExists,
} from "../../repositories/user.repository";

// ServiceId 배열 유효성 검사 함수
export const validateServiceIds = (
  serviceIds: number[]
): serviceIds is TServiceId[] => {
  if (!serviceIds || serviceIds.length < VALIDATION_CONFIG.MIN_SERVICE_COUNT) {
    return false;
  }
  return serviceIds.every((id) => VALID_SERVICE_IDS.includes(id as TServiceId));
};

// Region 유효성 검사 함수
export const validateRegion = (region: string): boolean => {
  return VALID_REGIONS.includes(region);
};

// 여러 Region 유효성 검사 함수
export const validateRegions = (regions: string[]): boolean => {
  if (!regions || regions.length < VALIDATION_CONFIG.MIN_REGION_COUNT) {
    return false;
  }
  return regions.every((region) => VALID_REGIONS.includes(region));
};

// 프로필 존재 여부 확인 및 에러 처리
export const ensureProfileNotExists = async (userId: number): Promise<void> => {
  const hasProfile = await checkProfileExists(userId);
  if (hasProfile) {
    throw new ForbiddenError(PROFILE_ERROR_MESSAGES.PROFILE_ALREADY_EXISTS);
  }
};

// 닉네임 중복 확인 및 에러 처리
export const ensureNicknameUnique = async (nickname: string): Promise<void> => {
  if (
    !nickname ||
    nickname.trim().length < VALIDATION_CONFIG.MIN_NICKNAME_LENGTH
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.NICKNAME_REQUIRED);
  }

  const nicknameExists = await checkNicknameExists(nickname);
  if (nicknameExists) {
    throw new ForbiddenError(PROFILE_ERROR_MESSAGES.NICKNAME_ALREADY_EXISTS);
  }
};

// 일반 유저(CUSTOMER) 프로필 데이터 유효성 검사
export const validateCustomerProfileData = async (
  userId: number,
  profileData: TCustomerProfileInput
): Promise<void> => {
  // 프로필 존재 여부 확인
  await ensureProfileNotExists(userId);

  // 필수 필드 검사
  if (!profileData.currentRegion) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.CURRENT_REGION_REQUIRED);
  }

  if (
    !profileData.userServices ||
    profileData.userServices.length < VALIDATION_CONFIG.MIN_SERVICE_COUNT
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.USER_SERVICES_REQUIRED);
  }

  // ServiceId 유효성 검사
  if (!validateServiceIds(profileData.userServices)) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_SERVICE_ID);
  }

  // Region 유효성 검사
  if (!validateRegion(profileData.currentRegion)) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_REGION);
  }
};

// 기사님(MOVER) 프로필 데이터 유효성 검사
export const validateMoverProfileData = async (
  userId: number,
  profileData: TMoverProfileInput
): Promise<void> => {
  // 프로필 존재 여부 확인
  await ensureProfileNotExists(userId);

  // 닉네임 검사 및 중복 확인
  await ensureNicknameUnique(profileData.nickname);

  // 서비스 타입 유효성 검사
  if (
    !profileData.serviceTypes ||
    profileData.serviceTypes.length < VALIDATION_CONFIG.MIN_SERVICE_COUNT
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.SERVICE_TYPES_REQUIRED);
  }

  // 경력 유효성 검사
  if (!profileData.experience) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.EXPERIENCE_REQUIRED);
  }

  // 한줄 소개 유효성 검사
  if (
    profileData.introduction &&
    profileData.introduction.length < VALIDATION_CONFIG.MIN_INTRODUCTION_LENGTH
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INTRODUCTION_REQUIRED);
  } else if (!profileData.introduction) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INTRODUCTION_REQUIRED);
  }

  // 상세 설명 유효성 검사
  if (
    profileData.description &&
    profileData.description.length < VALIDATION_CONFIG.MIN_DESCRIPTION_LENGTH
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.DESCRIPTION_REQUIRED);
  } else if (!profileData.description) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.DESCRIPTION_REQUIRED);
  }

  // 제공 서비스 유효성 검사
  if (!validateServiceIds(profileData.serviceTypes)) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_SERVICE_ID);
  }

  // 서비스 가능 지역 최소 선택 유효성 검사
  if (
    !profileData.serviceRegions ||
    profileData.serviceRegions.length < VALIDATION_CONFIG.MIN_REGION_COUNT
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.SERVICE_REGIONS_REQUIRED);
  }

  // 서비스 가능 지역 유효성 검사
  if (!validateRegions(profileData.serviceRegions)) {
    const invalidRegions = profileData.serviceRegions.filter(
      (region) => !validateRegion(region)
    );
    throw new ValidationError(
      `${PROFILE_ERROR_MESSAGES.INVALID_REGIONS}: ${invalidRegions.join(", ")}`
    );
  }
};
