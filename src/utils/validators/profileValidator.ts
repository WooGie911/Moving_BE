import { VALID_REGIONS } from "../../constants/regions.constants";
import {
  PROFILE_ERROR_MESSAGES,
  VALIDATION_CONFIG,
} from "../../constants/profile.constants";
import { ValidationError, ForbiddenError } from "../../types/commonError.types";
import {
  TCustomerProfileInput,
  TMoverProfileInput,
  TUserProfileUpdateInput,
  MoveType,
  RegionType,
} from "../../types/user.types";
import { checkNicknameExists } from "../../repositories/user.repository";

// MoveType 유효성 검사
export const validateMoveTypes = (moveTypes: MoveType[]): boolean => {
  if (!moveTypes || moveTypes.length < VALIDATION_CONFIG.MIN_SERVICE_COUNT) {
    return false;
  }
  const validTypes: MoveType[] = ["SMALL", "HOME", "OFFICE"];
  return moveTypes.every((type) => validTypes.includes(type));
};

// Region 유효성 검사 함수
export const validateRegion = (regions: RegionType[]): boolean => {
  const validRegions: RegionType[] = [
    "SEOUL",
    "BUSAN",
    "DAEGU",
    "INCHEON",
    "GWANGJU",
    "DAEJEON",
    "ULSAN",
    "SEJONG",
    "GYEONGGI",
    "GANGWON",
    "CHUNGBUK",
    "CHUNGNAM",
    "JEONBUK",
    "JEONNAM",
    "GYEONGBUK",
    "GYEONGNAM",
    "JEJU",
  ];
  return regions.every((region) => validRegions.includes(region));
};

// 닉네임 중복 확인 및 에러 처리
export const ensureNicknameUnique = async (
  nickname: string,
  excludeUserId?: string
): Promise<void> => {
  if (
    !nickname ||
    nickname.trim().length < VALIDATION_CONFIG.MIN_NICKNAME_LENGTH
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.NICKNAME_REQUIRED);
  }

  const nicknameExists = await checkNicknameExists(nickname, excludeUserId);
  if (nicknameExists) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.NICKNAME_ALREADY_EXISTS);
  }
};

// Customer 프로필 데이터 유효성 검사
export const validateCustomerProfileData = async (
  profileData: TCustomerProfileInput,
  userId?: string
): Promise<void> => {
  // 닉네임 유효성 검사 (선택사항)
  if (profileData.nickname) {
    await ensureNicknameUnique(profileData.nickname, userId);
  }

  // 현재 지역 유효성 검사
  if (!profileData.currentArea) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.CURRENT_REGION_REQUIRED);
  }

  // currentArea가 배열로 들어온 경우 체크
  if (Array.isArray(profileData.currentArea)) {
    throw new ValidationError("현재 거주 지역은 하나만 선택해주세요");
  }

  if (!validateRegion([profileData.currentArea])) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_REGION);
  }

  // 선호 서비스 유효성 검사
  if (
    !profileData.preferredServices ||
    profileData.preferredServices.length < VALIDATION_CONFIG.MIN_SERVICE_COUNT
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.USER_SERVICES_REQUIRED);
  }

  if (!validateMoveTypes(profileData.preferredServices)) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_SERVICE_ID);
  }
};

// 기사님(MOVER) 프로필 데이터 유효성 검사
export const validateMoverProfileData = async (
  profileData: TMoverProfileInput,
  userId?: string
): Promise<void> => {
  // 1. 닉네임 검사 및 중복 확인 (필수)
  await ensureNicknameUnique(profileData.nickname, userId);

  // 2. 현재 활동 지역 유효성 검사 (필수)
  if (!profileData.currentAreas) {
    throw new ValidationError(
      PROFILE_ERROR_MESSAGES.MOVER_CURRENT_REGION_REQUIRED
    );
  }
  if (!validateRegion(profileData.currentAreas)) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_REGION);
  }

  // 3. 제공 서비스 타입 유효성 검사 (필수)
  if (
    !profileData.serviceTypes ||
    profileData.serviceTypes.length < VALIDATION_CONFIG.MIN_SERVICE_COUNT
  ) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.SERVICE_TYPES_REQUIRED);
  }

  if (!validateMoveTypes(profileData.serviceTypes)) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_SERVICE_ID);
  }

  // 4. 경력 유효성 검사 (선택사항, 있으면 0 이상)
  if (profileData.career !== undefined && profileData.career < 0) {
    throw new ValidationError("경력은 0년 이상이어야 합니다");
  } else if (!profileData.career) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.EXPERIENCE_REQUIRED);
  }

  // 5. 한줄 소개 유효성 검사 (선택사항, 있으면 최소 길이 체크)
  if (profileData.shortIntro !== undefined) {
    if (
      profileData.shortIntro.trim().length > 0 &&
      profileData.shortIntro.trim().length <
        VALIDATION_CONFIG.MIN_INTRODUCTION_LENGTH
    ) {
      throw new ValidationError(PROFILE_ERROR_MESSAGES.INTRODUCTION_REQUIRED);
    }
  } else if (!profileData.shortIntro) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.INTRODUCTION_REQUIRED);
  }

  // 6. 상세 소개 유효성 검사 (선택사항, 있으면 최소 길이 체크)
  if (profileData.detailIntro !== undefined) {
    if (
      profileData.detailIntro.trim().length > 0 &&
      profileData.detailIntro.trim().length <
        VALIDATION_CONFIG.MIN_DESCRIPTION_LENGTH
    ) {
      throw new ValidationError(PROFILE_ERROR_MESSAGES.DESCRIPTION_REQUIRED);
    }
  } else if (!profileData.detailIntro) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.DESCRIPTION_REQUIRED);
  }
};
