// 주소 정보 인터페이스 (API 요청용)
export interface IAddressInfo {
  roadAddress: string; // 도로명주소 (예: "서울특별시 강남구 테헤란로 123")
  detailAddress?: string; // 상세주소 (예: "456호")
  postalCode?: string; // 우편번호 (예: "06123")
  zonecode?: string; // 우편번호 (카카오 API 응답용)
  jibunAddress?: string; // 지번주소 (예: "서울특별시 강남구 역삼동 123-45")
  extraAddress?: string; // 참고항목 (예: "역삼동")
}

// 견적 요청 생성 타입
export type TCreateEstimateRequest = {
  userId: string;
  movingType: string;
  movingDate: string;
  departure: IAddressInfo;
  arrival: IAddressInfo;
  description?: string;
};

// 견적 요청 수정 타입
export type TUpdateEstimateRequest = {
  movingType?: string;
  movingDate?: string;
  departure?: IAddressInfo;
  arrival?: IAddressInfo;
  description?: string;
};

// 파싱된 주소 데이터 (내부 처리용)
export interface IParsedAddressData {
  postalCode: string; // 우편번호
  region: string; // 1단계: 광역시/도 (예: "서울특별시", "경기도")
  city: string; // 2단계: 시/군/구 (예: "강남구", "수원시", "창원시")
  district: string; // 3단계: 동/읍/면 (예: "역삼동", "삼척읍", "정자동")
  detail: string | null; // 4단계: 상세주소 (예: "테헤란로 123", "옆집")
}

// 견적 요청 응답 인터페이스
export interface IEstimateRequestResponse {
  id: string;
  userId: string;
  movingType: string;
  departureAddress: string;
  arrivalAddress: string;
  departureDetailAddress?: string;
  arrivalDetailAddress?: string;
  departurePostalCode?: string;
  arrivalPostalCode?: string;
  movingDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 데이터베이스 주소 인터페이스
export interface IDatabaseAddress {
  postalCode: string;
  city: string;
  district: string;
  detail: string | null;
  region: string;
  deletedAt: Date | null;
}

// 데이터베이스 견적 요청 인터페이스
export interface IDatabaseEstimateRequest {
  id: string;
  customerId: string;
  moveType: string;
  moveDate: Date;
  fromAddressId: string;
  toAddressId: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  fromAddress?: IDatabaseAddress | null;
  toAddress?: IDatabaseAddress | null;
}

// 견적 요청 생성 데이터 타입
export type TCreateEstimateRequestData = {
  moveType: string;
  moveDate: string;
  fromAddressId: string;
  toAddressId: string;
  description?: string;
};

// 견적 요청 수정 데이터 타입
export type TUpdateEstimateRequestData = {
  moveType?: string;
  moveDate?: Date;
  fromAddressId?: string;
  toAddressId?: string;
  description?: string;
};

// 사용자 타입 확인 결과 인터페이스
export interface IUserTypeResult {
  isCustomer: boolean;
  isMover: boolean;
}

// 서비스에서 사용하는 타입들
export interface IAddressInfoForService {
  roadAddress: string;
  detailAddress?: string;
  postalCode?: string;
  zonecode?: string;
  jibunAddress?: string;
  extraAddress?: string;
}

// 컨트롤러에서 사용하는 타입들
export interface ICreateValidationData {
  movingType: string;
  movingDate: string;
  departure: IAddressInfo;
  arrival: IAddressInfo;
  description?: string;
}

export interface IUpdateValidationData {
  movingType?: string;
  movingDate?: string;
  departure?: IAddressInfo;
  arrival?: IAddressInfo;
  description?: string;
}

export interface IValidationResult {
  isValid: boolean;
  errors: string[];
}
