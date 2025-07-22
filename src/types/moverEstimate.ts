// 견적 생성 요청 타입
export type TCreateEstimateRequest = {
  estimateRequestId: string;
  moverId: string;
  price: number;
  comment: string;
};

// 견적 반려 요청 타입
export type TRejectEstimateRequest = {
  estimateRequestId: string;
  moverId: string;
  comment: string;
};

// 견적 조회 필터링 타입
export type TEstimateRequestFilterOptions = {
  sortBy?: "moveDate" | "createdAt";
  customerName?: string;
  movingType?: "SMALL" | "HOME" | "OFFICE";
};

// 지정 견적 조회 필터링 타입
export type TDesignatedEstimateRequestFilterOptions = {
  moverId: string;
  sortBy?: "moveDate" | "createdAt";
  customerName?: string;
  movingType?: "SMALL" | "HOME" | "OFFICE";
};

// 견적 상태 업데이트 타입
export type TUpdateEstimateStatusRequest = {
  estimateId: string;
  moverId: string;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED";
};

// 견적서 업데이트 타입
export type TUpdateEstimateRequest = {
  estimateId: string;
  moverId: string;
  price: number;
  comment: string;
};

// 주소 타입 정의
export type TAddress = {
  id: string;
  postalCode: string;
  city: string;
  district: string;
  detail: string | null;
  region: string;
};

// 고객 타입 정의
export type TCustomer = {
  id: string;
  name: string;
  currentArea: string | null;
  customerImage: string | null;
  nickname: string | null;
};

// 기사님 타입 정의
export type TMover = {
  id: string;
  name: string;
  moverImage: string | null;
  nickname: string | null;
  shortIntro: string | null;
  detailIntro: string | null;
  career: number | null;
  workedCount: number | null;
  averageRating: number | null;
  totalReviewCount: number | null;
  serviceTypes: string[];
};

// 견적 요청 응답 타입
export type TEstimateRequestResponse = {
  id: string;
  customerId: string;
  moveType: "SMALL" | "HOME" | "OFFICE";
  moveDate: Date;
  fromAddressId: string;
  toAddressId: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  customer: TCustomer;
  fromAddress: TAddress;
  toAddress: TAddress;
};

// 견적서 응답 타입
export type TEstimateResponse = {
  id: string;
  moverId: string;
  estimateRequestId: string;
  price: number | null;
  comment: string | null;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED";
  rejectReason: string | null;
  isDesignated: boolean;
  workingHours: string | null;
  includesPackaging: boolean;
  insuranceAmount: number | null;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  mover: TMover;
  estimateRequest: TEstimateRequestResponse;
};

// 내가 보낸 견적서 응답 타입
export type TMyEstimateResponse = {
  id: string;
  moverId: string;
  estimateRequestId: string;
  price: number | null;
  comment: string | null;
  status: "PROPOSED" | "ACCEPTED" | "AUTO_REJECTED";
  rejectReason: string | null;
  isDesignated: boolean;
  workingHours: string | null;
  includesPackaging: boolean;
  insuranceAmount: number | null;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  mover: TMover;
  estimateRequest: TEstimateRequestResponse;
};

// 내가 반려한 견적 응답 타입
export type TMyRejectedEstimateResponse = {
  id: string;
  moverId: string;
  estimateRequestId: string;
  price: number | null;
  comment: string | null;
  status: "REJECTED";
  rejectReason: string | null;
  isDesignated: boolean;
  workingHours: string | null;
  includesPackaging: boolean;
  insuranceAmount: number | null;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  mover: TMover;
  estimateRequest: TEstimateRequestResponse;
};

export type EstimateWithRelations = {
  id: string;
  moverId: string;
  estimateRequestId: string;
  price: number | null;
  comment: string | null;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED";
  rejectReason: string | null;
  isDesignated: boolean;
  workingHours: string | null;
  includesPackaging: boolean;
  insuranceAmount: number | null;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  mover: {
    id: string;
    name: string;
    moverImage: string | null;
    nickname: string | null;
    shortIntro: string | null;
    detailIntro: string | null;
    career: number | null;
    workedCount: number | null;
    averageRating: number | null;
    totalReviewCount: number | null;
    serviceTypes: string[];
  };
  estimateRequest: {
    id: string;
    customerId: string;
    moveType: "SMALL" | "HOME" | "OFFICE";
    moveDate: Date;
    fromAddressId: string;
    toAddressId: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    customer: {
      id: string;
      name: string;
      currentArea: string | null;
      customerImage: string | null;
      nickname: string | null;
    };
    fromAddress: {
      id: string;
      postalCode: string;
      city: string;
      district: string;
      detail: string | null;
      region: string;
    };
    toAddress: {
      id: string;
      postalCode: string;
      city: string;
      district: string;
      detail: string | null;
      region: string;
    };
  };
};
