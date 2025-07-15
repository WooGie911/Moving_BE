import { MovingType, RequestStatus, Region } from "@prisma/client";

// 프론트엔드에서 오는 주소 객체 타입
export interface IAddressInfo {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  extraAddress: string;
  detailAddress: string;
}

// 백엔드에서 사용하는 주소 정보 타입
export interface IBackendAddressInfo {
  address: string;
  detail?: string;
  region?: Region;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

// 견적 요청 기본 타입
export interface IQuoteRequest {
  id: number;
  userId: number;
  movingType: MovingType;
  departureAddr: string;
  arrivalAddr: string;
  departureDetail?: string;
  arrivalDetail?: string;
  departureRegion?: Region;
  arrivalRegion?: Region;
  movingDate: Date;
  description?: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 견적 요청 생성 요청 타입
export interface ICreateQuoteRequest {
  movingType: string; // 소문자로 오는 경우 처리
  departure: IAddressInfo;
  arrival: IAddressInfo;
  movingDate: string;
  isDateConfirmed: boolean;
  description?: string;
}

// 견적 요청 수정 요청 타입
export interface IUpdateQuoteRequest {
  movingType?: string;
  departure?: IAddressInfo;
  arrival?: IAddressInfo;
  movingDate?: string;
  isDateConfirmed?: boolean;
  description?: string;
}

// 백엔드에서 사용하는 견적 요청 데이터 타입
export interface IBackendQuoteData {
  movingType: MovingType;
  departureAddress: string;
  arrivalAddress: string;
  departureDetail?: string;
  arrivalDetail?: string;
  departureRegion?: Region;
  arrivalRegion?: Region;
  movingDate: string;
  description?: string;
}

// 견적 요청 수정용 백엔드 데이터 타입
export interface IBackendUpdateQuoteData {
  movingType?: MovingType;
  departureAddress?: string;
  arrivalAddress?: string;
  departureDetail?: string;
  arrivalDetail?: string;
  departureRegion?: Region;
  arrivalRegion?: Region;
  movingDate?: string;
  description?: string;
}

// 견적 요청 응답 타입
export interface IQuoteResponse {
  success: boolean;
  message: string;
  data?: IQuoteRequest;
}
