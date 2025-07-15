import { Estimate, PrismaClient } from "@prisma/client";
import { TConfirmEstimateResult, TDesignatedEstimateRequest, TEstimate, TQuote } from "../types/userQuote";
const prisma = new PrismaClient();

const userQuoteRepository = {
  //활성상태인 견적 아이디 조회
  getActiveQuote: async (userId: number): Promise<number | null> => {
    const activeQuote = await prisma.quote.findFirst({
      where: {
        userId: userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    if (!activeQuote) return null;
    return activeQuote.id;
  },

  // 견적 조회
  getEstimate: async (estimateId: number): Promise<Estimate | null> => {
    const estimate = await prisma.estimate.findUnique({
      where: {
        id: estimateId,
      },
    });
    if (!estimate) return null;
    return estimate;
  },

  // mover 유효성 검증용
  getMoverById: async (moverId: number) => {
    const mover = await prisma.user.findUnique({
      where: {
        id: moverId,
      },
      select: {
        id: true,
        name: true,
        currentRole: true,
      },
    });
    if (!mover) return null;
    return mover;
  },

  // 진행중인 이사 견적들 조회
  getPendingQuote: async (activeQuoteId: number): Promise<TQuote | null> => {
    const pendingQuotes = await prisma.quote.findUnique({
      where: {
        id: activeQuoteId,
      },
      select: {
        id: true,
        movingType: true,
        createdAt: true,
        departureAddr: true,
        arrivalAddr: true,
        departureDetail: true,
        status: true,
        confirmedEstimateId: true,
        estimateCount: true,
        designatedEstimateCount: true,

        estimates: {
          where: {
            price: {
              not: 0,
            },
          },
          select: {
            id: true,
            price: true,
            description: true,
            status: true,
            isDesignated: true,
            mover: {
              select: {
                id: true,
                name: true,
                currentRole: true, // 'MOVER'인지 확인용
                profile: {
                  select: {
                    nickname: true,
                    profileImage: true,
                    experience: true,
                    introduction: true,
                    description: true,
                    completedCount: true,
                    avgRating: true,
                    reviewCount: true,
                    favoriteCount: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!pendingQuotes) return null;
    return pendingQuotes;
  },

  //완료된 이사 견적들 조회
  getReceivedQuotes: async (userId: number): Promise<TQuote[] | null> => {
    const receivedQuotes = await prisma.quote.findMany({
      where: {
        userId: userId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        movingType: true,
        createdAt: true,
        departureAddr: true,
        arrivalAddr: true,
        departureDetail: true,
        status: true,
        confirmedEstimateId: true,
        estimateCount: true,
        designatedEstimateCount: true,

        estimates: {
          where: {
            price: {
              not: 0,
            },
          },
          select: {
            id: true,
            price: true,
            description: true,
            status: true,
            isDesignated: true,
            mover: {
              select: {
                id: true,
                name: true,
                currentRole: true, // 'MOVER'인지 확인용
                profile: {
                  select: {
                    nickname: true,
                    profileImage: true,
                    experience: true,
                    introduction: true,
                    description: true,
                    completedCount: true,
                    avgRating: true,
                    reviewCount: true,
                    favoriteCount: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return receivedQuotes;
  },

  //진행중인 이사 견적들 중 상세 견적 조회
  getPendingQuoteDetail: async (activeQuoteId: number, estimateId: number): Promise<TEstimate | null> => {
    const pendingDetailEstimate = await prisma.quote.findUnique({
      where: {
        id: activeQuoteId,
      },
      select: {
        estimates: {
          where: {
            id: estimateId,
            price: {
              not: 0,
            },
          },
          select: {
            id: true,
            price: true,
            description: true,
            status: true,
            isDesignated: true,
            mover: {
              select: {
                id: true,
                name: true,
                currentRole: true, // 'MOVER'인지 확인용
                profile: {
                  select: {
                    nickname: true,
                    profileImage: true,
                    experience: true,
                    introduction: true,
                    description: true,
                    completedCount: true,
                    avgRating: true,
                    reviewCount: true,
                    favoriteCount: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!pendingDetailEstimate) return null;
    return pendingDetailEstimate.estimates[0];
  },

  //완료된 이사 견적들 중 상세 견적 조회
  getReceivedQuoteDetail: async (userId: number, estimateId: number, quoteId: number): Promise<TEstimate | null> => {
    const receivedDetailEstimate = await prisma.quote.findUnique({
      where: {
        userId: userId,
        id: quoteId,
      },
      select: {
        estimates: {
          where: {
            id: estimateId,
            price: {
              not: 0,
            },
          },
          select: {
            id: true,
            price: true,
            description: true,
            status: true,
            isDesignated: true,
            mover: {
              select: {
                id: true,
                name: true,
                currentRole: true, // 'MOVER'인지 확인용
                profile: {
                  select: {
                    nickname: true,
                    profileImage: true,
                    experience: true,
                    introduction: true,
                    description: true,
                    completedCount: true,
                    avgRating: true,
                    reviewCount: true,
                    favoriteCount: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!receivedDetailEstimate) return null;
    return receivedDetailEstimate.estimates[0];
  },

  //견적 컨펌
  confirmEstimate: async (userId: number, estimateId: number): Promise<TConfirmEstimateResult | null> => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new Error("진행중인 견적이 없습니다.");
    }

    // estimate가 해당 quote에 속하는지 확인
    const estimate = await prisma.estimate.findFirst({
      where: {
        id: estimateId,
        quoteId: activeQuoteId,
      },
    });

    if (!estimate) {
      throw new Error("해당 견적을 찾을 수 없거나 권한이 없습니다.");
    }

    const [confirmedQuote, confirmedEstimate] = await prisma.$transaction([
      prisma.quote.update({
        where: {
          id: activeQuoteId,
        },
        data: {
          status: "CONFIRMED",
          confirmedEstimateId: estimateId,
        },
      }),
      prisma.estimate.update({
        where: {
          id: estimateId,
        },
        data: {
          status: "ACCEPTED",
        },
      }),
    ]);

    // 두 결과를 객체로 반환
    return {
      quote: confirmedQuote,
      estimate: confirmedEstimate,
    };
  },

  //지정견적요청 생성
  designateQuote: async (
    quoteId: number,
    userId: number,
    message: string,
    moverId: number,
  ): Promise<TDesignatedEstimateRequest | null> => {
    // quote가 해당 사용자의 것인지 확인
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        userId: userId,
      },
      select: {
        movingDate: true,
        status: true,
      },
    });

    if (!quote) {
      throw new Error("해당 견적을 찾을 수 없거나 권한이 없습니다.");
    }

    if (quote.status !== "ACTIVE") {
      throw new Error("진행중인 견적만 지정 견적을 요청할 수 있습니다.");
    }

    const validUntil = new Date(quote.movingDate.getTime() - 1000 * 60 * 60 * 24);

    // 이미 해당 quote에 대한 지정 견적 요청이 있는지 확인
    const existingRequest = await prisma.designatedEstimateRequest.findFirst({
      where: {
        quoteId: quoteId,
        customerId: userId,
        moverId: moverId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new Error("이미 해당 기사님에게 지정 견적을 요청했습니다.");
    }

    const designatedrequest = await prisma.designatedEstimateRequest.create({
      data: {
        quoteId: quoteId,
        customerId: userId,
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

export default userQuoteRepository;
