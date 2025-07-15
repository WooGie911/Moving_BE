// 견적 생성 요청 타입
export type CreateEstimateRequest = {
  quoteId: number;
  userId: number;
  price: number;
  description: string;
};

// 견적 반려 요청 타입
export type RejectEstimateRequest = {
  quoteId: number;
  userId: number;
  description: string;
};

// 견적 조회 필터링 타입
export type QuoteFilterOptions = {
  availableRegion: string;
  sortBy?: "movingDate" | "createdAt";
  customerName?: string;
  movingType?: "SMALL" | "HOME" | "OFFICE";
};

// 지정 견적 조회 필터링 타입
export type DesignatedQuoteFilterOptions = {
  moverId: number;
  sortBy?: "movingDate" | "createdAt";
  customerName?: string;
  movingType?: "SMALL" | "HOME" | "OFFICE";
};

// 견적 상태 업데이트 타입
export type UpdateEstimateStatusRequest = {
  estimateId: number;
  userId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
};

// 견적서 업데이트 타입
export type UpdateEstimateRequest = {
  estimateId: number;
  userId: number;
  price: number;
  description: string;
};

// 견적 응답 타입
export type QuoteResponse = {
  id: number;
  userId: number;
  movingType: "SMALL" | "HOME" | "OFFICE";
  movingDate: Date;
  departureAddr: string;
  arrivalAddr: string;
  departureDetail: string | null;
  arrivalDetail: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    name: string;
    currentRole: string;
    currentRegion: string | null;
    profile: {
      nickname: string;
      profileImage: string | null;
      introduction: string;
      description: string;
    } | null;
  };
};

// 견적서 응답 타입
export type EstimateResponse = {
  id: number;
  quoteId: number;
  moverId: number;
  price: number;
  description: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "EXPIRED"
    | "SENT"
    | "MOVER_REJECTED";
  isDesignated: boolean;
  createdAt: Date;
  updatedAt: Date;
  quote?: QuoteResponse;
};

// 내가 보낸 견적서 응답 타입
export type MyEstimateResponse = {
  id: number;
  quoteId: number;
  moverId: number;
  price: number;
  description: string;
  status: string;
  isDesignated: boolean;
  createdAt: Date;
  updatedAt: Date;
  quote: QuoteResponse;
};

// 내가 반려한 견적 응답 타입
export type MyRejectedQuoteResponse = {
  id: number;
  quoteId: number;
  price: number;
  description: string;
  status: string;
  createdAt: Date;
  quote: QuoteResponse;
};
