import { EstimateRequest, Estimate } from "@prisma/client";
import prisma from "../db/prisma/prisma";
import { RepositoryQueryError } from "../types/errors.types";

const shareRepository = {
  // 견적요청 조회
  getEstimateRequest: async (
    estimateRequestId: string
  ): Promise<{
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
    customer: {
      id: string;
      nickname: string | null;
      name: string | null;
    };
  } | null> => {
    try {
      const estimateRequest = await prisma.estimateRequest.findUnique({
        where: {
          id: estimateRequestId,
        },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          fromAddressId: true,
          toAddressId: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          fromAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          toAddress: {
            select: {
              zoneCode: true,
              city: true,
              district: true,
              detail: true,
              region: true,
            },
          },
          customer: {
            select: {
              id: true,
              nickname: true,
              name: true,
            },
          },
        },
      });

      if (!estimateRequest) return null;
      return estimateRequest;
    } catch (error) {
      throw new RepositoryQueryError(
        `견적요청 ID ${estimateRequestId} 조회 실패`,
        error
      );
    }
  },

  // 견적 조회 (프론트엔드 TMyEstimateResponse와 일치)
  getEstimate: async (
    estimateId: string
  ): Promise<{
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
  } | null> => {
    try {
      const estimate = await prisma.estimate.findUnique({
        where: {
          id: estimateId,
        },
        select: {
          id: true,
          moverId: true,
          estimateRequestId: true,
          price: true,
          comment: true,
          status: true,
          rejectReason: true,
          isDesignated: true,
          workingHours: true,
          includesPackaging: true,
          insuranceAmount: true,
          validUntil: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });
      if (!estimate) return null;
      return estimate;
    } catch (error) {
      throw new RepositoryQueryError(`견적 ID ${estimateId} 조회 실패`, error);
    }
  },
};
export default shareRepository;
