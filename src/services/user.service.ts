import { v4 as uuidv4 } from "uuid";
import {
  getUserById,
  createCustomerProfile as createCustomerProfileRepository,
  createMoverProfileRepository,
} from "../repositories/user.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  TCustomerProfileInput,
  TMoverProfileInput,
  TCreateMoverProfile,
  TCreateCustomerProfile,
  TUpdateCustomerUser,
} from "../types/user.types";
import {
  validateCustomerProfileData,
  validateMoverProfileData,
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

  return user;
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

export { userInfo, createCustomerProfile, createMoverProfile };
