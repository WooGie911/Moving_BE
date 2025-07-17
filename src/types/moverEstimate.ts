// 견적 생성 요청 타입
export type TCreateEstimateRequest = {
  quoteId: number;
  userId: number;
  price: number;
  description: string;
};

// 견적 반려 요청 타입
export type TRejectEstimateRequest = {
  quoteId: number;
  userId: number;
  description: string;
};

// 견적 조회 필터링 타입
export type TQuoteFilterOptions = {
  availableRegion: string;
  sortBy?: "movingDate" | "createdAt";
  customerName?: string;
  movingType?: "SMALL" | "HOME" | "OFFICE";
};

// 지정 견적 조회 필터링 타입
export type TDesignatedQuoteFilterOptions = {
  moverId: number;
  sortBy?: "movingDate" | "createdAt";
  customerName?: string;
  movingType?: "SMALL" | "HOME" | "OFFICE";
};

// 견적 상태 업데이트 타입
export type TUpdateEstimateStatusRequest = {
  estimateId: number;
  userId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
};

// 견적서 업데이트 타입
export type TUpdateEstimateRequest = {
  estimateId: number;
  userId: number;
  price: number;
  description: string;
};

// 서비스 타입 정의
export type TServiceType = {
  id: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
};

// 프로필 타입 정의
export type TProfile = {
  nickname: string;
  profileImage: string | null;
  introduction: string;
  description: string;
  experience: number;
  completedCount: number;
  avgRating: number;
  reviewCount: number;
  favoriteCount: number;
  serviceTypes: {
    service: TServiceType;
  }[];
};

// 견적 응답 타입
export type TQuoteResponse = {
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
    profile: TProfile | null;
  };
};

// 견적서 응답 타입
export type TEstimateResponse = {
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
  quote?: TQuoteResponse;
};

// 내가 보낸 견적서 응답 타입
export type TMyEstimateResponse = {
  id: number;
  quoteId: number;
  moverId: number;
  price: number;
  description: string;
  status: string;
  isDesignated: boolean;
  createdAt: Date;
  updatedAt: Date;
  quote: TQuoteResponse;
  mover: {
    id: number;
    name: string;
    currentRole: string;
    profile: TProfile | null;
  };
};

// 내가 반려한 견적 응답 타입
export type TMyRejectedQuoteResponse = {
  id: number;
  quoteId: number;
  price: number;
  description: string;
  status: string;
  createdAt: Date;
  quote: TQuoteResponse;
  mover: {
    id: number;
    name: string;
    currentRole: string;
    profile: TProfile | null;
  };
};
