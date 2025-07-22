import bcrypt from "bcrypt";
import {
  getUserById,
  getUserWithPassword,
  createCustomerProfile as createCustomerProfileRepository,
  createMoverProfileRepository,
  updateUserProfile,
  getCustomerProfile,
  getMoverProfile,
  updateCustomerProfile,
} from "../repositories/user.repository";
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
} from "../types/user.types";
import { PROFILE_ERROR_MESSAGES } from "../constants/profile.constants";
import {
  validateCustomerProfileData,
  validateMoverProfileData,
} from "../utils/validators/profileValidator";
import { generateToken } from "../utils/generateToken";

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
      email: user.email,
      phoneNumber: user.encryptedPhoneNumber
        ? decryptPhoneNumber(user.encryptedPhoneNumber)
        : null,
      nickname: user.nickname,
      customerImage: user.customerImage || "",
      userType,
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
    };
  }
};

// 프로필 정보 조회
const getProfileData = async (userId: string, userType: TUserRole) => {
  if (userType === "CUSTOMER") {
    const profile = await getCustomerProfile(userId);

    if (!profile) {
      throw new NotFoundError(PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const { encryptedPhoneNumber, ...rest } = profile;
    const phoneNumber = encryptedPhoneNumber
      ? decryptPhoneNumber(encryptedPhoneNumber)
      : null;

    return { ...rest, phoneNumber };
  } else if (userType === "MOVER") {
    const profile = await getMoverProfile(userId);
    return profile;
  }
};

// 일반 유저(CUSTOMER) 프로필 등록
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

  const { newAccessToken, newRefreshToken } = generateToken({
    id: user.id,
    name: user.name,
    nickname: profileData.nickname || "",
    userType: user.userType[0],
  });

  const result = await createCustomerProfileRepository(createProfileData);
  return {
    result,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

// 일반 유저(CUSTOMER) 프로필 수정
const updateCustomerProfileCheck = async (
  userId: string,
  updateData: TCustomerProfileUpdateInput
) => {
  const user = await getUserWithPassword(userId);
  if (!user) {
    throw new NotFoundError(PROFILE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (user.userType[0] !== "CUSTOMER") {
    throw new ValidationError("유저 타입이 일반 유저가 아닙니다");
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

  // 업데이트 데이터 준비
  const encryptedPhoneNumber = encryptPhoneNumber(updateData.phoneNumber!);

  const newUpdateData: TCustomerProfileUpdate = {
    name: updateData.name,
    nickname: updateData.nickname,
    email: updateData.email,
    encryptedPhoneNumber,
    encryptedPassword: updateData.password
      ? await bcrypt.hash(updateData.password, 10)
      : undefined,
    customerImage: updateData.customerImage,
    currentArea: updateData.currentArea,
    preferredServices: updateData.preferredServices,
  };

  await updateCustomerProfile(userId, newUpdateData);
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

  const { newAccessToken, newRefreshToken } = generateToken({
    id: user.id,
    name: user.name,
    nickname: profileData.nickname || "",
    userType: user.userType[0],
  });

  const result = await createMoverProfileRepository(createProfileData);
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
  getProfileData,
  createCustomerProfile,
  updateCustomerProfileCheck,
  createMoverProfile,
  updateMoverBasicInfo,
};
