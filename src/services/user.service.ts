import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import {
  getUserById,
  getUserWithPassword,
  createCustomerProfile as createCustomerProfileRepository,
  createMoverProfileRepository,
  updateUserProfile,
  checkNicknameExists,
} from "../repositories/user.repository";
import { encryptPhoneNumber } from "../utils/phoneEncryption";
import { NotFoundError, ValidationError } from "../types/commonError.types";
import {
  TCustomerProfileInput,
  TMoverProfileInput,
  TUpdateUserProfile,
  TCreateMoverProfile,
  TCreateCustomerProfile,
  TUserRole,
} from "../types/user.types";
import { PROFILE_ERROR_MESSAGES } from "../constants/profile.constants";
import {
  validateCustomerProfileData,
  validateMoverProfileData,
} from "../utils/validators/profileValidator";

// 유저 정보 조회
const userInfo = async (userId: string, userType: TUserRole) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (userType === "CUSTOMER") {
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      customerImage: user.customerImage || "",
      userType,
    };
  } else if (userType === "MOVER") {
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      moverImage: user.moverImage || "",
      userType,
    };
  }
};

// 일반 유저(CUSTOMER) 프로필 등록 및 업데이트
const createCustomerProfile = async (
  userId: string,
  profileData: TCustomerProfileInput
): Promise<any> => {
  // 사용자 존재 확인
  const user = await getUserById(userId);
  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // 프로필 데이터 유효성 검사
  await validateCustomerProfileData(profileData, userId);

  // 프로필 생성 데이터 준비
  const createProfileData: TCreateCustomerProfile = {
    userId,
    nickname: profileData.nickname!,
    customerImage: profileData.customerImage,
    currentArea: profileData.currentArea,
    preferredServices: profileData.preferredServices,
  };

  const result = await createCustomerProfileRepository(createProfileData);
  return result;
};

// 기사님(MOVER) 프로필 등록
const createMoverProfile = async (
  userId: string,
  profileData: TMoverProfileInput
): Promise<any> => {
  // 사용자 존재 확인
  const user = await getUserById(userId);
  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // 프로필 데이터 유효성 검사
  await validateMoverProfileData(profileData, userId);

  // 프로필 생성 데이터 준비
  const createProfileData: TCreateMoverProfile = {
    userId,
    nickname: profileData.nickname,
    moverImage: profileData.moverImage,
    career: profileData.career || 0,
    shortIntro: profileData.shortIntro || "",
    detailIntro: profileData.detailIntro || "",
    currentAreas: profileData.currentAreas,
    serviceTypes: profileData.serviceTypes,
  };

  const result = await createMoverProfileRepository(createProfileData);
  return result;
};

// 기사님 기본정보 수정
const updateMoverBasicInfo = async (
  userId: string,
  updateData: {
    name?: string;
    phoneNumber?: string;
    currentPassword?: string;
    newPassword?: string;
  }
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
    dbUpdateData.encryptedPhoneNumber = encryptPhoneNumber(
      updateData.phoneNumber
    );
  }
  if (updateData.newPassword !== undefined) {
    const saltRounds = 10;
    dbUpdateData.encryptedPassword = await bcrypt.hash(
      updateData.newPassword,
      saltRounds
    );
  }

  // 4. 업데이트 실행 (User 테이블만)
  await updateUserProfile(userId, dbUpdateData);
};

export {
  userInfo,
  createCustomerProfile,
  createMoverProfile,
  updateMoverBasicInfo,
};
