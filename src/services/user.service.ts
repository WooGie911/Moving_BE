import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import {
  getUserById,
  getUserWithPassword,
  createCustomerProfile as createCustomerProfileRepository,
  createMoverProfileRepository,
  updateUserProfile,
  checkProfileExists,
} from "../repositories/user.repository";
import { encryptPhoneNumber, decryptPhoneNumber } from "../utils/phoneEncryption";
import { NotFoundError, ValidationError } from "../types/commonError.types";
import {
  TCustomerProfileInput,
  TMoverProfileInput,
  TUserProfileUpdateInput,
  TUpdateUserProfile,
  TCreateMoverProfile,
  TCreateCustomerProfile,
  TUpdateCustomerUser,
} from "../types/user.types";
import {
  validateCustomerProfileData,
  validateMoverProfileData,
  validateUpdateCustomerProfile,
} from "../utils/validators/profileValidator";
import {
  PROFILE_DEFAULTS,
  NICKNAME_CONFIG,
  PROFILE_ERROR_MESSAGES,
} from "../constants/profile.constants";

// 유저 정보 조회
const userInfo = async (userId: number) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // email, phoneNumber(복호화)도 함께 반환
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.encryptedPhoneNumber ? decryptPhoneNumber(user.encryptedPhoneNumber) : "",
    currentRole: user.currentRole,
    accessToken: user.accessToken,
    hasProfile: user.hasProfile,
  };
};

// UUID 기반 닉네임 생성 함수
const generateUuidNickname = (): string => {
  const uuid = uuidv4()
    .replace(/-/g, "")
    .substring(0, NICKNAME_CONFIG.UUID_LENGTH);
  return `${NICKNAME_CONFIG.PREFIX}${uuid}`;
};

// 일반 유저(CUSTOMER) 프로필 등록
const createCustomerProfile = async (
  userId: number,
  profileData: TCustomerProfileInput
): Promise<any> => {
  // 통합 유효성 검사
  await validateCustomerProfileData(userId, profileData);

  // UUID 기반 닉네임 생성 (중복 가능성 없음)
  const nickname = generateUuidNickname();

  // 프로필 생성 데이터 준비
  const createProfileData: TCreateCustomerProfile = {
    userId,
    nickname,
    profileImage: profileData.profileImage,
    experience: PROFILE_DEFAULTS.CUSTOMER_EXPERIENCE,
    introduction: PROFILE_DEFAULTS.EMPTY_INTRODUCTION,
    description: PROFILE_DEFAULTS.EMPTY_DESCRIPTION,
  };

  // user 테이블 업데이트 데이터 준비
  const userData: TUpdateCustomerUser = {
    currentRegion: profileData.currentRegion,
    hasProfile: PROFILE_DEFAULTS.HAS_PROFILE_TRUE,
  };

  const result = await createCustomerProfileRepository(
    createProfileData,
    userData,
    profileData.userServices
  );
  return result;
};

// 기사님(MOVER) 프로필 등록
const createMoverProfile = async (
  userId: number,
  profileData: TMoverProfileInput
): Promise<any> => {
  // 통합 유효성 검사

  await validateMoverProfileData(userId, profileData);

  // 프로필 생성 데이터 준비
  const createProfileData: TCreateMoverProfile = {
    userId,
    nickname: profileData.nickname,
    profileImage: profileData.profileImage,
    experience: profileData.experience!,
    introduction: profileData.introduction!,
    description: profileData.description!,
  };

  const result = await createMoverProfileRepository(
    createProfileData,
    profileData.serviceRegions,
    profileData.serviceTypes
  );
  return result;
};

