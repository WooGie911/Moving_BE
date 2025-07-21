// =============================================================================
// Enum 타입 정의 (스키마 기반)
// =============================================================================

// 스키마에 정의된 enum들을 직접 타입으로 정의
export type UserType = "CUSTOMER" | "MOVER";
export type AuthProvider = "LOCAL" | "GOOGLE" | "NAVER" | "KAKAO";
export type MoveType = "SMALL" | "HOME" | "OFFICE";
export type RegionType =
  | "SEOUL"
  | "BUSAN"
  | "DAEGU"
  | "INCHEON"
  | "GWANGJU"
  | "DAEJEON"
  | "ULSAN"
  | "SEJONG"
  | "GYEONGGI"
  | "GANGWON"
  | "CHUNGBUK"
  | "CHUNGNAM"
  | "JEONBUK"
  | "JEONNAM"
  | "GYEONGBUK"
  | "GYEONGNAM"
  | "JEJU";

// 요청 상태
export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

// 견적 상태
export type EstimateStatus =
  | "PROPOSED"
  | "ACCEPTED"
  | "REJECTED"
  | "AUTO_REJECTED";

// =============================================================================
// 기본 타입 정의
// =============================================================================

// 기존 코드 호환성을 위한 타입 alias
export type TUserRole = UserType; // "CUSTOMER" | "MOVER"

