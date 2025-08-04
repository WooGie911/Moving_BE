import { EstimateRequest, Estimate, User, DesignatedMover } from "@prisma/client";

// 진행중인 견적 응답 타입
export type TPendingQuoteResponse = {
  estimateRequest: {
    id: string;
    customerId: string;
    moveType: string;
    moveDate: Date;
    createdAt: Date;
    description: string | null;
    status: string;
    fromAddress: TAddress;
    toAddress: TAddress;
  } | null;
  estimates: TEstimateResponse[];
};

// 완료된 견적 응답 타입
export type TReceivedQuoteResponse = {
  estimateRequest: {
    id: string;
    customerId: string;
    moveType: string;
    moveDate: Date;
    createdAt: Date;
    description: string | null;
    status: string;
    fromAddress: TAddress;
    toAddress: TAddress;
  };
  estimates: TEstimateResponse[];
};

// 주소 타입
export type TAddress = {
  zoneCode: string;
  city: string;
  district: string;
  detail: string | null;
  region: string;
};

// 견적서 응답 타입
export type TEstimateResponse = {
  id: string;
  price: number;
  comment: string | null;
  status: string;
  isDesignated: boolean;
  createdAt: Date;
  mover: TMoverInfo;
};

export type TMoverInfo = {
  id: string;
  name: string | null;
  userType: string[];
  moverImage: string | null;
  nickname: string | null;
  isVeteran: boolean | null;
  shortIntro: string | null;
  detailIntro: string | null;
  career: number | null;
  workedCount: number | null;
  averageRating: number | null;
  totalReviewCount: number | null;
  totalFavoriteCount: number; // 추가
  serviceTypes: string[];
  serviceAreas: Array<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    district: string | null;
    region: string;
    userId: string;
  }>;
  isFavorite: boolean; // 찜 여부 추가
  Favorite?: Array<{ id: string }>; // Favorite 배열도 select에 포함될 수 있으므로 옵셔널로 추가
};

// 견적 상세 조회 응답 타입
export type TQuoteDetailResponse = {
  id: string;
  price: number;
  comment: string | null;
  status: string;
  isDesignated: boolean;
  createdAt: Date;
  mover: TMoverInfo;
};

// 견적 확정 응답 타입
export type TConfirmEstimateResponse = {
  estimateRequest: {
    id: string;
    customerId: string;
    moveType: string;
    moveDate: Date;
    createdAt: Date;
    description: string | null;
    status: string;
    fromAddress: TAddress;
    toAddress: TAddress;
  };
  estimate: {
    id: string;
    estimateRequestId: string;
    price: number | null;
    comment: string | null;
    status: string;
    isDesignated: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

// 견적 취소 응답 타입
export type TCancelEstimateResponse = {
  id: string;
  estimateRequestId: string;
  price: number | null;
  comment: string | null;
  status: string;
  isDesignated: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// 이사완료 응답 타입
export type TCompleteEstimateResponse = {
  estimateRequest: {
    id: string;
    customerId: string;
    moveType: string;
    moveDate: Date;
    createdAt: Date;
    description: string | null;
    status: string;
    fromAddress: TAddress;
    toAddress: TAddress;
  };
};

// 지정 견적 요청 응답 타입
export type TDesignateEstimateRequest = DesignatedMover;

// 이용 내역 응답 타입
export type TUsageHistoryResponse = {
  id: string;
  moveType: string;
  moveDate: Date;
  fromAddress: TAddress;
  toAddress: TAddress;
  description: string | null;
  status: string;
  confirmedEstimate: {
    id: string;
    price: number;
    comment: string | null;
    mover: TMoverInfo;
  };
  completedAt: Date;
};

// Prisma EstimateRequest with Addresses 타입 (서비스 내부용)
export type EstimateRequestWithAddresses = {
  id: string;
  customerId: string;
  moveType: string;
  moveDate: Date;
  createdAt: Date;
  description: string | null;
  status: string;
  fromAddress: TAddress;
  toAddress: TAddress;
};
