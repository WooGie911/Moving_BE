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
  TUserProfileUpdateInput,
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

// 고객 프로필 업데이트 데이터 유효성 검사
export const validateUpdateCustomerProfile = async (
  profileData: TUserProfileUpdateInput
): Promise<void> => {
  // 빈 객체 검사
  const hasAnyField = Object.keys(profileData).some(
    (key) => profileData[key as keyof TUserProfileUpdateInput] !== undefined
  );

  if (!hasAnyField) {
    throw new ValidationError("수정할 데이터를 하나 이상 입력해주세요");
  }

  // 이름 유효성 검사
  if (profileData.name !== undefined) {
    if (!profileData.name || profileData.name.trim().length === 0) {
      throw new ValidationError("이름을 입력해주세요");
    }
    if (profileData.name.trim().length < 2) {
      throw new ValidationError("이름은 2글자 이상 입력해주세요");
    }
  }

  // 전화번호 유효성 검사
  if (profileData.phoneNumber !== undefined) {
    if (!profileData.phoneNumber) {
      throw new ValidationError("전화번호를 입력해주세요");
    }
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(profileData.phoneNumber)) {
      throw new ValidationError("전화번호는 10-11자리 숫자로 입력해주세요");
    }
  }

  // 비밀번호 변경 유효성 검사
  const hasCurrentPassword = profileData.currentPassword !== undefined;
  const hasNewPassword = profileData.newPassword !== undefined;

  if (hasCurrentPassword || hasNewPassword) {
    // 비밀번호 변경 시 현재 비밀번호와 새 비밀번호 모두 필요
    if (!hasCurrentPassword) {
      throw new ValidationError("현재 비밀번호를 입력해주세요");
    }
    if (!hasNewPassword) {
      throw new ValidationError("새 비밀번호를 입력해주세요");
    }
    if (
      !profileData.currentPassword ||
      profileData.currentPassword.trim().length === 0
    ) {
      throw new ValidationError("현재 비밀번호를 입력해주세요");
    }
    if (
      !profileData.newPassword ||
      profileData.newPassword.trim().length === 0
    ) {
      throw new ValidationError("새 비밀번호를 입력해주세요");
    }
    if (profileData.newPassword.length < 8) {
      throw new ValidationError("새 비밀번호는 8자리 이상 입력해주세요");
    }
    if (profileData.currentPassword === profileData.newPassword) {
      throw new ValidationError("새 비밀번호는 현재 비밀번호와 달라야 합니다");
    }
  }

  // 프로필 이미지 유효성 검사 (null 허용 - 이미지 제거)
  if (
    profileData.profileImage !== undefined &&
    profileData.profileImage !== null
  ) {
    if (profileData.profileImage.trim().length === 0) {
      throw new ValidationError("프로필 이미지 URL이 유효하지 않습니다");
    }
    // URL 형식 간단 검증
    try {
      new URL(profileData.profileImage);
    } catch {
      throw new ValidationError("프로필 이미지는 유효한 URL 형식이어야 합니다");
    }
  }

  // 현재 지역 유효성 검사
  if (profileData.currentRegion !== undefined) {
    if (!profileData.currentRegion) {
      throw new ValidationError(PROFILE_ERROR_MESSAGES.CURRENT_REGION_REQUIRED);
    }
    if (!validateRegion(profileData.currentRegion)) {
      throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_REGION);
    }
  }

  // 사용자 서비스 유효성 검사
  if (profileData.userServices !== undefined) {
    if (!Array.isArray(profileData.userServices)) {
      throw new ValidationError("사용자 서비스는 배열 형태여야 합니다");
    }

    // 빈 배열 허용 (서비스 제거 가능)
    if (profileData.userServices.length > 0) {
      if (!validateServiceIds(profileData.userServices)) {
        throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_SERVICE_ID);
      }
    }
  }
};
