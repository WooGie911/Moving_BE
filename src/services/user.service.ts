import {
  getUserById,
  updateCustomerUser,
  createMoverProfile as createMoverProfileRepository,
  checkProfileExists,
  checkNicknameExists,
} from "../repositories/user.repository";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../types/commonError.types";
import {
  TCustomerProfileInput,
  TMoverProfileInput,
  TCreateMoverProfile,
  TUpdateCustomerUser,
} from "../types/user.types";

// Region enum 값 검증
const VALID_REGIONS = [
  "SEOUL",
  "BUSAN",
  "DAEGU",
  "INCHEON",
  "GWANGJU",
  "DAEJEON",
  "ULSAN",
  "SEJONG",
  "GYEONGGI",
  "CHUNGBUK",
  "CHUNGNAM",
  "JEONBUK",
  "JEONNAM",
  "GYEONGBUK",
  "GYEONGNAM",
  "GANGWON",
  "JEJU",
];

// 유저 정보 조회
const userInfo = async (userId: number) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new NotFoundError("존재하지 않는 유저입니다");
  }

  return user;
};

// 일반 유저(CUSTOMER) 프로필 등록
const createCustomerProfile = async (
  userId: number,
  profileData: TCustomerProfileInput
): Promise<any> => {
  // 이미 프로필이 있는지 확인
  const hasProfile = await checkProfileExists(userId);
  if (hasProfile) {
    throw new ForbiddenError("이미 프로필이 등록되어 있습니다");
  }

  // 유효성 검사
  if (!profileData.currentRegion) {
    throw new ValidationError("현재 거주 지역을 선택해주세요");
  }

  if (!profileData.userServices || profileData.userServices.length === 0) {
    throw new ValidationError("이용할 서비스를 하나 이상 선택해주세요");
  }

  if (!VALID_REGIONS.includes(profileData.currentRegion)) {
    throw new ValidationError("유효하지 않은 지역입니다");
  }

  // 유저 정보 업데이트 데이터 준비
  const userData: TUpdateCustomerUser = {
    profileImage: profileData.profileImage,
    currentRegion: profileData.currentRegion,
    hasProfile: true,
  };

  try {
    const result = await updateCustomerUser(
      userId,
      userData,
      profileData.userServices
    );
    return result;
  } catch (error) {
    throw new ValidationError("프로필 등록 중 오류가 발생했습니다");
  }
};

// 기사님(MOVER) 프로필 등록
const createMoverProfile = async (
  userId: number,
  profileData: TMoverProfileInput
): Promise<any> => {
  // 이미 프로필이 있는지 확인
  const hasProfile = await checkProfileExists(userId);
  if (hasProfile) {
    throw new ForbiddenError("이미 프로필이 등록되어 있습니다");
  }

  // 유효성 검사
  if (!profileData.nickname || profileData.nickname.trim() === "") {
    throw new ValidationError("닉네임을 입력해주세요");
  }

  // 닉네임 중복 확인
  const nicknameExists = await checkNicknameExists(profileData.nickname);
  if (nicknameExists) {
    throw new ForbiddenError("이미 사용중인 닉네임입니다");
  }

  if (!profileData.serviceRegions || profileData.serviceRegions.length === 0) {
    throw new ValidationError("서비스 가능 지역을 하나 이상 선택해주세요");
  }

  if (!profileData.serviceTypes || profileData.serviceTypes.length === 0) {
    throw new ValidationError("제공할 서비스를 하나 이상 선택해주세요");
  }

  for (const region of profileData.serviceRegions) {
    if (!VALID_REGIONS.includes(region)) {
      throw new ValidationError(`유효하지 않은 지역입니다: ${region}`);
    }
  }

  // 프로필 생성 데이터 준비
  const createProfileData: TCreateMoverProfile = {
    userId,
    nickname: profileData.nickname,
    profileImage: profileData.profileImage,
    experience: profileData.experience || 0,
    introduction: profileData.introduction || "",
    description: profileData.description || "",
  };

  try {
    const result = await createMoverProfileRepository(
      createProfileData,
      profileData.serviceRegions,
      profileData.serviceTypes
    );
    return result;
  } catch (error) {
    throw new ValidationError("프로필 등록 중 오류가 발생했습니다");
  }
};

export { userInfo, createCustomerProfile, createMoverProfile };
