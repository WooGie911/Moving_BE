import shareRepository from "../repositories/share.repository";
import { ServiceDataProcessingError } from "../types/errors.types";
import { Estimate } from "@prisma/client";

// 견적요청 조회 결과 타입 정의 (프론트엔드 TEstimateRequestResponse와 일치)
type TEstimateRequestWithRelations = {
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
    nickname: string | null;
    name: string | null;
  };
  fromAddress: {
    zoneCode: string;
    city: string;
    district: string;
    detail: string | null;
    region: string;
  };
  toAddress: {
    zoneCode: string;
    city: string;
    district: string;
    detail: string | null;
    region: string;
  };
};

const shareService = {
  // 공유데이터 조회
  getShareData: async (
    estimateRequestId: string,
    estimateId?: string
  ): Promise<{
    estimateRequest: TEstimateRequestWithRelations | null;
    estimate: {
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
    } | null;
  }> => {
    try {
      const estimateRequest =
        await shareRepository.getEstimateRequest(estimateRequestId);
      const estimate = estimateId
        ? await shareRepository.getEstimate(estimateId)
        : null;

      return { estimateRequest, estimate };
    } catch (error) {
      throw new ServiceDataProcessingError("공유 데이터 조회 실패", error);
    }
  },
};

export default shareService;
