import { Estimate, PrismaClient } from "@prisma/client";
import {
  EstimateWithRelations,
  TMyEstimateResponse,
  TMyRejectedEstimateResponse,
} from "../types/moverEstimate";

// 커스텀 타입 정의

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
      postalCode: true,
      city: true,
      district: true,
      detail: true,
      region: true,
    },
  },
  toAddress: {
    select: {
      id: true,
      postalCode: true,
      city: true,
      district: true,
      detail: true,
      region: true,
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
  // 견적 생성 (생성시 견적서 값이 있고 상태가 PROPOSED인 상태로 유효한 견적을 생성)
  createEstimate: async (
    estimateRequestId: string,
    moverId: string,
    price: number,
    comment: string
  ): Promise<EstimateWithRelations | null> => {
    // 견적 요청이 유효한지 확인
    const estimateRequest = await prisma.estimateRequest.findUnique({
      where: { id: estimateRequestId },
      select: { status: true, moveDate: true },
    });

    if (!estimateRequest) {
      throw new Error("견적 요청을 찾을 수 없습니다.");
    }

    if (estimateRequest.status !== "PENDING") {
      throw new Error("활성 상태가 아닌 견적 요청입니다.");
    }

    // 이사일이 지났는지 확인
    if (new Date() > estimateRequest.moveDate) {
      throw new Error("이사일이 지난 견적 요청입니다.");
    }

    // 이미 견적을 작성했는지 확인
    const existingEstimate = await prisma.estimate.findUnique({
      where: {
        estimateRequestId_moverId: {
          estimateRequestId: estimateRequestId,
          moverId: moverId,
        },
      },
    });

    if (existingEstimate) {
      throw new Error("이미 견적을 작성했습니다.");
    }

    const estimate = await prisma.estimate.create({
      data: {
        estimateRequestId: estimateRequestId,
        moverId: moverId,
        price: price,
        comment: comment,
        status: "PROPOSED",
        isDesignated: false,
      },
      select: estimateSelectOptions,
    });
    if (!estimate) return null;
    return estimate;
  },

  // 견적 반려 (생성시 견적서 값 0원 상태-REJECTED로 반려된 견적임을 명시)
  rejectEstimate: async (
    estimateRequestId: string,
    moverId: string,
    comment: string
  ): Promise<EstimateWithRelations | null> => {
    // 견적 요청이 유효한지 확인
    const estimateRequest = await prisma.estimateRequest.findUnique({
      where: { id: estimateRequestId },
      select: { status: true, moveDate: true },
    });

    if (!estimateRequest) {
      throw new Error("견적 요청을 찾을 수 없습니다.");
    }

    if (estimateRequest.status !== "PENDING") {
      throw new Error("활성 상태가 아닌 견적 요청입니다.");
    }

    // 이사일이 지났는지 확인
    if (new Date() > estimateRequest.moveDate) {
      throw new Error("이사일이 지난 견적 요청입니다.");
    }

    // 이미 견적을 작성했는지 확인
    const existingEstimate = await prisma.estimate.findUnique({
      where: {
        estimateRequestId_moverId: {
          estimateRequestId: estimateRequestId,
          moverId: moverId,
        },
      },
    });

    if (existingEstimate) {
      throw new Error("이미 견적을 작성했습니다.");
    }

    const estimate = await prisma.estimate.create({
      data: {
        estimateRequestId: estimateRequestId,
        moverId: moverId,
        comment: comment,
        status: "REJECTED",
        isDesignated: false,
      },
      select: estimateSelectOptions,
    });
    if (!estimate) return null;
    return estimate;
  },

  // 서비스 가능 지역 견적 조회 (정렬 및 필터링 옵션 포함)
  getRegionEstimateRequest: async (
    moverId: string,
    sortBy?: "moveDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ) => {
    const user = await prisma.user.findUnique({
      where: { id: moverId },
      select: { currentAreas: true },
    });
    const currentAreas = user?.currentAreas || [];

    let orderBy: any = {};
    let where: any = {
      status: "PENDING", // PENDING 상태만 조회
      moveDate: {
        gt: new Date(), // 오늘보다 미래인 이사일만 조회
      },
      customerId: {
        not: moverId, // 내가 고객으로서 생성한 견적 요청은 제외
      },
      estimates: {
        none: {
          moverId: moverId,
          status: { in: ["PROPOSED", "REJECTED"] },
        },
      },
      // 지정 견적 요청이 아닌 것만 조회
      designatedMovers: {
        none: {
          moverId: moverId,
        },
      },
    };

    // currentAreas가 있으면 해당 지역만 필터링
    if (currentAreas.length > 0) {
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

    where.NOT = {
      estimates: {
        some: {
          moverId: moverId,
          status: { in: ["PROPOSED", "REJECTED"] },
        },
      },
    };

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
      where: where,
      select: estimateRequestSelectOptions,
      orderBy: orderBy,
    });

    return estimateRequests;
  },

  // 지정 견적 모두 조회 (정렬 및 필터링 옵션 포함)
  getDesignatedEstimateRequest: async (
    moverId: string,
    sortBy?: "moveDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ) => {
    let orderBy: any = {};
    let where: any = {
      moverId: moverId,
      deletedAt: null,
      estimateRequest: {
        status: "PENDING", // estimateRequest의 상태를 PENDING으로 필터링
        moveDate: {
          gt: new Date(), // 오늘보다 미래인 이사일만 조회
        },
        customerId: {
          not: moverId, // 내가 고객으로서 생성한 견적 요청은 제외
        },
        estimates: {
          none: {
            moverId: moverId,
            status: { in: ["PROPOSED", "REJECTED"] }, // 견적을 보냈거나 반려한 경우
          },
        },
      },
    };

    // 고객 이름 필터링
    if (customerName) {
      where.estimateRequest = {
        customer: {
          name: {
            contains: customerName,
          },
        },
      };
    }

    // 이사 타입 필터링
    if (movingType) {
      where.estimateRequest = {
        ...where.estimateRequest,
        moveType: movingType,
      };
    }

    switch (sortBy) {
      case "moveDate":
        orderBy = { estimateRequest: { moveDate: "asc" } };
        break;
      case "createdAt":
        orderBy = { estimateRequest: { createdAt: "desc" } };
        break;
      default:
        orderBy = { estimateRequest: { createdAt: "desc" } }; // 기본값: 최신순
    }

    try {
      const designatedRequests = await prisma.designatedMover.findMany({
        where: where,
        select: {
          estimateRequest: {
            select: estimateRequestSelectOptions,
          },
        },
        orderBy: orderBy,
      });

      return designatedRequests.map((item) => item.estimateRequest);
    } catch (error) {
      console.error("getDesignatedEstimateRequest repository error:", error);
      console.error("에러 상세 정보:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : "Unknown",
      });
      throw error;
    }
  },

  // 견적 요청 상세 조회 - 1개
  getEstimateRequestById: async (estimateRequestId: string) => {
    const estimateRequest = await prisma.estimateRequest.findUnique({
      where: {
        id: estimateRequestId,
      },
      select: estimateRequestSelectOptions,
    });
    return estimateRequest;
  },

  // 내가 보낸 견적서들 조회
  getMyEstimate: async (moverId: string): Promise<TMyEstimateResponse[]> => {
    const estimates = await prisma.estimate.findMany({
      where: {
        moverId: moverId,
        status: {
          in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"],
        },
        estimateRequest: {
          customerId: {
            not: moverId, // 내가 고객으로서 생성한 견적 요청은 제외
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
      console.error("getMyRejectedEstimates repository error:", error);
      throw error;
    }
  },

  // 견적 상태 업데이트 (권한 검증 포함)
  updateEstimateStatus: async (
    estimateId: string,
    moverId: string,
    status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED"
  ): Promise<EstimateWithRelations | null> => {
    // 해당 견적이 현재 사용자의 것인지 확인
    const existingEstimate = await prisma.estimate.findUnique({
      where: {
        id: estimateId,
        moverId: moverId,
      },
    });

    if (!existingEstimate) {
      throw new Error("해당 견적에 대한 권한이 없습니다.");
    }

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
  },

  // 견적서 업데이트 (권한 검증 포함)
  updateEstimatePrice: async (
    estimateId: string,
    moverId: string,
    price: number,
    comment: string
  ): Promise<EstimateWithRelations | null> => {
    // 해당 견적이 현재 사용자의 것인지 확인
    const existingEstimate = await prisma.estimate.findUnique({
      where: {
        id: estimateId,
        moverId: moverId,
      },
    });

    if (!existingEstimate) {
      throw new Error("해당 견적에 대한 권한이 없습니다.");
    }

    // PROPOSED 상태의 견적만 수정 가능
    if (existingEstimate.status !== "PROPOSED") {
      throw new Error("수정 가능한 상태가 아닙니다.");
    }

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
  },

  // 견적 존재 여부 및 권한 확인
  checkEstimateOwnership: async (
    estimateId: string,
    moverId: string
  ): Promise<boolean> => {
    const estimate = await prisma.estimate.findUnique({
      where: {
        id: estimateId,
        moverId: moverId,
      },
    });
    return !!estimate;
  },
};

export default moverEstimateRepository;
