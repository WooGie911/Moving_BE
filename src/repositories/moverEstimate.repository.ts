import { PrismaClient } from "@prisma/client";
import {
  EstimateWithRelations,
  TMyEstimateResponse,
  TMyRejectedEstimateResponse,
  TEstimateRequestResponse,
} from "../types/moverEstimate";
import { RepositoryQueryError } from "../types/errors.types";

// Prisma 타입과 호환되는 정확한 인터페이스 정의
interface PrismaOrderBy {
  moveDate?: "asc" | "desc";
  createdAt?: "asc" | "desc";
}

interface PrismaWhereCondition {
  status?: string;
  moveDate?: { gt: Date };
  customerId?: { not: string };
  estimates?: {
    none: {
      moverId: string;
      status: { in: string[] };
    };
  };
  designatedMovers?: {
    none: {
      moverId: string;
    };
  };
  OR?: Array<{
    fromAddress: { region: string };
  }>;
  customer?: {
    name: {
      contains: string;
    };
  };
  moveType?: "SMALL" | "HOME" | "OFFICE";
  moverId?: string;
  deletedAt?: null;
  estimateRequest?: {
    status: string;
    moveDate: { gt: Date };
    customerId: { not: string };
    estimates: {
      none: {
        moverId: string;
        status: { in: string[] };
      };
    };
    customer?: {
      name: {
        contains: string;
      };
    };
    moveType?: "SMALL" | "HOME" | "OFFICE";
  };
}

// Prisma 타입을 직접 사용하는 함수들
const createPrismaWhere = (condition: PrismaWhereCondition) => {
  return condition as any; // Prisma 타입과 호환성을 위해 임시로 any 사용
};

const createPrismaOrderBy = (orderBy: PrismaOrderBy) => {
  return orderBy as any; // Prisma 타입과 호환성을 위해 임시로 any 사용
};

const prisma = new PrismaClient();

