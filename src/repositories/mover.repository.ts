import prisma from "../db/prisma/prisma";
import type {
  MoverListFilter,
  DesignatedQuoteRequestDto,
} from "../types/mover.types";

/**
 * 기사님 리스트 조회
 */
export const getMoverList = async (filter: MoverListFilter) => {
  const {
    region,
    serviceType,
    search,
    sort = "review",
    cursor,
    take = 4,
  } = filter;

  const getServiceTypeEnum = (serviceTypeId: string | number) => {
    const id = Number(serviceTypeId);
    switch (id) {
      case 1:
        return "SMALL";
      case 2:
        return "HOME";
      case 3:
        return "OFFICE";
      default:
        return null;
    }
  };

  const serviceTypeEnum = serviceType ? getServiceTypeEnum(serviceType) : null;

  const where: any = {
    deletedAt: null,
    userType: { has: "MOVER" },
    ...(search && {
      OR: [{ nickname: { contains: search } }, { name: { contains: search } }],
    }),
    ...(serviceTypeEnum && {
      serviceTypes: { has: serviceTypeEnum },
    }),
    ...(region && {
      currentAreas: {
        has: region,
      },
    }),
  };

  const SORT_MAP: Record<string, string> = {
    rating: "averageRating",
    career: "career",
    confirmed: "workedCount",
    review: "totalReviewCount",
  };
  const orderByField = SORT_MAP[sort] || "totalReviewCount";

  const movers = await prisma.user.findMany({
    where,
    orderBy: [
      { [orderByField]: "desc" },
      { id: "asc" }, // 동일한 값일 때 ID로 정렬하여 일관성 보장
    ],
    skip: cursor ? 1 : 0,
    ...(cursor && { cursor: { id: String(cursor) } }),
    take: take + 1,
    include: {
      Favorite: true,
    },
  });

  // NULL 값 처리만 하고 정렬은 Prisma에서 처리된 결과 사용
  const processedMovers = movers.map((mover) => ({
    ...mover,
    career: mover.career || 0,
    workedCount: mover.workedCount || 0,
    averageRating: mover.averageRating || 0,
    totalReviewCount: mover.totalReviewCount || 0,
  }));

  const hasNext = processedMovers.length > take;
  const items = hasNext ? processedMovers.slice(0, take) : processedMovers;
  const nextCursor = hasNext ? items[items.length - 1]?.id : null;

  if (items.length === 0 && cursor) {
    const cursorRow = await prisma.user.findUnique({
      where: { id: String(cursor), deletedAt: null },
      include: {
        Favorite: true,
      },
    });
    if (cursorRow) {
      return { items: [cursorRow], nextCursor: null, hasNext: false };
    }
    return { items: [], nextCursor: null, hasNext: false };
  }

  return { items, nextCursor, hasNext };
};

/**
 * 기사님 상세 조회
 */
export const getMoverDetail = async (id: string, userId?: string) => {
  const mover = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: {
      Favorite: true,
    },
  });

  if (!mover) return null;

  const favoriteCount = mover.Favorite.filter(
    (fav) => fav.deletedAt === null
  ).length;

  let isFavorited = false;
  let activeEstimateRequest = null;

  if (userId) {
    const favorite = await prisma.favorite.findFirst({
      where: {
        customerId: userId,
        moverId: id,
        deletedAt: null,
      },
    });
    isFavorited = !!favorite;

    // 활성 견적 요청 조회
    activeEstimateRequest = await prisma.estimateRequest.findFirst({
      where: {
        customerId: userId,
        status: { in: ["PENDING", "APPROVED"] },
        moveDate: { gte: new Date() },
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        moveDate: true,
      },
    });
  }

  return {
    ...mover,
    favoriteCount,
    isFavorited,
    activeEstimateRequest,
  };
};

/**
 * 찜한 기사님 리스트 조회
 */
export const getFavoriteMovers = async (customerId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { customerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      mover: {
        include: {
          Favorite: true,
        },
      },
    },
  });

  return favorites.map((fav) => {
    const mover = fav.mover;
    // 찜 개수 계산 (deletedAt이 null이 아닌 것 제외)
    const favoriteCount = mover.Favorite.filter(
      (fav) => fav.deletedAt === null
    ).length;

    return {
      ...mover,
      favoriteCount,
    };
  });
};

/**
 * 지정 견적 요청 생성
 */
export const createDesignatedEstimateRequest = async (
  dto: DesignatedQuoteRequestDto
) => {
  const { quoteId, moverId } = dto;

  // 기존 요청 확인
  const existingRequest = await prisma.designatedMover.findFirst({
    where: { estimateRequestId: quoteId, moverId },
  });

  if (existingRequest) {
    // 모든 상태(PENDING, APPROVED, REJECTED 등)에서 생성 불가
    return null;
  }

  return await prisma.designatedMover.create({
    data: {
      estimateRequestId: quoteId,
      moverId,
    },
  });
};

/**
 * 지정 견적 요청 여부 조회
 */
export const checkDesignatedEstimateRequest = async (params: {
  quoteId: string;
  moverId: string;
}) => {
  const { quoteId, moverId } = params;
  const designatedRequest = await prisma.designatedMover.findFirst({
    where: {
      estimateRequestId: quoteId,
      moverId,
      deletedAt: null,
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
    },
  });

  // 지정견적요청이 있고, 상태가 COMPLETED가 아니면 요청한 것으로 간주
  // REJECTED(반려)된 경우는 다시 요청 가능하도록 null 반환
  if (designatedRequest && designatedRequest.status === "COMPLETED") {
    return null;
  }

  // REJECTED(반려)된 경우도 다시 요청 불가
  if (designatedRequest && designatedRequest.status === "REJECTED") {
    return designatedRequest;
  }

  return designatedRequest;
};

/**
 * 견적 상태 확인 (확정/완료된 견적은 지정 견적 요청 불가)
 */
export const checkEstimateRequestStatus = async (quoteId: string) => {
  const estimateRequest = await prisma.estimateRequest.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      status: true,
      moveDate: true,
    },
  });

  if (!estimateRequest) {
    return { isValid: false, reason: "견적을 찾을 수 없습니다." };
  }

  // 견적이 확정(APPROVED) 또는 완료(COMPLETED)된 경우만 제한
  if (
    estimateRequest.status === "APPROVED" ||
    estimateRequest.status === "COMPLETED"
  ) {
    return {
      isValid: false,
      reason: "확정되거나 완료된 견적에는 지정 견적을 요청할 수 없습니다.",
    };
  }

  return { isValid: true };
};

const moverRepository = {
  getMoverList,
  getFavoriteMovers,
  getMoverDetail,
  createDesignatedEstimateRequest,
  checkDesignatedEstimateRequest,
  checkEstimateRequestStatus,
};

export default moverRepository;
