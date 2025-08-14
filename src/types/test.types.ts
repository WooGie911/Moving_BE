import {
  EstimateStatus,
  RequestStatus,
  MoveType,
  RegionType,
  UserType,
} from "@prisma/client";

// 테스트용 Estimate 타입 (실제 Estimate 타입과 호환)
export type TestEstimate = {
  id: string;
  status: EstimateStatus;
  price: number | null;
  comment: string | null;
  isDesignated: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  moverId: string;
  estimateRequestId: string;
  rejectReason: string | null;
  workingHours: string | null;
  includesPackaging: boolean;
  insuranceAmount: number | null;
  validUntil: Date | null;
};

// 테스트용 EstimateRequest 타입 (실제 EstimateRequest 타입과 호환)
export type TestEstimateRequest = {
  id: string;
  status: RequestStatus;
  customerId: string;
  moveType: MoveType;
  moveDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  description: string | null;
  fromAddressId: string;
  toAddressId: string;
};

// 테스트용 EstimateRequestWithRelations 타입 (실제 타입과 호환)
export type TestEstimateRequestWithRelations = {
  id: string;
  customerId: string;
  moveType: MoveType;
  moveDate: Date;
  createdAt: Date;
  description: string | null;
  status: RequestStatus;
  fromAddress: {
    zoneCode: string;
    city: string;
    district: string;
    detail: string | null;
    region: RegionType;
  };
  toAddress: {
    zoneCode: string;
    city: string;
    district: string;
    detail: string | null;
    region: RegionType;
  };
  estimates: Array<{
    id: string;
    price: number | null;
    comment: string | null;
    status: EstimateStatus;
    isDesignated: boolean;
    createdAt: Date;
    mover: {
      id: string;
      name: string;
      userType: UserType[];
      moverImage: string | null;
      nickname: string | null;
      isVeteran: boolean | null;
      shortIntro: string | null;
      detailIntro: string | null;
      career: number | null;
      workedCount: number | null;
      averageRating: number | null;
      totalReviewCount: number | null;
      serviceTypes: MoveType[];
      serviceAreas: Array<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        district: string | null;
        region: RegionType;
        userId: string;
      }>;
      totalFavoriteCount: number;
      Favorite: Array<{ id: string }>;
    };
  }>;
};

// 테스트용 MultipleEstimateRequestWithRelations 타입
export type TestMultipleEstimateRequestWithRelations =
  TestEstimateRequestWithRelations[];

// 테스트용 트랜잭션 콜백 함수 타입
export type TestTransactionCallback = (tx: {
  estimateRequest: {
    update: jest.Mock;
  };
  estimate: {
    update: jest.Mock;
    updateMany: jest.Mock;
  };
}) => Promise<any>;
