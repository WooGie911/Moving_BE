// 기사님 스케줄 조회 필터링 타입
export type TMoverScheduleFilterOptions = {
  moverId: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: "moveDate" | "createdAt";
};

// 스케줄 응답 타입 (프론트엔드 Schedule 인터페이스와 매핑)
export type TMoverScheduleResponse = {
  id: string;
  customerName: string;
  movingType: "소형이사" | "가정이사" | "원룸이사" | "사무실이사";
  status: "confirmed" | "pending";
  fromAddress: string;
  toAddress: string;
  moveDate: string; // YYYY-MM-DD 형식
};

// 기사님 스케줄 상세 정보 (내부 처리용)
export type TMoverScheduleWithDetails = {
  estimateId: string;
  estimateRequestId: string;
  moverId: string;
  moveDate: Date;
  moveType: "SMALL" | "HOME" | "OFFICE";
  requestStatus: string;
  customer: {
    id: string;
    name: string;
    customerImage: string | null;
    nickname: string | null;
  };
  fromAddress: {
    id: string;
    zoneCode: string;
    city: string;
    district: string;
    detail: string | null;
    region: string;
  };
  toAddress: {
    id: string;
    zoneCode: string;
    city: string;
    district: string;
    detail: string | null;
    region: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

// 이사 타입 변환 유틸리티 타입
export type MoveTypeMapping = {
  SMALL: "소형이사";
  HOME: "가정이사";
  OFFICE: "사무실이사";
};

// 상태 변환 유틸리티 타입
export type StatusMapping = {
  APPROVED: "confirmed";
  PENDING: "pending";
};
