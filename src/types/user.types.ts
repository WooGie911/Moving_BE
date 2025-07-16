export type TUser = {
  id: number; // 추후 uuid로 변경?
  email: string;
  name: string;
  encryptedPassword: string;
  encryptedPhoneNumber: string;
  currentRole: "CUSTOMER" | "MOVER";
};

export type TUserTokenCreate = Pick<TUser, "id" | "name" | "currentRole">;

export type TUserSignupInput = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  currentRole: "CUSTOMER" | "MOVER";
};

export type TUserSignup = Omit<TUser, "id">;

export type TUserRequest = {
  userId: number;
  name: string;
  role: "CUSTOMER" | "MOVER";
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

// 일반 유저(CUSTOMER) 프로필 등록 입력 타입
export type TCustomerProfileInput = {
  profileImage?: string;
  currentRegion: string; // Region enum 값
  userServices: number[]; // Service ID 배열
};

// 기사님(MOVER) 프로필 등록 입력 타입
export type TMoverProfileInput = {
  profileImage?: string;
  nickname: string;
  experience?: number;
  introduction?: string;
  description?: string;
  serviceRegions: string[]; // Region enum 값 배열
  serviceTypes: number[]; // Service ID 배열
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

// 사용자 업데이트 데이터 타입 (CUSTOMER용)
export type TUpdateCustomerUser = {
  profileImage?: string;
  currentRegion: string;
  hasProfile: boolean;
};
