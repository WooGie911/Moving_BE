import bcrypt from "bcrypt";
import userRepository from "../repositories/user.repository";
import {
  encryptPhoneNumber,
  decryptPhoneNumber,
} from "../utils/phoneEncryption";
import { NotFoundError, ValidationError } from "../types/commonError.types";
import {
  TCustomerProfileInput,
  TMoverProfileInput,
  TUpdateUserProfile,
  TCreateMoverProfile,
  TCreateCustomerProfile,
  TUserRole,
  TCustomerProfileUpdateInput,
  TCustomerProfileUpdate,
  TMoverProfileUpdateInput,
} from "../types/user.types";
import { PROFILE_ERROR_MESSAGES } from "../constants/profile.constants";
import {
  validateCustomerProfileData,
  validateMoverProfileData,
} from "../utils/validators/profileValidator";
import { generateToken } from "../utils/generateToken";
import { validateMoverProfileUpdate } from "../utils/validators/userValidator";
import actionService from "./action.service";
import { ActionType } from "@prisma/client";

// 유저 정보 조회
const userInfo = async (userId: string, userType: TUserRole) => {
  const user = await userRepository.getUserById(userId);

  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (userType === "CUSTOMER") {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.encryptedPhoneNumber
        ? decryptPhoneNumber(user.encryptedPhoneNumber)
        : null,
      nickname: user.nickname,
      customerImage: user.customerImage || "",
      userType,
      provider: user.provider,
      hasBothProfiles: !!user.isCustomer && !!user.isMover,
    };
  } else if (userType === "MOVER") {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.encryptedPhoneNumber
        ? decryptPhoneNumber(user.encryptedPhoneNumber)
        : null,
      nickname: user.nickname,
      moverImage: user.moverImage || "",
      userType,
      provider: user.provider,
      hasBothProfiles: !!user.isCustomer && !!user.isMover,
    };
  }
};

// 프로필 정보 조회
const getProfileData = async (userId: string, userType: TUserRole) => {
  if (userType === "CUSTOMER") {
    const profile = await userRepository.getCustomerProfile(userId);

    if (!profile) {
      throw new NotFoundError(PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const { encryptedPhoneNumber, ...rest } = profile;
    const phoneNumber = encryptedPhoneNumber
      ? decryptPhoneNumber(encryptedPhoneNumber)
      : null;

    return { ...rest, phoneNumber };
  } else if (userType === "MOVER") {
    const profile = await userRepository.getMoverProfile(userId);

    if (!profile) {
      throw new NotFoundError(PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    return profile;
  }
};

// 일반 유저(CUSTOMER) 프로필 등록
const createCustomerProfile = async (
  userId: string,
  profileData: TCustomerProfileInput
): Promise<any> => {
  // 사용자 존재 확인
  const user = await userRepository.getUserById(userId);
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

  const { newAccessToken, newRefreshToken } = generateToken({
    id: user.id,
    name: user.name,
    userType: "CUSTOMER",
    hasProfile: true,
  });

  const result = await userRepository.createCustomerProfile(createProfileData);

  // WELCOME 액션 생성 (프로필 등록 시점)
  await actionService.createAction(
    userId,
    ActionType.WELCOME,
    userId,
    "WELCOME",
    { userType: "CUSTOMER" }
  );

  return {
    result,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    provider: user.provider,
  };
};

// 일반 유저(CUSTOMER) 프로필 수정
const updateCustomerProfileCheck = async (
  userId: string,
  updateData: TCustomerProfileUpdateInput
) => {
  const user = await userRepository.getUserWithPassword(userId);
  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // 비밀번호 변경 요청 시 현재 비밀번호 검증
  if (updateData.password) {
    const isCurrentPasswordValid = await bcrypt.compare(
      updateData.password,
      user.encryptedPassword!
    );
    if (!isCurrentPasswordValid) {
      throw new ValidationError("현재 비밀번호가 일치하지 않습니다");
    }
  }

  // 유효성 검사
  await validateCustomerProfileData(updateData, userId);

  // 업데이트 데이터 준비
  const encryptedPhoneNumber = encryptPhoneNumber(updateData.phoneNumber!);

  // 비밀 번호 변경 요청 시 새로운 비밀번호 암호화 및 업데이트
  let newEncryptedPassword: string | undefined;
  if (updateData.newPassword) {
    newEncryptedPassword = await bcrypt.hash(updateData.newPassword, 10);
  } else {
    // 아니라면 원래 비밀번호 다시 저장
    newEncryptedPassword = user.encryptedPassword || undefined;
  }

  const newUpdateData: TCustomerProfileUpdate = {
    name: updateData.name,
    nickname: updateData.nickname,
    email: updateData.email,
    encryptedPhoneNumber,
    encryptedPassword: newEncryptedPassword,
    customerImage: updateData.customerImage,
    currentArea: updateData.currentArea,
    preferredServices: updateData.preferredServices,
  };

  await userRepository.updateCustomerProfile(userId, newUpdateData);
};

// 기사님(MOVER) 프로필 등록
const createMoverProfile = async (
  userId: string,
  profileData: TMoverProfileInput
): Promise<any> => {
  // 사용자 존재 확인
  const user = await userRepository.getUserById(userId);
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

  const { newAccessToken, newRefreshToken } = generateToken({
    id: user.id,
    name: user.name,
    userType: "MOVER",
    hasProfile: true,
  });

  const result = await userRepository.createMoverProfile(createProfileData);

  // WELCOME 액션 생성 (프로필 등록 시점)
  await actionService.createAction(
    userId,
    ActionType.WELCOME,
    userId,
    "WELCOME",
    { userType: "MOVER" }
  );

  return {
    result,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
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
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // 2. 비밀번호 변경 요청 시 현재 비밀번호 검증
  if (updateData.currentPassword && updateData.newPassword) {
    const userWithPassword = await userRepository.getUserWithPassword(userId);
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
  await userRepository.updateUserProfile(userId, dbUpdateData);
};

// 기사님 프로필 수정
const updateMoverProfileCheck = async (
  userId: string,
  updateData: TMoverProfileUpdateInput
): Promise<any> => {
  // 1. 사용자 존재 확인
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // 2. 프로필 데이터 유효성 검사
  await validateMoverProfileUpdate(updateData, userId);

  // 3. 프로필 업데이트 실행
  const result = await userRepository.updateMoverProfile(userId, updateData);
  return result;
};

export {
  userInfo,
  getProfileData,
  createCustomerProfile,
  updateCustomerProfileCheck,
  createMoverProfile,
  updateMoverBasicInfo,
  updateMoverProfileCheck,
};
