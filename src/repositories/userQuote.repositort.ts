import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
//
const getActiveQuote = async (userId: number) => {
  const activeQuote = await prisma.quote.findFirst({
    where: {
      userId: userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });
  return activeQuote?.id;
};

//진행중인 이사 견적들 조회
const getPendingQuote = async (activeQuoteId: number) => {
  const pendingQuotes = await prisma.quote.findUnique({
    where: {
      id: activeQuoteId,
    },
    select: {
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
        select: {
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
  return pendingQuotes;
};
//완료된 이사 견적들 조회
const getReceivedQuotes = async (userId: number) => {
  const receivedQuotes = await prisma.quote.findMany({
    where: {
      userId: userId,
      status: "COMPLETED",
    },
    select: {
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
        select: {
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
};
//진행중인 이사 견적들 중 상세 견적 조회
const getPendingQuoteDetail = async (
  activeQuoteId: number,
  estimateId: number
) => {
  const pendingDetailEstimate = await prisma.quote.findUnique({
    where: {
      id: activeQuoteId,
    },
    select: {
      estimates: {
        where: {
          id: estimateId,
        },
        select: {
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
  return pendingDetailEstimate?.estimates;
};
//완료된 이사 견적들 중 상세 견적 조회
const getReceivedQuoteDetail = async (
  userId: number,
  estimateId: number,
  quoteId: number
) => {
  const receivedDetailEstimate = await prisma.quote.findUnique({
    where: {
      userId: userId,
      id: quoteId,
    },
    select: {
      estimates: {
        where: {
          id: estimateId,
        },
        select: {
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
  return receivedDetailEstimate?.estimates;
};

//견적 컨펌
const confirmEstimate = async (activeQuoteId: number, estimateId: number) => {
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
};

//지정견적요청 생성
const designateQuote = async (
  quoteId: number,
  userId: number,
  message: string,
  moverId: number
) => {
  const movingDate = await prisma.quote.findUnique({
    where: {
      id: quoteId,
    },
    select: {
      movingDate: true,
    },
  });
  const validUntil = new Date(
    movingDate.movingDate.getTime() - 1000 * 60 * 60 * 24
  );
  const designatedrequest = await prisma.designatedEstimateRequest.create({
    data: {
      quoteId: quoteId,
      customerId: userId,
      message: message,
      moverId: moverId,
      status: "PENDING",
      validUntil: validUntil,
    },
  });
  //지정견적은 무버 API만들고 더 손봐야 할지도..?
  return designatedrequest;
};

export default {
  getActiveQuote,
  getPendingQuote,
  getReceivedQuotes,
  getPendingQuoteDetail,
  getReceivedQuoteDetail,
  confirmEstimate,
  designateQuote,
};