// 사용자 프로필 수정
const updateCustomerProfile = async (
  userId: number,
  updateData: TUserProfileUpdateInput
): Promise<void> => {
  // 1. 입력 데이터 유효성 검사
  await validateUpdateCustomerProfile(updateData);

  // 2. 사용자 존재 확인
  const user = await getUserById(userId);
  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // 3. 프로필 존재 확인 (프로필 관련 업데이트가 있는 경우)
  if (
    updateData.profileImage !== undefined ||
    updateData.userServices !== undefined
  ) {
    const profileExists = await checkProfileExists(userId);
    if (!profileExists) {
      throw new NotFoundError(PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }
  }

  // 4. 비밀번호 변경 요청 시 현재 비밀번호 검증
  if (updateData.currentPassword && updateData.newPassword) {
    // 사용자 정보 조회 (비밀번호 포함)
    const userWithPassword = await getUserWithPassword(userId);
    if (!userWithPassword || !userWithPassword.encryptedPassword) {
      throw new ValidationError("현재 비밀번호를 확인할 수 없습니다");
    }

    // 현재 비밀번호 검증
    const isCurrentPasswordValid = await bcrypt.compare(
      updateData.currentPassword,
      userWithPassword.encryptedPassword
    );
    if (!isCurrentPasswordValid) {
      throw new ValidationError("현재 비밀번호가 일치하지 않습니다");
    }
  }

  // 5. 업데이트 데이터 준비
  const dbUpdateData: TUpdateUserProfile = {};

  // 이름 준비
  if (updateData.name !== undefined) {
    dbUpdateData.name = updateData.name.trim();
  }

  // 전화번호 암호화 및 준비
  if (updateData.phoneNumber !== undefined) {
    dbUpdateData.encryptedPhoneNumber = encryptPhoneNumber(
      updateData.phoneNumber
    );
  }

  // 새 비밀번호 암호화 및 준비
  if (updateData.newPassword !== undefined) {
    const saltRounds = 10;
    dbUpdateData.encryptedPassword = await bcrypt.hash(
      updateData.newPassword,
      saltRounds
    );
  }

  // 현재 지역 준비
  if (updateData.currentRegion !== undefined) {
    dbUpdateData.currentRegion = updateData.currentRegion;
  }

  // 프로필 이미지 준비
  if (updateData.profileImage !== undefined) {
    dbUpdateData.profileImage = updateData.profileImage;
  }

  // 현재 지역 준비
  if (updateData.currentRegion !== undefined) {
    dbUpdateData.currentRegion = updateData.currentRegion;
  }

  // 6. 통합 업데이트 실행
  await updateUserProfile(userId, dbUpdateData, updateData.userServices);
};

// 기사님 기본정보 수정 
const updateMoverBasicInfo = async (
  userId: number,
  updateData: { name?: string; phoneNumber?: string; currentPassword?: string; newPassword?: string }
): Promise<void> => {
  // 1. 사용자 존재 확인
  const user = await getUserById(userId);
  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // 2. 비밀번호 변경 요청 시 현재 비밀번호 검증
  if (updateData.currentPassword && updateData.newPassword) {
    const userWithPassword = await getUserWithPassword(userId);
    if (!userWithPassword || !userWithPassword.encryptedPassword) {
      throw new ValidationError("현재 비밀번호를 확인할 수 없습니다");
    }
    const isCurrentPasswordValid = await bcrypt.compare(
      updateData.currentPassword,
      userWithPassword.encryptedPassword
    );
    if (!isCurrentPasswordValid) {
      throw new ValidationError("현재 비밀번호가 일치하지 않습니다");
    }
  }

  // 3. 업데이트 데이터 준비
  const dbUpdateData: TUpdateUserProfile = {};
  if (updateData.name !== undefined) {
    dbUpdateData.name = updateData.name.trim();
  }
  if (updateData.phoneNumber !== undefined) {
    dbUpdateData.encryptedPhoneNumber = encryptPhoneNumber(updateData.phoneNumber);
  }
  if (updateData.newPassword !== undefined) {
    const saltRounds = 10;
    dbUpdateData.encryptedPassword = await bcrypt.hash(updateData.newPassword, saltRounds);
  }

  // 4. 업데이트 실행 (User 테이블만)
  await updateUserProfile(userId, dbUpdateData);
};

export {
  userInfo,
  createCustomerProfile,
  createMoverProfile,
  updateCustomerProfile,
  updateMoverBasicInfo,
};
