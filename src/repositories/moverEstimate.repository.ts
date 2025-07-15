import { Estimate, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 공통 select 옵션
const quoteSelectOptions = {
  id: true,
  userId: true,
  movingType: true,
  movingDate: true,
  departureAddr: true,
  arrivalAddr: true,
  departureDetail: true,
  arrivalDetail: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      currentRole: true,
      currentRegion: true,
      profile: {
        select: {
          nickname: true,
          profileImage: true,
          introduction: true,
          description: true,
        },
      },
    },
  },
};

const moverEstimateRepository = {
  // 견적 생성 (생성시 견적서 값이 있고 상태가 pending인 상태로 유효한 견적을 생성)
  createEstimate: async (
    quoteId: number,
    userId: number,
    price: number,
    description: string
  ): Promise<Estimate | null> => {
    // 견적 요청이 유효한지 확인
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { status: true, movingDate: true },
    });

    if (!quote) {
      throw new Error("견적 요청을 찾을 수 없습니다.");
    }

    if (quote.status !== "ACTIVE") {
      throw new Error("활성 상태가 아닌 견적 요청입니다.");
    }

    // 이사일이 지났는지 확인
    if (new Date() > quote.movingDate) {
      throw new Error("이사일이 지난 견적 요청입니다.");
    }

    // 이미 견적을 작성했는지 확인
    const existingEstimate = await prisma.estimate.findUnique({
      where: {
        quoteId_moverId: {
          quoteId: quoteId,
          moverId: userId,
        },
      },
    });

    if (existingEstimate) {
      throw new Error("이미 견적을 작성했습니다.");
    }

    const estimate = await prisma.estimate.create({
      data: {
        quoteId: quoteId,
        moverId: userId,
        price: price,
        description: description,
        status: "PENDING",
        isDesignated: false,
      },
    });
    if (!estimate) return null;
    return estimate;
  },

  // 견적 반려 (생성시 견적서 값 0원 상태-반려 로 반려된 견적임을 명시)
  rejectEstimate: async (
    quoteId: number,
    userId: number,
    description: string
  ): Promise<Estimate | null> => {
    // 견적 요청이 유효한지 확인
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { status: true, movingDate: true },
    });

    if (!quote) {
      throw new Error("견적 요청을 찾을 수 없습니다.");
    }

    if (quote.status !== "ACTIVE") {
      throw new Error("활성 상태가 아닌 견적 요청입니다.");
    }

    // 이사일이 지났는지 확인
    if (new Date() > quote.movingDate) {
      throw new Error("이사일이 지난 견적 요청입니다.");
    }

    // 이미 견적을 작성했는지 확인
    const existingEstimate = await prisma.estimate.findUnique({
      where: {
        quoteId_moverId: {
          quoteId: quoteId,
          moverId: userId,
        },
      },
    });

    if (existingEstimate) {
      throw new Error("이미 견적을 작성했습니다.");
    }

    const estimate = await prisma.estimate.create({
      data: {
        quoteId: quoteId,
        moverId: userId,
        price: 0,
        description: description,
        status: "MOVER_REJECTED",
        isDesignated: false,
      },
    });
    if (!estimate) return null;
    return estimate;
  },

  // 서비스 가능 지역 견적 모두 조회 (정렬 및 필터링 옵션 포함)
  getRegionQuote: async (
    availableRegion: string,
    sortBy?: "movingDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ) => {
    let orderBy: any = {};
    let where: any = {
      status: "ACTIVE",
      departureAddr: {
        contains: availableRegion,
      },
      // 이사일이 지나지 않은 견적만 조회
      movingDate: {
        gte: new Date(),
      },
    };

    // 고객 이름 필터링
    if (customerName) {
      where.user = {
        name: {
          contains: customerName,
        },
      };
    }

    // 이사 타입 필터링
    if (movingType) {
      where.movingType = movingType;
    }

    switch (sortBy) {
      case "movingDate":
        orderBy = { movingDate: "asc" };
        break;
      case "createdAt":
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" }; // 기본값: 최신순
    }

    const quote = await prisma.quote.findMany({
      where: where,
      select: quoteSelectOptions,
      orderBy: orderBy,
    });
    return quote;
  },

  //지정 견적 모두 조회 (정렬 및 필터링 옵션 포함)
  getDesignatedQuote: async (
    moverId: number,
    sortBy?: "movingDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ) => {
    let orderBy: any = {};
    let where: any = {
      moverId: moverId,
      status: "PENDING",
      // 만료되지 않은 지정 견적만 조회
      expiresAt: {
        gte: new Date(),
      },
    };

    // 고객 이름 필터링
    if (customerName) {
      where.quote = {
        user: {
          name: {
            contains: customerName,
          },
        },
      };
    }

    // 이사 타입 필터링
    if (movingType) {
      where.quote = {
        ...where.quote,
        movingType: movingType,
      };
    }

    switch (sortBy) {
      case "movingDate":
        orderBy = { quote: { movingDate: "asc" } };
        break;
      case "createdAt":
        orderBy = { quote: { createdAt: "desc" } };
        break;
      default:
        orderBy = { quote: { createdAt: "desc" } }; // 기본값: 최신순
    }

    const quote = await prisma.designatedEstimateRequest.findMany({
      where: where,
      select: {
        quote: {
          select: quoteSelectOptions,
        },
      },
      orderBy: orderBy,
    });

    return quote.map((item) => item.quote);
  },

  // 견적 상세 조회 - 1개
  getQuoteById: async (quoteId: number) => {
    const quote = await prisma.quote.findUnique({
      where: {
        id: quoteId,
      },
      select: quoteSelectOptions,
    });
    return quote;
  },

  // 내가 보낸 견적서들 조회
  getMyEstimate: async (userId: number) => {
    const estimate = await prisma.estimate.findMany({
      where: {
        moverId: userId,
      },
      include: {
        quote: {
          select: quoteSelectOptions,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return estimate;
  },

  // 내가 반려한 견적들 조회
  getMyRejectedQuotes: async (userId: number) => {
    const rejectedQuotes = await prisma.estimate.findMany({
      where: {
        moverId: userId,
        status: "MOVER_REJECTED",
        price: 0,
      },
      select: {
        id: true,
        quoteId: true,
        price: true,
        description: true,
        status: true,
        createdAt: true,
        quote: {
          select: quoteSelectOptions,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return rejectedQuotes;
  },

  // 견적 상태 업데이트 (권한 검증 포함)
  updateEstimateStatus: async (
    estimateId: number,
    moverId: number,
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED"
  ): Promise<Estimate | null> => {
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
    });
    return estimate;
  },

  // 견적서 업데이트 (권한 검증 포함)
  updateEstimatePrice: async (
    estimateId: number,
    moverId: number,
    price: number,
    description: string
  ): Promise<Estimate | null> => {
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

    // PENDING 상태의 견적만 수정 가능
    if (existingEstimate.status !== "PENDING") {
      throw new Error("수정 가능한 상태가 아닙니다.");
    }

    const estimate = await prisma.estimate.update({
      where: {
        id: estimateId,
      },
      data: {
        price: price,
        description: description,
      },
    });
    return estimate;
  },

  // 견적 존재 여부 및 권한 확인
  checkEstimateOwnership: async (
    estimateId: number,
    moverId: number
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