// 사용자 기본 정보 타입 (스키마 기반)
export type TUser = {
  id: string;
  email: string;
  encryptedPassword: string | null;
  encryptedPhoneNumber: string | null;
  name: string;
  userType: UserType[];
  provider: AuthProvider;
  providerId: string | null;
  customerImage: string | null;
  moverImage: string | null;
  nickname: string | null;
  isVeteran: boolean | null;
  currentArea: RegionType;
  preferredServices: MoveType[];
  shortIntro: string | null;
  detailIntro: string | null;
  career: number | null;
  workedCount: number | null;
  averageRating: number | null;
  totalReviewCount: number | null;
  serviceTypes: MoveType[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

// 기존 코드 호환성을 위한 타입 (현재 많은 곳에서 사용됨)
export type TUserLegacy = {
  id: string;
  email: string;
  name: string;
  encryptedPassword: string;
  encryptedPhoneNumber: string;
  userType: TUserRole; // 실제로는 userType 배열의 첫 번째 요소 또는 기본값
};

// 토큰 생성용 타입
export type TUserTokenCreate = {
  id: string; // 기존 코드 호환성
  name: string;
  userType: TUserRole; // 기존 코드 호환성
};

// =============================================================================
// 회원가입 관련 타입
// =============================================================================

// 회원가입 입력 타입
export type TUserSignupInput = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  userType: TUserRole; // 기존 코드 호환성
};

// 회원가입 처리용 타입 (기존 코드 호환성)
export type TUserSignup = {
  email: string;
  name: string;
  encryptedPassword: string;
  encryptedPhoneNumber: string;
  userType: TUserRole;
  currentArea?: RegionType;
};

// 소셜 로그인 회원가입 입력 타입
export type TSocialSignupInput = {
  name: string;
  email: string;
  provider: AuthProvider;
  providerId: string;
  userType: TUserRole;
  phoneNumber?: string;
};

// =============================================================================
// 요청/응답 타입
// =============================================================================

// 사용자 요청 정보 타입
export type TUserRequest = {
  userId: string; // 기존 코드 호환성
  name: string;
  userType: TUserRole;
};

// 기본 사용자 응답 타입
export type TUserResponse = {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  userType: UserType[];
  provider: AuthProvider;
  currentArea: RegionType;
  profileImage: string | null; // customerImage 또는 moverImage
  isVeteran: boolean | null;
  createdAt: Date;
};

// =============================================================================
// 프로필 관련 타입
// =============================================================================

// Customer 전용 프로필 타입
export type TCustomerProfile = {
  id: string;
  name: string;
  nickname: string | null;
  email: string;
  customerImage: string | null;
  currentArea: RegionType;
  preferredServices: MoveType[];
  isVeteran: boolean | null;
  createdAt: Date;
};

// Mover 전용 프로필 타입
export type TMoverProfile = {
  id: string;
  name: string;
  nickname: string | null;
  email: string;
  moverImage: string | null;
  currentArea: RegionType;
  serviceTypes: MoveType[];
  shortIntro: string | null;
  detailIntro: string | null;
  career: number | null;
  workedCount: number | null;
  averageRating: number | null;
  totalReviewCount: number | null;
  isVeteran: boolean | null;
  createdAt: Date;
};

// Customer 프로필 등록 입력 타입
export type TCustomerProfileInput = {
  nickname?: string;
  customerImage?: string;
  currentArea: RegionType;
  preferredServices: MoveType[];
  isVeteran?: boolean;
};

// Mover 프로필 등록 입력 타입
export type TMoverProfileInput = {
  nickname: string;
  moverImage?: string;
  currentArea: RegionType;
  serviceTypes: MoveType[];
  shortIntro?: string;
  detailIntro?: string;
  career?: number;
  isVeteran?: boolean;
};

// =============================================================================
// 업데이트 관련 타입
// =============================================================================

// 사용자 기본 정보 업데이트 타입
export type TUserUpdateInput = {
  name?: string;
  phoneNumber?: string;
  currentPassword?: string;
  newPassword?: string;
  currentArea?: RegionType;
};

// Customer 프로필 업데이트 타입
export type TCustomerProfileUpdateInput = {
  nickname?: string;
  customerImage?: string;
  currentArea?: RegionType;
  preferredServices?: MoveType[];
  isVeteran?: boolean;
};

// Mover 프로필 업데이트 타입
export type TMoverProfileUpdateInput = {
  nickname?: string;
  moverImage?: string;
  currentArea?: RegionType;
  serviceTypes?: MoveType[];
  shortIntro?: string;
  detailIntro?: string;
  career?: number;
  isVeteran?: boolean;
};

// 데이터베이스 업데이트용 타입
export type TUserUpdateData = {
  name?: string;
  encryptedPhoneNumber?: string;
  encryptedPassword?: string;
  nickname?: string;
  customerImage?: string;
  moverImage?: string;
  currentArea?: RegionType;
  preferredServices?: MoveType[];
  serviceTypes?: MoveType[];
  shortIntro?: string;
  detailIntro?: string;
  career?: number;
  isVeteran?: boolean;
};

// =============================================================================
// 기존 코드 호환성을 위한 타입들 (Deprecated - 점진적 마이그레이션 필요)
// =============================================================================

// @deprecated - TUser로 대체 예정
export type TUserProfile = {
  userId: string;
  nickname: string;
  profileImage?: string | null;
  experience: number;
  introduction: string;
  description: string;
};

// @deprecated - TMoverProfileInput으로 대체 예정
export type TCreateMoverProfile = {
  userId: string;
  nickname: string;
  profileImage?: string;
  experience: number;
  introduction: string;
  description: string;
};

// @deprecated - TCustomerProfileInput으로 대체 예정
export type TCreateCustomerProfile = {
  userId: string;
  nickname: string;
  profileImage?: string;
  experience?: number;
  introduction?: string;
  description?: string;
};

// @deprecated - TUserUpdateData로 대체 예정
export type TUpdateCustomerUser = {
  currentRegion: string;
  hasProfile: boolean;
};

// @deprecated - 새로운 타입으로 대체 예정
export type TUserProfileUpdateInput = {
  name?: string;
  phoneNumber?: string;
  currentPassword?: string;
  newPassword?: string;
  profileImage?: string;
  currentRegion?: RegionType;
  userServices?: number[];
};

// @deprecated - TUserUpdateData로 대체 예정
export type TUpdateUserProfile = {
  name?: string;
  encryptedPhoneNumber?: string;
  encryptedPassword?: string;
  currentRegion?: RegionType;
  profileImage?: string;
};

// 서비스 ID 타입 (MoveType enum 사용 권장)
export type TServiceId = 1 | 2 | 3; // 1: SMALL, 2: HOME, 3: OFFICE

// =============================================================================
// 유틸리티 타입
// =============================================================================

// 공개 정보만 포함하는 사용자 타입 (민감한 정보 제외)
export type TUserPublic = Omit<
  TUser,
  "encryptedPassword" | "encryptedPhoneNumber" | "providerId"
>;

// 인증된 사용자 정보 타입
export type TAuthenticatedUser = Pick<
  TUser,
  "id" | "email" | "name" | "userType" | "nickname" | "currentArea"
> & {
  currentRole: TUserRole; // 기존 코드 호환성
  hasProfile: boolean; // 기존 코드 호환성
};
