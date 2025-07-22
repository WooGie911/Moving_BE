import {
  EstimateRequest,
  Estimate,
  User,
  DesignatedMover,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const customerEstimateRequestRepository = {
  //활성상태인 견적 아이디 조회
  getActiveEstimateRequest: async (userId: string): Promise<string | null> => {
    const EstimateRequest = await prisma.estimateRequest.findFirst({
      where: {
        customerId: userId,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });
    if (!EstimateRequest) return null;
    return EstimateRequest.id;
  },

  // // 견적 조회
  // getEstimate: async (estimateRequestId: string): Promise<Estimate | null> => {
  //   const estimate = await prisma.estimate.findUnique({
  //     where: {
  //       id: estimateRequestId,
  //     },
  //   });
  //   if (!estimate) return null;
  //   return estimate;
  // },

  // mover 유효성 검증용
  getMoverById: async (
    moverId: string
  ): Promise<Pick<User, "id" | "name" | "userType"> | null> => {
    const mover = await prisma.user.findUnique({
      where: {
        id: moverId,
      },
      select: {
        id: true,
        name: true,
        userType: true,
      },
    });
    if (!mover) return null;
    return mover;
  },

  // 진행중인 이사 견적들 조회
  getPendingEstimateRequest: async (
    activeEstimateRequestId: string,
    customerId: string
  ): Promise<Record<string, any> | null> => {
    const pendingEstimateRequest = await prisma.estimateRequest.findUnique({
      where: {
        id: activeEstimateRequestId,
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
            postalCode: true,
            city: true,
            district: true,
            detail: true,
            region: true,
          },
        },
        toAddress: {
          select: {
            postalCode: true,
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
          },
          select: {
            id: true,
            price: true,
            comment: true,
            status: true,
            isDesignated: true,
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
                // 찜 여부 확인을 위한 Favorite 관계 추가
                Favorite: {
                  where: {
                    customerId: customerId,
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
    if (!pendingEstimateRequest) return null;

    // 각 견적의 무버에 대해 찜 여부를 boolean으로 변환
    const estimatesWithFavoriteStatus = pendingEstimateRequest.estimates.map(
      (estimate) => ({
        ...estimate,
        mover: {
          ...estimate.mover,
          isFavorite: estimate.mover.Favorite.length > 0,
          Favorite: undefined, // Favorite 배열은 제거
        },
      })
    );

    return {
      ...pendingEstimateRequest,
      estimates: estimatesWithFavoriteStatus,
    };
  },

  //완료된 이사 견적들 조회
  getReceivedEstimateRequests: async (
    userId: string
  ): Promise<Record<string, any>[] | null> => {
    const receivedEstimateRequests = await prisma.estimateRequest.findMany({
      where: {
        customerId: userId,
        status: "COMPLETED",
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
            postalCode: true,
            city: true,
            district: true,
            detail: true,
            region: true,
          },
        },
        toAddress: {
          select: {
            postalCode: true,
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
          },
          select: {
            id: true,
            price: true,
            comment: true,
            status: true,
            isDesignated: true,
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
                // 찜 여부 확인을 위한 Favorite 관계 추가
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

    // 각 견적 요청의 견적들에 대해 찜 여부를 boolean으로 변환
    const processedRequests = receivedEstimateRequests.map((request) => ({
      ...request,
      estimates: request.estimates.map((estimate) => ({
        ...estimate,
        mover: {
          ...estimate.mover,
          isFavorite: estimate.mover.Favorite.length > 0,
          Favorite: undefined, // Favorite 배열은 제거
        },
      })),
    }));

    return processedRequests;
  },

  //진행중인 이사 견적들 중 상세 견적 조회
  getPendingEstimateRequestDetail: async (
    activeEstimateRequestId: string,
    estimateId: string,
    customerId: string
  ): Promise<Record<string, any> | null> => {
    const pendingDetailEstimate = await prisma.estimateRequest.findUnique({
      where: {
        id: activeEstimateRequestId,
      },
      select: {
        id: true,
        moveType: true,
        moveDate: true,
        description: true,
        status: true,
        estimates: {
          where: {
            id: estimateId,
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
                // 찜 여부 확인을 위한 Favorite 관계 추가
                Favorite: {
                  where: {
                    customerId: customerId,
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
    if (!pendingDetailEstimate) return null;

    const estimate = pendingDetailEstimate.estimates[0];
    if (!estimate) return null;

    return {
      ...estimate,
      mover: {
        ...estimate.mover,
        isFavorite: estimate.mover.Favorite.length > 0,
        Favorite: undefined, // Favorite 배열은 제거
      },
    };
  },

  //완료된 이사 견적들 중 상세 견적 조회
  getReceivedEstimateRequestDetail: async (
    userId: string,
    estimateRequestId: string,
    estimateId: string
  ): Promise<Record<string, any> | null> => {
    const receivedDetailEstimate = await prisma.estimateRequest.findUnique({
      where: {
        customerId: userId,
        id: estimateRequestId,
      },
      select: {
        id: true,
        moveType: true,
        moveDate: true,
        description: true,
        status: true,
        estimates: {
          where: {
            id: estimateId,
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
                // 찜 여부 확인을 위한 Favorite 관계 추가
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
    if (!receivedDetailEstimate) return null;

    const estimate = receivedDetailEstimate.estimates[0];
    if (!estimate) return null;

    return {
      ...estimate,
      mover: {
        ...estimate.mover,
        isFavorite: estimate.mover.Favorite.length > 0,
        Favorite: undefined, // Favorite 배열은 제거
      },
    };
  },

  //견적 컨펌
  confirmEstimate: async (
    userId: string,
    estimateId: string
  ): Promise<{
    estimateRequest: EstimateRequest;
    estimate: Estimate;
  } | null> => {
    const activeEstimateRequestId =
      await customerEstimateRequestRepository.getActiveEstimateRequest(userId);
    if (!activeEstimateRequestId) {
      throw new Error("진행중인 견적요청이 없습니다.");
    }

    // estimate가 해당 estimateRequest에 속하는지 확인
    const estimate = await prisma.estimate.findUnique({
      where: {
        id: estimateId,
        estimateRequestId: activeEstimateRequestId,
      },
    });

    if (!estimate) {
      throw new Error(
        "현재 진행중인 견적요청에 대한 기사님들의 견적서가 존재하지 않습니다."
      );
    }

    const [confirmedEstimateRequest, acceptedEstimate, _] =
      await prisma.$transaction([
        // 1. 견적요청 상태 변경
        prisma.estimateRequest.update({
          where: { id: activeEstimateRequestId },
          data: { status: "APPROVED" },
        }),
        // 2. 선택된 기사님 견적 ACCEPTED
        prisma.estimate.update({
          where: { id: estimateId },
          data: { status: "ACCEPTED" },
        }),
        // 3. 나머지 기사님 견적 AUTO_REJECTED
        prisma.estimate.updateMany({
          where: {
            estimateRequestId: activeEstimateRequestId,
            id: { not: estimateId },
          },
          data: { status: "AUTO_REJECTED" },
        }),
      ]);

    // 두 결과를 객체로 반환
    return {
      estimateRequest: confirmedEstimateRequest,
      estimate: acceptedEstimate,
    };
  },

  //지정견적요청 생성
  designateEstimateRequest: async (
    estimateRequestId: string,
    userId: string,
    message: string,
    moverId: string
  ): Promise<DesignatedMover | null> => {
    // estimateRequest가 해당 사용자의 것인지 확인
    const estimateRequest = await prisma.estimateRequest.findFirst({
      where: {
        id: estimateRequestId,
        customerId: userId,
      },
      select: {
        moveDate: true,
        status: true,
      },
    });

    if (!estimateRequest) {
      throw new Error("해당 견적 요청을 찾을 수 없거나 권한이 없습니다.");
    }

    if (estimateRequest.status !== "PENDING") {
      throw new Error("진행중인 견적만 지정 견적을 요청할 수 있습니다.");
    }

    const validUntil = new Date(
      estimateRequest.moveDate.getTime() - 1000 * 60 * 60 * 24
    );

    // 이미 해당 estimateRequest에 대한 지정 견적 요청이 있는지 확인
    const existingRequest = await prisma.designatedMover.findFirst({
      where: {
        estimateRequestId: estimateRequestId,
        moverId: moverId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new Error("이미 해당 기사님에게 지정 견적을 요청했습니다.");
    }

    const designatedrequest = await prisma.designatedMover.create({
      data: {
        estimateRequestId: estimateRequestId,
        message: message,
        moverId: moverId,
        status: "PENDING",
        expiresAt: validUntil,
      },
    });

    if (!designatedrequest) return null;
    return designatedrequest;
  },
};

export default customerEstimateRequestRepository;