// 공통 select 옵션 - EstimateRequest용
const estimateRequestSelectOptions = {
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
  customer: {
    select: {
      id: true,
      name: true,
      currentArea: true,
      customerImage: true,
      nickname: true,
    },
  },
  fromAddress: {
    select: {
      id: true,
      zoneCode: true,
      city: true,
      district: true,
      detail: true,
      region: true,
    },
  },
  toAddress: {
    select: {
      id: true,
      zoneCode: true,
      city: true,
      district: true,
      detail: true,
      region: true,
    },
  },
  estimates: {
    select: {
      id: true,
      moverId: true,
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
  },
};

// 공통 select 옵션 - Estimate용
const estimateSelectOptions = {
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
  mover: {
    select: {
      id: true,
      name: true,
      moverImage: true,
      nickname: true,
      shortIntro: true,
      detailIntro: true,
      career: true,
      workedCount: true,
      averageRating: true,
      totalReviewCount: true,
      serviceTypes: true,
    },
  },
  estimateRequest: {
    select: estimateRequestSelectOptions,
  },
};

const moverEstimateRepository = {
  // 견적 요청 조회
  findEstimateRequestById: async (estimateRequestId: string) => {
    try {
      // 파라미터 검증
      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        throw new RepositoryQueryError("유효하지 않은 견적 요청 ID입니다");
      }

      const estimateRequest = await prisma.estimateRequest.findUnique({
        where: { id: estimateRequestId.trim() },
        select: { status: true, moveDate: true },
      });
      return estimateRequest;
    } catch (error) {
      throw new RepositoryQueryError("견적 요청 조회 실패", error);
    }
  },

  // 기존 견적 조회
  findExistingEstimate: async (estimateRequestId: string, moverId: string) => {
    try {
      // 파라미터 검증
      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        throw new RepositoryQueryError("유효하지 않은 견적 요청 ID입니다");
      }

      if (!moverId || typeof moverId !== "string") {
        throw new RepositoryQueryError("유효하지 않은 기사 ID입니다");
      }

      const existingEstimate = await prisma.estimate.findUnique({
        where: {
          estimateRequestId_moverId: {
            estimateRequestId: estimateRequestId.trim(),
            moverId: moverId.trim(),
          },
        },
      });
      return existingEstimate;
    } catch (error) {
      throw new RepositoryQueryError("기존 견적 조회 실패", error);
    }
  },

  // 지정 견적 요청 조회
  findDesignatedRequest: async (estimateRequestId: string, moverId: string) => {
    try {
      // 파라미터 검증
      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        throw new RepositoryQueryError("유효하지 않은 견적 요청 ID입니다");
      }

      if (!moverId || typeof moverId !== "string") {
        throw new RepositoryQueryError("유효하지 않은 기사 ID입니다");
      }

      const designatedRequest = await prisma.designatedMover.findFirst({
        where: {
          estimateRequestId: estimateRequestId.trim(),
          moverId: moverId.trim(),
          deletedAt: null,
        },
      });
      return designatedRequest;
    } catch (error) {
      throw new RepositoryQueryError("지정 견적 요청 조회 실패", error);
    }
  },

  // 기존 견적 개수 조회
  countExistingEstimates: async (estimateRequestId: string) => {
    try {
      // 파라미터 검증
      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        throw new RepositoryQueryError("유효하지 않은 견적 요청 ID입니다");
      }

      const existingEstimates = await prisma.estimate.findMany({
        where: {
          estimateRequestId: estimateRequestId.trim(),
          status: { in: ["PROPOSED", "ACCEPTED"] },
          deletedAt: null,
        },
        select: {
          id: true,
          isDesignated: true,
        },
      });
      return existingEstimates;
    } catch (error) {
      throw new RepositoryQueryError("기존 견적 개수 조회 실패", error);
    }
  },

  // 견적 생성
  createEstimate: async (
    estimateRequestId: string,
    moverId: string,
    price: number,
    comment: string,
    status: "PROPOSED" | "REJECTED",
    isDesignated: boolean
  ): Promise<EstimateWithRelations | null> => {
    try {
      // 파라미터 검증
      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        throw new RepositoryQueryError("유효하지 않은 견적 요청 ID입니다");
      }

      if (!moverId || typeof moverId !== "string") {
        throw new RepositoryQueryError("유효하지 않은 기사 ID입니다");
      }

      if (!price || typeof price !== "number" || price <= 0) {
        throw new RepositoryQueryError("유효하지 않은 가격입니다");
      }

      if (
        !comment ||
        typeof comment !== "string" ||
        comment.trim().length === 0
      ) {
        throw new RepositoryQueryError("유효하지 않은 코멘트입니다");
      }

      if (!status || !["PROPOSED", "REJECTED"].includes(status)) {
        throw new RepositoryQueryError("유효하지 않은 상태입니다");
      }

      if (typeof isDesignated !== "boolean") {
        throw new RepositoryQueryError("유효하지 않은 지정 여부입니다");
      }

      const estimate = await prisma.estimate.create({
        data: {
          estimateRequestId: estimateRequestId.trim(),
          moverId: moverId.trim(),
          price: price,
          comment: comment.trim(),
          status: status,
          isDesignated: isDesignated,
        },
        select: estimateSelectOptions,
      });
      return estimate;
    } catch (error) {
      throw new RepositoryQueryError("견적 생성 실패", error);
    }
  },

  // 사용자 서비스 지역 조회
  findUserServiceAreas: async (moverId: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: moverId },
        select: { currentAreas: true },
      });
      return user?.currentAreas || [];
    } catch (error) {
      throw new RepositoryQueryError("사용자 서비스 지역 조회 실패", error);
    }
  },

  // 서비스 가능 지역 견적 조회 (순수 데이터 조회)
  getRegionEstimateRequest: async (
    moverId: string,
    sortBy?: "moveDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE",
    currentAreas?: string[]
  ): Promise<TEstimateRequestResponse[]> => {
    try {
      let orderBy: PrismaOrderBy = {};
      let where: PrismaWhereCondition = {
        status: "PENDING",
        moveDate: {
          gt: new Date(),
        },
        customerId: {
          not: moverId,
        },
        estimates: {
          none: {
            moverId: moverId,
            status: { in: ["PROPOSED", "REJECTED"] },
          },
        },
      };

      // currentAreas가 있으면 해당 지역만 필터링
      if (currentAreas && currentAreas.length > 0) {
        where.OR = currentAreas.map((region: string) => ({
          fromAddress: { region },
        }));
      }

      // 고객 이름 필터링
      if (customerName) {
        where.customer = {
          name: {
            contains: customerName,
          },
        };
      }

      // 이사 타입 필터링
      if (movingType) {
        where.moveType = movingType;
      }

      switch (sortBy) {
        case "moveDate":
          orderBy = { moveDate: "asc" };
          break;
        case "createdAt":
          orderBy = { createdAt: "desc" };
          break;
        default:
          orderBy = { createdAt: "desc" };
      }

      const estimateRequests = await prisma.estimateRequest.findMany({
        where: where as any,
        select: estimateRequestSelectOptions,
        orderBy: orderBy as any,
      });

      // 각 견적 요청에 대해 지정 견적 여부 확인
      const estimateRequestsWithDesignatedFlag = await Promise.all(
        estimateRequests.map(async (estimateRequest) => {
          const designatedRequest = await prisma.designatedMover.findFirst({
            where: {
              estimateRequestId: estimateRequest.id,
              moverId: moverId,
              deletedAt: null,
            },
          });

          return {
            ...estimateRequest,
            isDesignated: !!designatedRequest,
          };
        })
      );

      return estimateRequestsWithDesignatedFlag;
    } catch (error) {
      throw new RepositoryQueryError("서비스 가능 지역 견적 조회 실패", error);
    }
  },

  // 지정 견적 모두 조회 (순수 데이터 조회)
  getDesignatedEstimateRequest: async (
    moverId: string,
    sortBy?: "moveDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ): Promise<TEstimateRequestResponse[]> => {
    try {
      let orderBy: PrismaOrderBy = {};
      let where: PrismaWhereCondition = {
        moverId: moverId,
        deletedAt: null,
        estimateRequest: {
          status: "PENDING",
          moveDate: {
            gt: new Date(),
          },
          customerId: {
            not: moverId,
          },
          estimates: {
            none: {
              moverId: moverId,
              status: { in: ["PROPOSED", "REJECTED"] },
            },
          },
        },
      };

      // 고객 이름 필터링
      if (customerName) {
        (where as any).estimateRequest = {
          customer: {
            name: {
              contains: customerName,
            },
          },
        };
      }

      // 이사 타입 필터링
      if (movingType) {
        (where as any).estimateRequest = {
          ...(where as any).estimateRequest,
          moveType: movingType,
        };
      }

      switch (sortBy) {
        case "moveDate":
          orderBy = { estimateRequest: { moveDate: "asc" } } as any;
          break;
        case "createdAt":
          orderBy = { estimateRequest: { createdAt: "desc" } } as any;
          break;
        default:
          orderBy = { estimateRequest: { createdAt: "desc" } } as any;
      }

      const designatedRequests = await prisma.designatedMover.findMany({
        where: where as any,
        select: {
          estimateRequest: {
            select: estimateRequestSelectOptions,
          },
        },
        orderBy: orderBy as any,
      });

      // 지정 견적은 모두 isDesignated가 true
      return designatedRequests.map((item) => ({
        ...item.estimateRequest,
        isDesignated: true,
      }));
    } catch (error) {
      throw new RepositoryQueryError("지정 견적 조회 실패", error);
    }
  },

  // 견적 요청 상세 조회 - 1개
  getEstimateRequestById: async (estimateRequestId: string) => {
    try {
      const estimateRequest = await prisma.estimateRequest.findUnique({
        where: {
          id: estimateRequestId,
        },
        select: estimateRequestSelectOptions,
      });
      return estimateRequest;
    } catch (error) {
      throw new RepositoryQueryError("견적 요청 상세 조회 실패", error);
    }
  },

  // 내가 보낸 견적서들 조회
  getMyEstimate: async (moverId: string): Promise<TMyEstimateResponse[]> => {
    try {
      const estimates = await prisma.estimate.findMany({
        where: {
          moverId: moverId,
          status: {
            in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"],
          },
          estimateRequest: {
            customerId: {
              not: moverId,
            },
          },
        },
        select: estimateSelectOptions,
        orderBy: {
          createdAt: "desc",
        },
      });

      // 각 견적에 대해 지정 견적 여부 확인
      const estimatesWithDesignatedFlag = await Promise.all(
        estimates.map(async (estimate) => {
          const designatedRequest = await prisma.designatedMover.findFirst({
            where: {
              estimateRequestId: estimate.estimateRequestId,
              moverId: moverId,
              deletedAt: null,
            },
          });

          return {
            ...estimate,
            isDesignated: !!designatedRequest,
          };
        })
      );

      return estimatesWithDesignatedFlag as TMyEstimateResponse[];
    } catch (error) {
      throw new RepositoryQueryError("내가 보낸 견적서 조회 실패", error);
    }
  },

  // 내가 반려한 견적들 조회
  getMyRejectedEstimates: async (
    moverId: string
  ): Promise<TMyRejectedEstimateResponse[]> => {
    try {
      const rejectedEstimates = await prisma.estimate.findMany({
        where: {
          moverId: moverId,
          status: "REJECTED",
        },
        select: estimateSelectOptions,
        orderBy: {
          createdAt: "desc",
        },
      });

      // 각 견적에 대해 지정 견적 여부 확인
      const estimatesWithDesignatedFlag = await Promise.all(
        rejectedEstimates.map(async (estimate) => {
          const designatedRequest = await prisma.designatedMover.findFirst({
            where: {
              estimateRequestId: estimate.estimateRequestId,
              moverId: moverId,
              deletedAt: null,
            },
          });

          return {
            ...estimate,
            isDesignated: !!designatedRequest,
          };
        })
      );

      return estimatesWithDesignatedFlag as TMyRejectedEstimateResponse[];
    } catch (error) {
      throw new RepositoryQueryError("내가 반려한 견적 조회 실패", error);
    }
  },

  // 견적 존재 여부 및 권한 확인
  checkEstimateOwnership: async (
    estimateId: string,
    moverId: string
  ): Promise<boolean> => {
    try {
      const estimate = await prisma.estimate.findUnique({
        where: {
          id: estimateId,
          moverId: moverId,
        },
      });
      return !!estimate;
    } catch (error) {
      throw new RepositoryQueryError("견적 소유권 확인 실패", error);
    }
  },

  // 견적 상태 업데이트 (순수 데이터 업데이트)
  updateEstimateStatus: async (
    estimateId: string,
    status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED"
  ): Promise<EstimateWithRelations | null> => {
    try {
      const estimate = await prisma.estimate.update({
        where: {
          id: estimateId,
        },
        data: {
          status: status,
        },
        select: estimateSelectOptions,
      });
      return estimate;
    } catch (error) {
      throw new RepositoryQueryError("견적 상태 업데이트 실패", error);
    }
  },

  // 견적서 업데이트 (순수 데이터 업데이트)
  updateEstimatePrice: async (
    estimateId: string,
    price: number,
    comment: string
  ): Promise<EstimateWithRelations | null> => {
    try {
      const estimate = await prisma.estimate.update({
        where: {
          id: estimateId,
        },
        data: {
          price: price,
          comment: comment,
        },
        select: estimateSelectOptions,
      });
      return estimate;
    } catch (error) {
      throw new RepositoryQueryError("견적서 업데이트 실패", error);
    }
  },

  // 견적 상세 정보 조회 (액션 메타데이터용)
  getEstimateDetailForAction: async (estimateId: string) => {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: {
        id: true,
        moverId: true,
        estimateRequestId: true,
        status: true,
        isDesignated: true,
        mover: {
          select: {
            id: true,
            name: true,
            nickname: true,
          },
        },
        estimateRequest: {
          select: {
            id: true,
            customerId: true,
            moveType: true,
            moveDate: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    return estimate;
  },
};

export default moverEstimateRepository;
