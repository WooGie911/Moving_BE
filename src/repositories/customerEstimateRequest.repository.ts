import {
  EstimateRequest,
  Estimate,
  User,
  EstimateStatus,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import {
  SingleEstimateRequestWithRelations,
  MultipleEstimateRequestWithRelations,
} from "../types/repository.types";
import { RepositoryQueryError } from "../types/errors.types";

const prisma = new PrismaClient();

const customerEstimateRequestRepository = {
  //활성상태인 견적 아이디 조회
  getActiveEstimateRequest: async (userId: string): Promise<string | null> => {
    try {
      const EstimateRequest = await prisma.estimateRequest.findFirst({
        where: {
          customerId: userId,
          status: { in: ["PENDING", "APPROVED"] },
        },
        select: {
          id: true,
        },
      });

      if (!EstimateRequest) return null;
      return EstimateRequest.id;
    } catch (error) {
      throw new RepositoryQueryError(
        `사용자 ${userId}의 활성 견적요청 조회 실패`,
        error
      );
    }
  },

  // 이사업체 검색
  getMover: async (moverId: string): Promise<User | null> => {
    try {
      const mover = await prisma.user.findUnique({
        where: {
          id: moverId,
        },
      });

      if (!mover) return null;
      return mover;
    } catch (error) {
      throw new RepositoryQueryError(`이사업체 ID ${moverId} 조회 실패`, error);
    }
  },

  // 진행중인 이사 견적들 조회
  getPendingEstimateRequest: async (
    activeEstimateRequestId: string,
    userId: string
  ): Promise<SingleEstimateRequestWithRelations> => {
    try {
      const pendingEstimateRequest = await prisma.estimateRequest.findFirst({
        where: {
          id: activeEstimateRequestId,
          status: { in: ["PENDING", "APPROVED"] },
          deletedAt: null,
        },
        orderBy: { moveDate: "asc" },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          createdAt: true,
          description: true,
          status: true,
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
          estimates: {
            where: {
              price: {
                not: null,
              },
              status: {
                in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"],
              },
            },
            select: {
              id: true,
              price: true,
              comment: true,
              status: true,
              isDesignated: true,
              createdAt: true, // 누락된 필드 추가
              mover: {
                select: {
                  id: true,
                  name: true,
                  userType: true,
                  moverImage: true,
                  nickname: true,
                  isVeteran: true,
                  shortIntro: true,
                  detailIntro: true,
                  career: true,
                  workedCount: true,
                  averageRating: true,
                  totalReviewCount: true,
                  serviceTypes: true,
                  serviceAreas: true,
                  totalFavoriteCount: true,
                  // 순수 데이터만 반환 - 가공은 Service에서 처리
                  Favorite: {
                    where: {
                      customerId: userId,
                      deletedAt: null,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Repository는 순수 데이터만 반환
      return pendingEstimateRequest;
    } catch (error) {
      throw new RepositoryQueryError(
        `진행중인 견적요청 조회 실패 - 활성ID: ${activeEstimateRequestId}, 사용자ID: ${userId}`,
        error
      );
    }
  },

  // 완료된 견적요청 목록 조회
  getReceivedEstimateRequests: async (
    userId: string
  ): Promise<MultipleEstimateRequestWithRelations> => {
    try {
      const receivedEstimateRequests = await prisma.estimateRequest.findMany({
        where: {
          customerId: userId,
          status: { in: ["EXPIRED", "COMPLETED", "COMPLETED"] },
        },
        select: {
          id: true,
          customerId: true,
          moveType: true,
          moveDate: true,
          createdAt: true,
          description: true,
          status: true,
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
          estimates: {
            where: {
              price: {
                not: null,
              },
              status: {
                in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"],
              },
            },
            select: {
              id: true,
              price: true,
              comment: true,
              status: true,
              isDesignated: true,
              createdAt: true,
              mover: {
                select: {
                  id: true,
                  name: true,
                  userType: true,
                  moverImage: true,
                  nickname: true,
                  isVeteran: true,
                  shortIntro: true,
                  detailIntro: true,
                  career: true,
                  workedCount: true,
                  averageRating: true,
                  totalReviewCount: true,
                  serviceTypes: true,
                  serviceAreas: true,
                  totalFavoriteCount: true,
                  // 순수 데이터만 반환 - 가공은 Service에서 처리
                  Favorite: {
                    where: {
                      customerId: userId,
                      deletedAt: null,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Repository는 순수 데이터만 반환
      return receivedEstimateRequests;
    } catch (error) {
      throw new RepositoryQueryError(
        `사용자 ${userId}의 완료된 견적요청 목록 조회 실패`,
        error
      );
    }
  },

  // 견적요청 ID로 견적요청 조회
  getEstimateRequestById: async (
    estimateRequestId: string
  ): Promise<EstimateRequest | null> => {
    try {
      const estimateRequest = await prisma.estimateRequest.findUnique({
        where: { id: estimateRequestId },
      });
      return estimateRequest;
    } catch (error) {
      throw new RepositoryQueryError(
        `견적요청 ID ${estimateRequestId} 조회 실패`,
        error
      );
    }
  },

  // 견적 ID와 견적요청 ID로 견적 조회
  getEstimateByIdAndRequestId: async (
    estimateId: string,
    estimateRequestId: string
  ): Promise<Estimate | null> => {
    try {
      const estimate = await prisma.estimate.findUnique({
        where: {
          id: estimateId,
          estimateRequestId: estimateRequestId,
        },
      });
      return estimate;
    } catch (error) {
      throw new RepositoryQueryError(`견적 ID ${estimateId} 조회 실패`, error);
    }
  },

  // 견적요청 상태 업데이트
  updateEstimateRequestStatus: async (
    estimateRequestId: string,
    status: "PENDING" | "APPROVED" | "COMPLETED" | "EXPIRED"
  ): Promise<EstimateRequest> => {
    try {
      const updatedEstimateRequest = await prisma.estimateRequest.update({
        where: { id: estimateRequestId },
        data: { status },
      });
      return updatedEstimateRequest;
    } catch (error) {
      throw new RepositoryQueryError(
        `견적요청 상태 업데이트 실패 - 견적요청ID: ${estimateRequestId}, 상태: ${status}`,
        error
      );
    }
  },

  // 견적 상태 업데이트
  updateEstimateStatus: async (
    estimateId: string,
    status: EstimateStatus
  ): Promise<Estimate> => {
    try {
      const updatedEstimate = await prisma.estimate.update({
        where: { id: estimateId },
        data: { status },
      });
      return updatedEstimate;
    } catch (error) {
      throw new RepositoryQueryError(
        `견적 상태 업데이트 실패 - 견적ID: ${estimateId}, 상태: ${status}`,
        error
      );
    }
  },

  // 견적요청의 모든 견적 상태 일괄 업데이트
  updateAllEstimatesStatus: async (
    estimateRequestId: string,
    status: EstimateStatus,
    excludeEstimateId?: string
  ): Promise<void> => {
    try {
      await prisma.estimate.updateMany({
        where: {
          estimateRequestId: estimateRequestId,
          ...(excludeEstimateId && { id: { not: excludeEstimateId } }),
        },
        data: { status },
      });
    } catch (error) {
      throw new RepositoryQueryError(
        `견적 일괄 상태 업데이트 실패 - 견적요청ID: ${estimateRequestId}, 상태: ${status}`,
        error
      );
    }
  },
};
export default customerEstimateRequestRepository;
