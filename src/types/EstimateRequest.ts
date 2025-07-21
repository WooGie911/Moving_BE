import {
  EstimateRequest,
  Estimate,
  User,
  DesignatedMover,
} from "@prisma/client";

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
  };
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
  postalCode: string;
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
  name: string;
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
  serviceTypes: any;
  serviceAreas: any;
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
  estimateRequest: EstimateRequest;
  estimate: Estimate;
};

// 지정 견적 요청 응답 타입
export type TDesignateEstimateRequest = DesignatedMover;

// 이용 내역 응답 타입
export type TQuoteHistoryResponse = {
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
