import { Region } from "@prisma/client";

export type TUserRole = "CUSTOMER" | "MOVER";

export type TUser = {
  id: number; // 추후 uuid로 변경?
  email: string;
  name: string;
  encryptedPassword: string;
  encryptedPhoneNumber: string;
  currentRole: TUserRole;
};

export type TUserTokenCreate = Pick<TUser, "id" | "name" | "currentRole">;

export type TUserSignupInput = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  currentRole: TUserRole;
};

export type TUserSignup = Omit<TUser, "id">;

export type TUserRequest = {
  userId: number;
  name: string;
  role: TUserRole;
};

export type TUserProfile = {
  id: number;
  userId: number;
  nickname: string;
  profileImage?: string | null;
  experience: number;
  introduction: string;
  description: string;
};

// 서비스 ID 리터럴 타입 (DB의 고정된 서비스들)
export type TServiceId = 1 | 2 | 3; // 1: 소형이사, 2: 가정이사, 3: 사무실이사

// 일반 유저(CUSTOMER) 프로필 등록 입력 타입
export type TCustomerProfileInput = {
  profileImage?: string;
  currentRegion: string; // Region enum 값
  userServices: TServiceId[]; // Service ID 배열 (1, 2, 3만 가능)
};

// 기사님(MOVER) 프로필 등록 입력 타입
export type TMoverProfileInput = {
  profileImage?: string;
  nickname: string;
  experience?: number;
  introduction?: string;
  description?: string;
  serviceRegions: string[]; // Region enum 값 배열
  serviceTypes: TServiceId[]; // Service ID 배열 (1, 2, 3만 가능)
};

// 프로필 생성 데이터 타입 (MOVER용)
export type TCreateMoverProfile = {
  userId: number;
  nickname: string;
  profileImage?: string;
  experience: number;
  introduction: string;
  description: string;
};

// 일반 유저(CUSTOMER) 프로필 생성 데이터 타입
export type TCreateCustomerProfile = {
  userId: number;
  nickname: string;
  profileImage?: string;
  experience?: number;
  introduction?: string;
  description?: string;
};

// 사용자 업데이트 데이터 타입 (CUSTOMER용)
export type TUpdateCustomerUser = {
  currentRegion: string;
  hasProfile: boolean;
};

// 통합된 사용자 프로필 수정 입력 타입 (기본 정보 + 프로필 정보)
export type TUserProfileUpdateInput = {
  // 기본 정보
  name?: string;
  phoneNumber?: string;
  // 비밀번호 변경 (현재 비밀번호 검증 필요)
  currentPassword?: string;
  newPassword?: string;
  // 프로필 정보
  profileImage?: string;
  currentRegion?: Region;
  userServices?: TServiceId[];
};

// 통합된 사용자 프로필 업데이트 데이터 타입 (DB용)
export type TUpdateUserProfile = {
  // user 테이블 업데이트
  name?: string;
  encryptedPhoneNumber?: string;
  encryptedPassword?: string;
  currentRegion?: Region;
  // profile 테이블 업데이트
  profileImage?: string;
};
