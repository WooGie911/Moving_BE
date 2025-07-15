import {
  DesignatedEstimateRequest,
  Quote,
  Estimate,
  Profile,
} from "@prisma/client";

// 견적 요청 타입
export type ConfirmEstimateRequest = {
  userId: number;
  estimateId: number;
};

// 지정 견적 요청 타입
export type DesignateQuoteRequest = {
  quoteId: number;
  userId: number;
  message: string;
  moverId: number;
};

// 견적 응답 타입 (진행중인 견적)
export type PendingQuoteResponse = {
  quote: {
    id: number;
    movingType: string;
    createdAt: Date;
    departureAddr: string;
    arrivalAddr: string;
    departureDetail: string | null;
    status: string;
    confirmedEstimateId: number | null;
    estimateCount: number;
    designatedEstimateCount: number;
  };
  estimates: EstimateResponse[];
};

// 견적 응답 타입 (완료된 견적)
export type ReceivedQuoteResponse = {
  quote: {
    id: number;
    movingType: string;
    createdAt: Date;
    departureAddr: string;
    arrivalAddr: string;
    departureDetail: string | null;
    status: string;
    confirmedEstimateId: number | null;
    estimateCount: number;
    designatedEstimateCount: number;
  };
  estimates: EstimateResponse[];
};

// 견적서 응답 타입
export type EstimateResponse = {
  id: number;
  price: number;
  description: string;
  status: string;
  isDesignated: boolean;
  mover: {
    id: number;
    name: string;
    currentRole: string;
    profile: {
      nickname: string;
      profileImage: string | null;
      experience: number;
      introduction: string;
      description: string;
      completedCount: number;
      avgRating: number;
      reviewCount: number;
      favoriteCount: number;
    } | null;
  };
};

// 견적 상세 조회 응답 타입
export type QuoteDetailResponse = {
  id: number;
  price: number;
  description: string;
  status: string;
  isDesignated: boolean;
  mover: {
    id: number;
    name: string;
    currentRole: string;
    profile: {
      nickname: string;
      profileImage: string | null;
      experience: number;
      introduction: string;
      description: string;
      completedCount: number;
      avgRating: number;
      reviewCount: number;
      favoriteCount: number;
    } | null;
  };
};

// 견적 확정 응답 타입
export type ConfirmEstimateResponse = {
  quote: Quote;
  estimate: Estimate;
};

// 지정 견적 요청 응답 타입
export type DesignateQuoteResponse = DesignatedEstimateRequest;

// 기존 타입들 (레거시 호환성용)
export type TQuote = Pick<
  Quote,
  | "movingType"
  | "createdAt"
  | "departureAddr"
  | "arrivalAddr"
  | "departureDetail"
  | "status"
  | "confirmedEstimateId"
  | "estimateCount"
  | "designatedEstimateCount"
> & {
  estimates: TEstimate[] | null;
};

export type TEstimate = Pick<
  Estimate,
  "price" | "description" | "status" | "isDesignated"
> & {
  mover: {
    id: number;
    name: string;
    currentRole: string;
    profile: Pick<
      Profile,
      | "nickname"
      | "profileImage"
      | "experience"
      | "introduction"
      | "description"
      | "completedCount"
      | "avgRating"
      | "reviewCount"
      | "favoriteCount"
    > | null;
  };
};

export type TConfirmEstimateResult = {
  quote: Quote;
  estimate: Estimate;
};

export type TDesignatedEstimateRequest = Pick<
  DesignatedEstimateRequest,
  "quoteId" | "customerId" | "moverId" | "message" | "status" | "expiresAt"
>;
