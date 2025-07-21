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
export const validateRegion = (region: RegionType): boolean => {
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
  return validRegions.includes(region);
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
    throw new ValidationError(PROFILE_ERROR_MESSAGES.NICKNAME_ALREADY_EXISTS);
  }
};

// Customer 프로필 데이터 유효성 검사
export const validateCustomerProfileData = async (
  profileData: TCustomerProfileInput
): Promise<void> => {
  // 닉네임 유효성 검사 (선택사항)
  if (profileData.nickname) {
    await ensureNicknameUnique(profileData.nickname);
  }

  // 현재 지역 유효성 검사
  if (!profileData.currentArea) {
    throw new ValidationError(PROFILE_ERROR_MESSAGES.CURRENT_REGION_REQUIRED);
  }

  if (!validateRegion(profileData.currentArea)) {
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
  profileData: TMoverProfileInput
): Promise<void> => {
  console.log("profileData", profileData);

  // 1. 닉네임 검사 및 중복 확인 (필수)
  await ensureNicknameUnique(profileData.nickname);

  // 2. 현재 활동 지역 유효성 검사 (필수)
  if (!profileData.currentArea) {
    throw new ValidationError(
      PROFILE_ERROR_MESSAGES.MOVER_CURRENT_REGION_REQUIRED
    );
  }

  if (!validateRegion(profileData.currentArea)) {
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

  // 7. 프로필 이미지 유효성 검사 (선택사항, URL 형식 체크)
  if (profileData.moverImage !== undefined && profileData.moverImage !== null) {
    if (profileData.moverImage.trim().length === 0) {
      throw new ValidationError("프로필 이미지 URL이 유효하지 않습니다");
    }
    // URL 형식 간단 검증
    try {
      new URL(profileData.moverImage);
    } catch {
      throw new ValidationError(
        "프로필 이미지는 유효한 URL 형식이어야 합니다 "
      );
    }
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
    if (!validateRegion(profileData.currentRegion as RegionType)) {
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
      // userServices는 number[] 타입이므로 MoveType으로 변환 필요
      const moveTypes = profileData.userServices.map((serviceId) => {
        switch (serviceId) {
          case 1:
            return "SMALL" as MoveType;
          case 2:
            return "HOME" as MoveType;
          case 3:
            return "OFFICE" as MoveType;
          default:
            throw new ValidationError(
              PROFILE_ERROR_MESSAGES.INVALID_SERVICE_ID
            );
        }
      });

      if (!validateMoveTypes(moveTypes)) {
        throw new ValidationError(PROFILE_ERROR_MESSAGES.INVALID_SERVICE_ID);
      }
    }
  }
};
