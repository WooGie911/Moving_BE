import { PrismaClient } from "@prisma/client";
import type {
  MoverListFilter,
  DesignatedQuoteRequestDto,
} from "../types/mover.types";
const prisma = new PrismaClient();

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
    take = 2,
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
      serviceAreas: {
        some: { region },
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
    orderBy: { [orderByField]: "desc" },
    skip: cursor ? 1 : 0,
    ...(cursor && { cursor: { id: String(cursor) } }),
    take: take + 1,
    select: {
      id: true,
      nickname: true,
      name: true,
      career: true,
      shortIntro: true,
      detailIntro: true,
      workedCount: true,
      averageRating: true,
      totalReviewCount: true,
      serviceAreas: true,
      serviceTypes: true,
      Favorite: true,
      moverImage: true,
    },
  });

  // career가 NULL인 경우 0으로 처리하여 정렬
  const sortedMovers = movers.map((mover) => ({
    ...mover,
    career: mover.career || 0,
    workedCount: mover.workedCount || 0,
    averageRating: mover.averageRating || 0,
    totalReviewCount: mover.totalReviewCount || 0,
  }));

  // 정렬 처리 (NULL 값은 0으로 처리됨)
  if (sort === "career") {
    sortedMovers.sort((a, b) => (b.career || 0) - (a.career || 0));
  } else if (sort === "confirmed") {
    sortedMovers.sort((a, b) => (b.workedCount || 0) - (a.workedCount || 0));
  } else if (sort === "rating") {
    sortedMovers.sort(
      (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
    );
  } else if (sort === "review") {
    sortedMovers.sort(
      (a, b) => (b.totalReviewCount || 0) - (a.totalReviewCount || 0)
    );
  }

  const hasNext = sortedMovers.length > take;
  const items = hasNext ? sortedMovers.slice(0, take) : sortedMovers;
  const nextCursor = hasNext ? items[items.length - 1]?.id : null;

  if (items.length === 0 && cursor) {
    const cursorRow = await prisma.user.findUnique({
      where: { id: String(cursor), deletedAt: null },
      select: {
        id: true,
        nickname: true,
        name: true,
        career: true,
        shortIntro: true,
        detailIntro: true,
        workedCount: true,
        averageRating: true,
        totalReviewCount: true,
        serviceAreas: true,
        serviceTypes: true,
        Favorite: true,
        moverImage: true,
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
    select: {
      id: true,
      nickname: true,
      name: true,
      career: true,
      shortIntro: true,
      detailIntro: true,
      workedCount: true,
      averageRating: true,
      totalReviewCount: true,
      serviceAreas: true,
      serviceTypes: true,
      moverImage: true,
      Favorite: true,
    },
  });

  if (!mover) return null;

  const favoriteCount = mover.Favorite.filter(
    (fav) => fav.deletedAt === null
  ).length;

  let isFavorited = false;
  if (userId) {
    const favorite = await prisma.favorite.findFirst({
      where: {
        customerId: userId,
        moverId: id,
        deletedAt: null,
      },
    });
    isFavorited = !!favorite;
  }

  return {
    ...mover,
    favoriteCount,
    isFavorited,
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
        select: {
          id: true,
          nickname: true,
          name: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          serviceAreas: true,
          serviceTypes: true,
          moverImage: true,
          Favorite: true, // 찜받은 관계 (moverId로 연결)
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
  const { quoteId, moverId, message, expiresAt } = dto;
  const exists = await prisma.designatedMover.findFirst({
    where: { estimateRequestId: quoteId, moverId },
  });
  if (exists) return null;
  return await prisma.designatedMover.create({
    data: {
      estimateRequestId: quoteId,
      moverId,
      message,
      expiresAt,
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
  return await prisma.designatedMover.findFirst({
    where: {
      estimateRequestId: quoteId,
      moverId,
      deletedAt: null,
    },
    select: {
      id: true,
      message: true,
      expiresAt: true,
      createdAt: true,
    },
  });
};

const moverRepository = {
  getMoverList,
  getFavoriteMovers,
  getMoverDetail,
  createDesignatedEstimateRequest,
  checkDesignatedEstimateRequest,
};

export default moverRepository;
